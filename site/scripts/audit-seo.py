"""Read-only live SEO crawl. Timing samples are HTTP timings, not Core Web Vitals.

Uses curl because the hosting WAF may reject urllib's default user agent.
No forms, browser automation or external links are requested.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.parse import urljoin, urlsplit
import xml.etree.ElementTree as ET

BASE = 'https://carportchina.ru'
CURL = shutil.which('curl.exe') or shutil.which('curl')


def robots_allows(text, agent, path):
    # Longest matching path wins; Allow wins ties. urllib.robotparser instead
    # applies first-match ordering, which misreads Allow: / before Disallow: /api/.
    groups, agents, rules = [], [], []
    for raw in text.splitlines():
        line = raw.split('#', 1)[0].strip()
        if ':' not in line:
            continue
        key, value = (part.strip() for part in line.split(':', 1))
        key = key.lower()
        if key == 'user-agent':
            if rules:
                groups.append((agents, rules))
                agents, rules = [], []
            agents.append(value.lower())
        elif key in ('allow', 'disallow') and value:
            rules.append((value, key == 'allow'))
    groups.append((agents, rules))
    matches = [(max([len(a) if a != '*' else 0 for a in names
                     if a == '*' or a in agent.lower()], default=-1), rs) for names, rs in groups]
    best = max((rank for rank, _ in matches), default=-1)
    applicable = []
    for rank, rs in matches:
        if rank != best or rank < 0:
            continue
        for pattern, allow in rs:
            regex = '^' + re.escape(pattern).replace(r'\*', '.*')
            if pattern.endswith('$'):
                regex = regex[:-2] + '$'
            if re.search(regex, path):
                applicable.append((len(pattern.replace('*', '').rstrip('$')), allow))
    return max(applicable, default=(0, True))[1]


def fetch(url, follow=True, ua=None, head=False):
    with tempfile.TemporaryDirectory() as folder:
        headers, body = Path(folder) / 'headers', Path(folder) / 'body'
        args = [CURL, '--silent', '--show-error', '--compressed', '--max-time', '20',
                '--dump-header', str(headers), '--output', str(body), '--write-out', '%{json}']
        if follow:
            args.append('--location')
        if head:
            args.append('--head')
        if ua:
            args += ['--user-agent', ua]
        result = subprocess.run(args + [url], capture_output=True, text=True)
        try:
            timing = json.loads(result.stdout)
        except ValueError:
            timing = {}
        raw = headers.read_text(encoding='utf-8', errors='replace') if headers.exists() else ''
        blocks = [block for block in re.split(r'\r?\n\r?\n', raw.strip()) if block.startswith('HTTP/')]
        parsed = {}
        for line in (blocks[-1].splitlines()[1:] if blocks else []):
            if ':' in line:
                key, value = line.split(':', 1)
                parsed[key.lower()] = value.strip()
        data = body.read_bytes() if body.exists() else b''
        return {'url': url, 'status': timing.get('http_code', 0), 'effectiveUrl': timing.get('url_effective'),
                'headers': parsed, 'ttfbSeconds': timing.get('time_starttransfer'),
                'totalSeconds': timing.get('time_total'), 'downloadBytes': timing.get('size_download'),
                'decodedBytes': len(data), 'curlExit': result.returncode,
                'error': result.stderr.strip() or None}, data


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.h1 = []
        self.meta = {}
        self.canonicals = []
        self.images = []
        self.links = []
        self.assets = []
        self.ld = []
        self.ids = []
        self.tag = None
        self.ld_buffer = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag in ('title', 'h1'):
            self.tag = tag
            if tag == 'h1':
                self.h1.append('')
        if tag == 'meta':
            self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link':
            if a.get('rel') == 'canonical':
                self.canonicals.append(a.get('href'))
            if a.get('rel') in ('stylesheet', 'modulepreload'):
                self.assets.append(a.get('href'))
        if tag == 'img':
            self.images.append(a)
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag == 'script':
            if a.get('type') == 'application/ld+json':
                self.ld_buffer = ''
            if a.get('src'):
                self.assets.append(a['src'])

    def handle_endtag(self, tag):
        if tag == self.tag:
            self.tag = None
        if tag == 'script' and self.ld_buffer is not None:
            self.ld.append(self.ld_buffer)
            self.ld_buffer = None

    def handle_data(self, data):
        if self.tag == 'title':
            self.title += data
        if self.tag == 'h1':
            self.h1[-1] += data
        if self.ld_buffer is not None:
            self.ld_buffer += data


def crawl(url):
    response, body = fetch(url)
    page = Page()
    page.feed(body.decode('utf-8', errors='replace'))
    nodes, errors = [], []
    for raw in page.ld:
        try:
            value = json.loads(raw)
            nodes.extend(value.get('@graph', [value]) if isinstance(value, dict) else value)
        except ValueError as error:
            errors.append(str(error))
    ids = [node['@id'] for node in nodes if '@id' in node]
    return dict(response, title=page.title, description=page.meta.get('description'),
                h1=page.h1, robots=page.meta.get('robots'), canonicals=page.canonicals,
                jsonldScripts=len(page.ld), jsonldErrors=errors,
                schemaTypes=[node.get('@type') for node in nodes],
                duplicateSchemaIds=[key for key, n in Counter(ids).items() if n > 1],
                duplicateHtmlIds=[key for key, n in Counter(page.ids).items() if n > 1],
                imageCount=len(page.images), lazyImages=sum(i.get('loading') == 'lazy' for i in page.images),
                imagesMissingAlt=[i.get('src') for i in page.images if 'alt' not in i],
                imagesMissingDimensions=[i.get('src') for i in page.images if not i.get('width') or not i.get('height')],
                links=page.links, assets=page.assets, ids=page.ids)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='output/seo-audit-2026-11-08/before.json')
    args = parser.parse_args()
    sm_response, sm_body = fetch(BASE + '/sitemap.xml')
    urls = [node.text for node in ET.fromstring(sm_body).iter() if node.tag.endswith('}loc')]
    if any(urlsplit(url).netloc != urlsplit(BASE).netloc for url in urls):
        raise RuntimeError('Unexpected sitemap origin; refusing external crawl')
    with ThreadPoolExecutor(max_workers=4) as pool:
        pages = list(pool.map(crawl, dict.fromkeys(urls + [BASE + '/privacy/', BASE + '/consent/'])))
    known = {p['url']: p for p in pages}
    broken_links = []
    extra_paths = set()
    for page in pages:
        for href in page['links']:
            target = urlsplit(urljoin(page['url'], href))
            if target.netloc != urlsplit(BASE).netloc or target.scheme not in ('http', 'https'):
                continue
            canonical = BASE + target.path
            if canonical not in known:
                extra_paths.add(canonical)
            elif target.fragment and target.fragment not in known[canonical]['ids']:
                broken_links.append({'from': page['url'], 'href': href, 'reason': 'missing fragment'})
    with ThreadPoolExecutor(max_workers=4) as pool:
        extra = list(pool.map(lambda url: fetch(url, head=True)[0], sorted(extra_paths)))
    robot_response, robot_body = fetch(BASE + '/robots.txt')
    robots = robot_body.decode('utf-8', errors='replace')
    agents = ['Googlebot', 'YandexBot', 'bingbot', 'OAI-SearchBot', 'Claude-SearchBot']
    with ThreadPoolExecutor(max_workers=4) as pool:
        ua_checks = list(pool.map(lambda ua: dict(fetch(BASE + '/', ua=ua)[0], userAgent=ua,
                                                robotsAllowsHome=robots_allows(robots, ua, '/'),
                                                robotsAllowsApi=robots_allows(robots, ua, '/api/request.php')), agents))
    diagnostic_urls = [BASE + path for path in ['/deliveries/', '/order/', '/index.html', '/reviews/index.html',
                        '/cars', '/cars/?brand=Toyota', '/missing-seo-audit-check/', '/llms.txt']]
    diagnostic_urls += ['http://carportchina.ru/', 'https://www.carportchina.ru/']
    with ThreadPoolExecutor(max_workers=4) as pool:
        diagnostics = list(pool.map(lambda url: fetch(url, follow=False)[0], diagnostic_urls))
    assets = sorted({urljoin(BASE, src) for page in pages for src in page['assets'] if src})
    assets = [url for url in assets if urlsplit(url).netloc == urlsplit(BASE).netloc]
    with ThreadPoolExecutor(max_workers=4) as pool:
        asset_results = list(pool.map(lambda url: fetch(url)[0], assets))
    timing_samples = [fetch(BASE + '/')[0] for _ in range(3)]
    duplicates = {field: [key for key, n in Counter(p[field] for p in pages).items() if n > 1]
                  for field in ('title', 'description')}
    findings = []
    for p in pages:
        if p['status'] != 200 or len(p['h1']) != 1 or p['jsonldErrors'] or p['duplicateSchemaIds']:
            findings.append({'url': p['url'], 'status': p['status'], 'h1Count': len(p['h1']),
                             'jsonldErrors': p['jsonldErrors'], 'duplicateSchemaIds': p['duplicateSchemaIds']})
        if p['url'] in urls and ('noindex' in (p['robots'] or '') or p['canonicals'] != [p['url']]):
            findings.append({'url': p['url'], 'problem': 'sitemap/indexability/canonical mismatch'})
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(),
              'limitations': ['HTTP crawl covers server-rendered markup, not runtime-only additions.',
                              'HTTP timings are local samples, not Lighthouse or field Core Web Vitals.',
                              'User-agent probes do not prove access from verified crawler IP ranges.',
                              'Indexability does not prove actual search engine index inclusion.'],
              'sitemap': dict(sm_response, urls=urls), 'robots': dict(robot_response, content=robots),
              'pages': pages, 'duplicateMetadata': duplicates, 'findings': findings,
              'brokenAnchors': broken_links, 'extraInternalLinks': extra,
              'userAgentChecks': ua_checks, 'diagnostics': diagnostics,
              'assets': asset_results, 'homeTimingSamples': timing_samples}
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'output': str(out), 'pages': len(pages), 'sitemapUrls': len(urls),
                      'findings': findings, 'duplicateMetadata': duplicates,
                      'brokenAnchorCount': len(broken_links),
                      'diagnostics': [{k: r.get(k) for k in ('url', 'status', 'error')} for r in diagnostics]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
