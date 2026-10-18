import assert from 'node:assert/strict';
import { test } from 'node:test';
import { featuredExtensions } from '../src/lib/featured.ts';

const module = (slug, views, createdAt = '2026-10-01') => ({ id: slug, slug, views, createdAt });

test('featured selects six modules by views without changing catalog order', () => {
  const modules = [module('a', 1), module('b', 70), module('c', 4), module('d', 90), module('e', 8), module('f', 12), module('g', 6), module('h', 40)];
  const original = modules.map(item => item.slug);
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['d', 'b', 'h', 'f', 'e', 'g']);
  assert.deepEqual(modules.map(item => item.slug), original);
});

test('ties use newer publication first, then stable slug order', () => {
  const modules = [module('old', 10, '2026-01-01'), module('z', 10), module('a', 10)];
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['a', 'z', 'old']);
});

test('empty, small and zero-view catalogs do not invent modules', () => {
  assert.deepEqual(featuredExtensions([]), []);
  const modules = [module('old', 0, '2026-01-01'), module('new', undefined)];
  assert.deepEqual(featuredExtensions(modules).map(item => item.slug), ['new', 'old']);
});
