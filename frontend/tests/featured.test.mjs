import assert from 'node:assert/strict';
import { test } from 'node:test';
import { featuredExtensions } from '../src/lib/featured.ts';

const makeExtension = (slug, views, createdAt = '2026-10-01') => ({ id: slug, slug, views, createdAt });

test('featured selects six modules by views without changing catalog order', () => {
  const modules = [makeExtension('a', 1), makeExtension('b', 70), makeExtension('c', 4), makeExtension('d', 90), makeExtension('e', 8), makeExtension('f', 12), makeExtension('g', 6), makeExtension('h', 40)];
  const original = modules.map(item => item.slug);
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['d', 'b', 'h', 'f', 'e', 'g']);
  assert.deepEqual(modules.map(item => item.slug), original);
});

test('ties use newer publication first, then stable slug order', () => {
  const modules = [makeExtension('old', 10, '2026-01-01'), makeExtension('z', 10), makeExtension('a', 10)];
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['a', 'z', 'old']);
});

test('empty, small and zero-view catalogs do not invent modules', () => {
  assert.deepEqual(featuredExtensions([]), []);
  const modules = [makeExtension('old', 0, '2026-01-01'), makeExtension('new', undefined)];
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['new', 'old']);
});
