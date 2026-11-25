import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardExtension, collectionCatalog, pageCatalog, relatedPosts } from '../src/lib/page-catalog.ts';

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

test('listings transfer only selected cards, preserve their display data and omit detail content', () => {
  const item = { ...catalog.extensions[0], shortDescription: 'Card introduction', description: 'Long vendor body', gallery: ['/fallback.png'], features: ['Detail feature'], useCases: ['Detail use case'], magentoVersions: ['2.4.9'], tags: ['checkout'], priceFrom: 129, reviews: 4, rating: 4.8, installPrice: 60, userGuideUrl: 'https://vendor.example/guide' };
  const scoped = collectionCatalog(catalog, [item]);
  assert.equal(scoped.extensions.length, 1);
  const card = scoped.extensions[0];
  assert.equal(card.coverImage, '/fallback.png');
  for (const key of ['slug', 'shortDescription', 'tags', 'priceFrom', 'reviews', 'rating', 'installPrice', 'userGuideUrl']) assert.deepEqual(card[key], item[key]);
  assert.equal(card.description, '');
  assert.deepEqual(card.features, []);
  assert.deepEqual(card.gallery, []);
  assert.deepEqual(scoped.partners, [{ id: 'a' }]);
  assert.equal(item.description, 'Long vendor body');
  assert.deepEqual(scoped.blogPosts, []);
  assert.deepEqual(cardExtension(item), card);
});

test('filter choices include vendors and categories outside the current result page', () => {
  const scoped = collectionCatalog(catalog, [catalog.extensions[0]], { filters: true });
  assert.equal(scoped.extensions.length, 1);
  assert.deepEqual(scoped.partners, catalog.partners);
  assert.deepEqual(scoped.categories, catalog.categories);
  const empty = collectionCatalog({ ...catalog, partners: [{ id: 'a', slug: 'empty-vendor' }] }, [], { partner: 'empty-vendor' });
  assert.equal(empty.partners[0].slug, 'empty-vendor');
});

test('home transfers six featured cards and services, while services pages need no modules', () => {
  const extensions = Array.from({ length: 100 }, (_, i) => ({ ...catalog.extensions[0], slug: `module-${i}`, views: i, createdAt: '2026-11-01', description: 'Long detail text' }));
  const home = pageCatalog({ ...catalog, extensions }, 'home');
  assert.equal(home.extensions.length, 6);
  assert.equal(home.extensions[0].slug, 'module-99');
  assert.ok(home.extensions.every(item => !item.description));
  assert.deepEqual(home.services, catalog.services);
  const services = pageCatalog(catalog, 'services');
  assert.deepEqual(services.extensions, []);
  assert.deepEqual(services.services, catalog.services);
});
