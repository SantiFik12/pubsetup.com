import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const original = await readFile(new URL('../public/assets/magento-demo-preview.png', import.meta.url));
const filename = `${randomBytes(20).toString('hex')}.png`;
let available = false;
const gateway = createServer((request, response) => {
  if (!available || request.url !== `/media/modules/${filename}`) return response.writeHead(404).end();
  response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' });
  response.end(original);
});
await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
const port = Number(process.env.IMAGE_TEST_PORT ?? 3197);
const origin = `http://127.0.0.1:${port}`;
let logs = '';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  env: { ...process.env, NODE_ENV: 'production', API_INTERNAL_URL: `http://127.0.0.1:${gateway.address().port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
});
app.stdout.on('data', data => { logs += data; });
app.stderr.on('data', data => { logs += data; });
const imagePath = `/media/modules/${filename}`;
const optimized = (width, quality = 75) => `${origin}/_next/image?url=${encodeURIComponent(imagePath)}&w=${width}&q=${quality}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(logs);
    try { ready = (await fetch(`${origin}/healthz`)).ok; } catch { /* Wait for local startup. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs);
  // New uploads must work after the Next server has already started.
  available = true;
  const response = await fetch(optimized(384), { headers: { Accept: 'image/webp' } });
  assert.equal(response.status, 200, await response.clone().text());
  assert.match(response.headers.get('content-type'), /image\/webp/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal((await sharp(bytes).metadata()).width, 384);
  const cached = await fetch(optimized(384), { headers: { Accept: 'image/webp' } });
  assert.equal(cached.headers.get('x-nextjs-cache'), 'HIT');
  const full = await fetch(optimized(1200, 85), { headers: { Accept: 'image/webp' } });
  assert.equal(full.status, 200);
  assert.equal((await sharp(Buffer.from(await full.arrayBuffer())).metadata()).width, 1200);
  const thumbnail = await fetch(optimized(128), { headers: { Accept: 'image/webp' } });
  assert.equal(thumbnail.status, 200);
  assert.equal((await sharp(Buffer.from(await thumbnail.arrayBuffer())).metadata()).width, 128);
  assert.equal((await fetch(`${origin}/media/modules/invalid.png`)).status, 404);
  assert.equal((await fetch(`${origin}/_next/image?url=/api/catalog&w=384&q=75`)).status, 400);
  assert.equal((await fetch(`${origin}/_next/image?url=${encodeURIComponent('https://127.0.0.1/private.png')}&w=384&q=75`)).status, 400);
  console.log(`Image HTTP checks passed: dynamic upload, WebP, three sizes, cache HIT, path and private-IP restrictions. Original ${original.length} bytes; 384px WebP ${bytes.length} bytes.`);
} finally {
  app.kill('SIGTERM');
  await new Promise(resolve => app.exitCode !== null ? resolve() : app.once('exit', resolve));
  await new Promise(resolve => gateway.close(resolve));
}
