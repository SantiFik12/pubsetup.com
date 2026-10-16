#!/usr/bin/env python3
"""Read-only HTTP checks for the Next.js + Symfony gateway."""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.request import Request, urlopen

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip -= 1
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', nargs='?', default='http://127.0.0.1:8085')
    parser.add_argument('--require-content', action='store_true', help='Fail if catalog has no extensions or services.')
    args = parser.parse_args(); base = args.base.rstrip('/')
    def get(path):
        with urlopen(Request(base + path, headers={'User-Agent': 'pubsetup-smoke'}), timeout=30) as r:
            return r.read().decode(), r.headers
    health, _ = get('/health'); assert json.loads(health)['status'] == 'ok'
    raw, _ = get('/api/catalog'); catalog = json.loads(raw)
    assert set(catalog) == {'partners', 'categories', 'extensions', 'services', 'blogPosts', 'seoLandings'}
    if args.require_content: assert catalog['extensions'] and catalog['services'], 'Catalog import is incomplete'
    paths = ['/', '/extensions', '/services', '/blog', '/checkout', '/compare', '/privacy', '/terms', '/refund', '/affiliate-disclosure']
    groups = [('extensions','extension','name'),('partners','partner','name'),('categories','category','name'),('services','services','name'),('blogPosts','blog','title'),('seoLandings','','title')]
    for key, prefix, title_key in groups:
        for item in catalog[key][:2]:
            path = '/' + (prefix+'/' if prefix else '') + item['slug']
            html, _ = get(path); text = Text(); text.feed(html)
            assert item[title_key] in ''.join(text.parts), f'Content missing from server HTML: {path}'
            assert 'rel="canonical"' in html, f'Missing canonical: {path}'
            paths.append(path)
    for path in paths:
        html, _ = get(path)
        assert '<h1' in html and '<html lang="en"' in html, f'Missing page HTML: {path}'
        if path in ('/checkout', '/compare'): assert 'noindex' in html
    sitemap, _ = get('/sitemap.xml'); assert '<urlset' in sitemap and base + '/checkout' not in sitemap
    robots, _ = get('/robots.txt'); assert 'Sitemap:' in robots
    try: get('/extension/this-product-does-not-exist')
    except HTTPError as error: assert error.code == 404, error.code
    else: raise AssertionError('Unknown product did not return HTTP 404')
    request = Request(base + '/api/orders', data=b'{"email":"invalid"}', headers={'Content-Type':'application/json'}, method='POST')
    try: urlopen(request, timeout=15)
    except HTTPError as error: assert error.code == 422, error.code
    else: raise AssertionError('Invalid order accepted')
    print(f'Smoke passed: {len(paths)} pages, server HTML, canonical, 404, sitemap, robots, API validation.')
    if not catalog['extensions']: print('Catalog is empty: import current content before launch.')
    return 0
if __name__ == '__main__':
    try: sys.exit(main())
    except Exception as error: print(f'Smoke failed: {error}', file=sys.stderr); sys.exit(1)
