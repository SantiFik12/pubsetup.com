import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlparse, parse_qs

spec = importlib.util.spec_from_file_location('export_supabase', Path(__file__).parents[1] / 'export-supabase.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ExportTests(unittest.TestCase):
    def test_pagination_media_and_exclusive_private_snapshot(self):
        calls = []
        def fetch(request, timeout=60):
            url = request.full_url if hasattr(request, 'full_url') else request
            calls.append(url)
            if '/rest/v1/' in url:
                table = urlparse(url).path.rsplit('/', 1)[-1]
                offset = int(parse_qs(urlparse(url).query)['offset'][0])
                rows = [] if offset else [{'id': 'row', 'cover': 'https://project.supabase.co/storage/v1/object/public/images/test.png', 'gallery': ['https://cdn.example.org/unchanged.png']}] if table == 'blog_posts' else []
                return io.BytesIO(json.dumps(rows).encode())
            return io.BytesIO(b'png-bytes')
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / 'snapshot.json'; media = Path(directory) / 'media'
            env = {'SUPABASE_URL': 'https://project.supabase.co', 'SUPABASE_PUBLISHABLE_KEY': 'fake-public-key'}
            argv = ['export', '--public-only', '--output', str(out), '--media-dir', str(media)]
            with patch.object(module, 'urlopen', side_effect=fetch), patch.dict(os.environ, env, clear=True), patch('sys.argv', argv), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(module.main(), 0)
                data = json.loads(out.read_text())
                self.assertNotIn('orders', data)
                self.assertTrue(data['blog_posts'][0]['cover'].startswith('/media/'))
                self.assertEqual(data['blog_posts'][0]['gallery'], ['https://cdn.example.org/unchanged.png'])
                self.assertEqual(len(list(media.glob('*.png'))), 1)
                self.assertEqual(out.stat().st_mode & 0o777, 0o600)
                self.assertEqual(module.main(), 1)
            self.assertTrue(any('offset=1' in url for url in calls))

    def test_full_export_requires_service_key(self):
        with self.assertRaises(ValueError):
            module.export({'SUPABASE_URL': 'https://project.supabase.co', 'SUPABASE_PUBLISHABLE_KEY': 'public'}, False, None)

if __name__ == '__main__':
    unittest.main()
