import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageCatalog, relatedPosts } from '../src/lib/page-catalog.ts';

const catalog = {
  extensions: [{ slug: 'checkout', partnerId: 'a', categoryId: 'checkout' }, { slug: 'search', partnerId: 'b', categoryId: 'search' }],
  partners: [{ id: 'a' }, { id: 'b' }], categories: [{ id: 'checkout' }, { id: 'search' }],
  services: [{ slug: 'install' }], seoLandings: [{ slug: 'seo' }],
  blogPosts: [
    { slug: 'one', tags: ['Magento', 'checkout'], content: [{ type: 'extension-card', extensionSlug: 'checkout' }], toc: [{ id: 'intro' }] },
    { slug: 'two', tags: ['Magento'], content: [{ type: 'p', text: 'Other article' }], toc: [] },
    { slug: 'three', tags: ['Magento', 'checkout'], content: [], toc: [] },
  ],
};

test('article keeps its blocks and referenced modules without transferring unrelated catalog data', () => {
  const scoped = pageCatalog(catalog, 'blog', 'one');
  assert.deepEqual(scoped.extensions.map(item => item.slug), ['checkout']);
  assert.deepEqual(scoped.partners, [{ id: 'a' }]);
  assert.deepEqual(scoped.categories, [{ id: 'checkout' }]);
  assert.deepEqual(scoped.blogPosts[0], catalog.blogPosts[0]);
  assert.equal(scoped.blogPosts.length, 3);
  assert.deepEqual(scoped.blogPosts[1].content, []);
  assert.equal(catalog.blogPosts[1].content.length, 1);
  assert.deepEqual(scoped.services, []);
});

test('blog index retains all article summaries and does not need module data', () => {
  const scoped = pageCatalog(catalog, 'blog');
  assert.deepEqual(scoped.extensions, []);
  assert.deepEqual(scoped.blogPosts.map(item => item.slug), ['one', 'two', 'three']);
  assert.ok(scoped.blogPosts.every(item => !item.content.length));
});

test('extension detail retains its dependencies and installation services', () => {
  const scoped = pageCatalog(catalog, 'extension', 'search');
  assert.deepEqual(scoped.extensions.map(item => item.slug), ['search']);
  assert.deepEqual(scoped.partners, [{ id: 'b' }]);
  assert.deepEqual(scoped.services, catalog.services);
  assert.deepEqual(scoped.blogPosts, []);
  assert.equal(pageCatalog(catalog, 'all'), catalog);
});

test('related guides exclude current article and prioritize shared specific tags', () => {
  assert.deepEqual(relatedPosts(catalog, 'one').map(item => item.slug), ['three', 'two']);
  assert.deepEqual(relatedPosts(catalog, 'missing'), []);
});
