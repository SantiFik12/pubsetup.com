import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectionPage } from '../src/lib/collection-page.ts';

const modules = Array.from({ length: 55 }, (_, i) => ({ slug: `module-${String(i).padStart(3, '0')}`, createdAt: '2026-11-01T00:00:00Z' })).reverse();

test('collections have bounded pages with stable complete coverage independent of database ties', () => {
  const first = collectionPage(modules, '/partner/example');
  const second = collectionPage([...modules].reverse(), '/partner/example', { page: '2' });
  const last = collectionPage(modules, '/partner/example', { page: '3' });
  assert.equal(first.items.length, 24);
  assert.equal(second.items.length, 24);
  assert.equal(last.items.length, 7);
  assert.equal(first.total, 55);
  assert.equal(new Set([...first.items, ...second.items, ...last.items].map(item => item.slug)).size, 55);
  assert.equal(modules[0].slug, 'module-054');
});

test('pagination canonicals identify each page and invalid or empty results are noindex', () => {
  assert.equal(collectionPage(modules, '/category/example').path, '/category/example');
  assert.equal(collectionPage(modules, '/category/example', { page: ['2'] }).path, '/category/example?page=2');
  assert.equal(collectionPage(modules, '/category/example', { page: '2' }).index, true);
  for (const page of ['-1', 'invalid', '999', '01']) assert.equal(collectionPage(modules, '/category/example', { page }).index, false);
  assert.equal(collectionPage([], '/category/empty').index, false);
});
