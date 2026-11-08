"""Upload only the built site inside /carportchina.ru, without deleting remote files."""
import concurrent.futures
import ftplib
import hashlib
import io
import json
import os
from pathlib import Path

BASE = '/carportchina.ru'
BUILD = Path('dist/static').resolve()
MANIFEST = '.carport-deploy.json'

def connect():
    ftp = ftplib.FTP(timeout=90)
    ftp.connect(os.environ['FTP_HOST'], int(os.environ.get('FTP_PORT', '21')))
    ftp.login(os.environ['FTP_USERNAME'], os.environ['FTP_PASSWORD'])
    ftp.cwd(BASE)
    if ftp.pwd().rstrip('/') != BASE:
        raise RuntimeError('Unexpected FTP target directory')
    return ftp

def remote(relative):
    if relative.startswith('/') or '..' in relative.split('/') or '\\' in relative:
        raise ValueError('Invalid deploy path')
    return BASE + '/' + relative

def upload(ftp, relative, content):
    destination = remote(relative)
    temporary = destination + '.upload-' + hashlib.sha256(content).hexdigest()[:12]
    ftp.storbinary('STOR ' + temporary, io.BytesIO(content), blocksize=262144)
    ftp.rename(temporary, destination)

if __name__ == '__main__':
    if not (BUILD / 'reviews/index.html').is_file() or not (BUILD / 'sitemap.xml').is_file():
        raise RuntimeError('Complete static build is required')
    files = {p.relative_to(BUILD).as_posix(): p for p in BUILD.rglob('*') if p.is_file()}
    hashes = {name: hashlib.sha256(p.read_bytes()).hexdigest() for name, p in files.items()}
    ftp = connect()
    previous = {}
    try:
        buffer = io.BytesIO()
        ftp.retrbinary('RETR ' + remote(MANIFEST), buffer.write)
        previous = json.loads(buffer.getvalue())['files']
    except ftplib.error_perm as error:
        if not str(error).startswith('550'):
            raise
    # Keep a rollback copy of every existing entry file in the Actions artifact.
    backup = Path('deploy-backup')
    backup.mkdir(exist_ok=True)
    for name in files:
        if name.endswith('.html') or name in ['robots.txt', 'sitemap.xml', '.htaccess']:
            data = io.BytesIO()
            try:
                ftp.retrbinary('RETR ' + remote(name), data.write)
            except ftplib.error_perm as error:
                if str(error).startswith('550'):
                    continue
                raise
            target = backup / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data.getvalue())
    folders = sorted({str(Path(n).parent).replace('\\', '/') for n in files if '/' in n}, key=lambda n: n.count('/'))
    for folder in folders:
        current = ''
        for part in folder.split('/'):
            current = current + '/' + part if current else part
            try:
                ftp.mkd(remote(current))
            except ftplib.error_perm as error:
                # Verify that an existing path is a directory rather than hiding permission errors.
                ftp.cwd(remote(current))
                ftp.cwd(BASE)
    changed = [n for n in files if previous.get(n) != hashes[n]]
    assets = [n for n in changed if not n.endswith('.html') and n not in ['.htaccess', 'robots.txt', 'sitemap.xml']]
    def batch(names):
        connection = connect()
        try:
            for name in names:
                upload(connection, name, files[name].read_bytes())
        finally:
            connection.quit()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(batch, [assets[i::4] for i in range(4)]))
    for name in sorted(set(changed) - set(assets), key=lambda n: (n == '.htaccess', n == 'index.html', n)):
        upload(ftp, name, files[name].read_bytes())
    upload(ftp, MANIFEST, json.dumps({'commit': os.environ.get('GITHUB_SHA', ''), 'files': hashes}).encode())
    ftp.quit()
    print(f'Deployed {len(changed)} files to {BASE}; no remote files deleted.')
