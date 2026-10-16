#!/usr/bin/env python3
"""Export application tables and optionally mirror Supabase public media. No third party dependencies."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlparse, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

PUBLIC_TABLES = ['partners', 'categories', 'extensions', 'services', 'blog_posts', 'seo_landings', 'app_settings']
PRIVATE_TABLES = ['orders', 'contact_messages', 'suppressed_emails', 'email_unsubscribe_tokens', 'email_send_log']

def export(env, public_only, media_dir):
    base = (env.get('SUPABASE_URL') or env.get('VITE_SUPABASE_URL') or '').rstrip('/')
    key = (env.get('SUPABASE_PUBLISHABLE_KEY') or env.get('VITE_SUPABASE_PUBLISHABLE_KEY')) if public_only else env.get('SUPABASE_SERVICE_ROLE_KEY')
    parsed = urlparse(base)
    if parsed.scheme != 'https' or not parsed.netloc or not key:
        raise ValueError('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or a publishable key with --public-only).')
    tables = PUBLIC_TABLES if public_only else PUBLIC_TABLES + PRIVATE_TABLES
    data = {}
    for table in tables:
        rows = []
        while True:
            # Stable pagination, including when PostgREST applies a page-size cap.
            query = urlencode({'select': '*', 'order': 'id.asc', 'offset': len(rows), 'limit': 500})
            request = Request(f'{base}/rest/v1/{table}?{query}', headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Accept': 'application/json'})
            with urlopen(request, timeout=60) as response:
                page = json.load(response)
            if not isinstance(page, list):
                raise ValueError(f'Unexpected response for {table}')
            if not page:
                break
            rows.extend(page)
        data[table] = rows
        print(f'{table}: {len(rows)}', file=sys.stderr)
    if media_dir:
        media_dir.mkdir(parents=True, exist_ok=True)
        mirrored = {}
        def replace(value):
            if isinstance(value, list):
                return [replace(item) for item in value]
            if isinstance(value, dict):
                return {name: replace(item) for name, item in value.items()}
            if not isinstance(value, str):
                return value
            url = urlparse(value)
            if url.scheme != 'https' or url.netloc != parsed.netloc or not url.path.startswith('/storage/v1/object/public/'):
                return value
            if value not in mirrored:
                suffix = Path(url.path).suffix.lower()
                if not re.fullmatch(r'\.(png|jpe?g|webp|avif|gif|svg|ico|pdf)', suffix):
                    suffix = '.bin'
                filename = hashlib.sha256(value.encode()).hexdigest() + suffix
                target = media_dir / filename
                if not target.exists():
                    with urlopen(value, timeout=60) as response:
                        content = response.read(25 * 1024 * 1024 + 1)
                    if len(content) > 25 * 1024 * 1024:
                        raise ValueError('Media file exceeds 25 MiB')
                    temporary = target.with_suffix(target.suffix + '.partial')
                    temporary.write_bytes(content)
                    temporary.replace(target)
                mirrored[value] = f'/media/{filename}'
            return mirrored[value]
        data = replace(data)
        print(f'Mirrored media: {len(mirrored)}', file=sys.stderr)
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--env-file', type=Path, help='Optional dotenv file. Existing process variables take precedence.')
    parser.add_argument('--public-only', action='store_true', help='Catalog only. Does not migrate orders, email history or unsubscribes.')
    parser.add_argument('--media-dir', type=Path, help='Use frontend/public/media to remove public Supabase image dependencies.')
    args = parser.parse_args()
    env = {}
    if args.env_file:
        for line in args.env_file.read_text().splitlines():
            if line.strip() and not line.lstrip().startswith('#') and '=' in line:
                name, value = line.split('=', 1)
                env[name.strip()] = value.strip().strip('\"\'')
    env.update(os.environ)
    try:
        data = export(env, args.public_only, args.media_dir)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        # Exclusive creation avoids overwriting an earlier migration snapshot.
        with open(args.output, 'x', encoding='utf-8', opener=lambda p, flags: os.open(p, flags, 0o600)) as handle:
            json.dump(data, handle, ensure_ascii=False)
            handle.write('\n')
    except Exception as error:
        # Never print an HTTP body or credentials from environment variables.
        detail = f'HTTP {error.code}' if isinstance(error, HTTPError) else str(error.reason) if isinstance(error, URLError) else type(error).__name__
        print(f'Export failed: {detail}. Check connectivity, credentials, table permissions and output path.', file=sys.stderr)
        return 1
    print(f'Export written to {args.output}', file=sys.stderr)
    return 0

if __name__ == '__main__':
    sys.exit(main())
