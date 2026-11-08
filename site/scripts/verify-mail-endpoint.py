"""Read-only and rejected-request checks; deliberately never submits a valid lead."""
import json
import subprocess
import tempfile
from pathlib import Path

URL = 'https://carportchina.ru/api/request.php'

def call(payload=None, origin='https://carportchina.ru'):
    with tempfile.TemporaryDirectory() as temp:
        headers = Path(temp) / 'headers'
        body = Path(temp) / 'body'
        args = ['curl', '-sS', '--max-time', '30', '-D', str(headers), '-o', str(body), '-w', '%{http_code}']
        if payload is not None:
            args += ['-H', 'Content-Type: application/json', '-H', 'Origin: ' + origin, '--data-binary', '@-']
        response = subprocess.run(args + [URL], input=json.dumps(payload) if payload is not None else None, text=True, capture_output=True, check=True)
        return int(response.stdout), json.loads(body.read_text('utf-8')), headers.read_text()

code, result, headers = call()
assert code == 200 and isinstance(result.get('token'), str), code
assert 'no-store' in headers and 'noindex' in headers
request = {'token': result['token'], 'name': 'Автоматическая проверка без отправки', 'contact': 'corp@carportchina.ru', 'consent': False, 'website': '', 'type': 'contact', 'page': '/contacts/', 'details': {}}
checks = [
    ('consent required', request, 'https://carportchina.ru', 422),
    ('foreign origin blocked', request, 'https://example.org', 403),
    ('invalid token blocked', {**request, 'token': 'invalid'}, 'https://carportchina.ru', 403),
    ('invalid contact blocked', {**request, 'consent': True, 'contact': 'invalid'}, 'https://carportchina.ru', 422),
    ('honeypot blocked', {**request, 'consent': True, 'website': 'spam'}, 'https://carportchina.ru', 422),
]
for label, payload, origin, expected in checks:
    code, result, _ = call(payload, origin)
    assert code == expected and result.get('ok') is False, (label, code)
    print(label + ': passed')
print('Endpoint checks passed; no email sent.')
