import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSeo, sitemap, robotsTxt, llmsTxt, llmsFullTxt } from '../apps/server/seo';
import { pageProps } from '../apps/server/page-props';
import { preloaderHead } from '../apps/server/preloader';
import { withMetrika } from '../apps/server/metrika';
import { staticPages, services } from '../apps/web/content';
import { visibleOffers, type Offer } from '../packages/contracts/offers';
import type { AppProps } from '../apps/web/App';

const root = process.cwd();
const output = path.join(root, 'dist/static');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'dist/client'), output, { recursive: true });
await cp(path.join(root, 'backend'), path.join(output, 'api'), { recursive: true });
const template = await readFile(path.join(root, 'dist/client/index.html'), 'utf8');
const { render } = await import(pathToFileURL(path.join(root, 'dist/server/entry-server.js')).href);
const offers = visibleOffers(JSON.parse(await readFile('data/offers.json', 'utf8')) as Offer[]);
const company = JSON.parse(await readFile('data/company.json', 'utf8'));
company.stories = company.stories.filter((s: { approved: boolean }) => s.approved);
const common = { offers, company, now: Date.now() };
const paths = [...Object.keys(staticPages).filter(p => !['/deliveries/', '/order/'].includes(p)), ...services.map(s => `/services/${s.slug}/`), ...offers.map(o => `/cars/${o.slug}/`)];
for (const url of [...paths, '/not-found/']) {
  const props: AppProps = pageProps({ ...common, url });
  const rendered = render(props);
  const seo = buildSeo(props, true);
  const html = withMetrika(template, true).replace('<!--head-->', seo.head)
    .replace('<!--preloader-head-->', rendered.status === 200 ? preloaderHead : '')
    .replace('<!--app-->', rendered.html)
    .replace('<!--data-->', `<script id="page-data" type="application/json">${JSON.stringify(props).replace(/</g, '\\u003c')}</script>`);
  const file = rendered.status === 404 ? path.join(output, '404.html') : path.join(output, url.slice(1), 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}
await writeFile(path.join(output, 'robots.txt'), robotsTxt(true));
await writeFile(path.join(output, 'sitemap.xml'), sitemap({ ...common, url: '/' }));
await writeFile(path.join(output, 'llms.txt'), llmsTxt({ ...common, url: '/' }));
await writeFile(path.join(output, 'llms-full.txt'), llmsFullTxt({ ...common, url: '/' }));
await writeFile(path.join(output, '.htaccess'), `Options -Indexes -MultiViews
DirectoryIndex index.html
ErrorDocument 404 /404.html
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{THE_REQUEST} \\s/+(.*/)?index\\.html(?:[?\\s]) [NC]
RewriteRule ^(.*)index\\.html$ https://carportchina.ru/$1 [R=301,L]
RewriteCond %{HTTP_HOST} ^www\\.carportchina\\.ru$ [NC]
RewriteRule ^ https://carportchina.ru%{REQUEST_URI} [R=301,L]
RewriteRule ^deliveries/?$ /reviews/ [R=301,L]
RewriteRule ^order/?$ /cars/ [R=301,L]
RewriteCond %{QUERY_STRING} (^|&)(q|brand|budget|vat|sort|availability)= [NC]
RewriteRule ^cars/?$ - [E=filtered_catalog:1]
</IfModule>
<IfModule mod_headers.c>
<FilesMatch "\\.html$">
Header set Cache-Control "no-cache"
</FilesMatch>
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
<FilesMatch "-[A-Za-z0-9_-]{8,}\\.(?:js|css|woff2)$">
Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
Header set X-Robots-Tag "noindex, follow" env=filtered_catalog
</IfModule>
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript application/json application/xml image/svg+xml
</IfModule>
`);
console.log(`Static site: ${paths.length} pages, 404, robots and sitemap in dist/static`);
