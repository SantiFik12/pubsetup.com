import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryCollection, categoryExtensions } from '../src/lib/catalog-collections.ts';
import { catalogSitemap } from '../src/lib/sitemap.ts';
import { landingExtensions } from '../src/lib/seo.ts';

const make = (id, name, categoryId, extra = {}) => ({ id, slug: id, name, categoryId, tags: [], hyvaCompatible: false, createdAt: '2026-01-01', ...extra });
const catalog = {
  categories: [
    { id: 'combined', slug: 'seo-performance' }, { id: 'checkout', slug: 'checkout', updatedAt: '2026-10-20' },
    { id: 'seo', slug: 'seo' }, { id: 'navigation', slug: 'navigation-search' }, { id: 'privacy', slug: 'compliance' },
  ],
  extensions: [
    make('seo-toolkit', 'SEO Toolkit', 'combined'),
    make('page-cache', 'Full Page Cache', 'combined'),
    make('images', 'Image Optimizer', 'other'),
    make('one-step', 'One Step Checkout', 'checkout'),
    make('payment-restrictions', 'Payment Restrictions', 'payments'),
    make('navigation', 'Improved Layered Navigation', 'navigation', { description: 'SEO-friendly URLs improve checkout performance.' }),
    make('privacy', 'CCPA', 'privacy', { shortDescription: 'Hyva storefront and checkout integration.', hyvaCompatible: true }),
    make('theme', 'Hyvä Module', 'other', { tags: ['hyva'], description: 'Compatible with Hyvä.' }),
    make('generic', 'Store Toolkit', 'seo'),
    make('tagged', 'Store Enhancer', 'other', { tags: ['performance'], hyvaCompatible: true }),
    make('cachet', 'Cachet Suite', 'other'),
  ],
  partners: [], services: [], blogPosts: [], seoLandings: [],
};
const ids = list => list.map(item => item.id);

test('footer collections exist without separately seeded database categories', () => {
  const withoutCategories = { ...catalog, categories: [] };
  for (const slug of ['seo', 'checkout', 'performance', 'hyva-compatible']) {
    assert.equal(categoryCollection(withoutCategories, slug).category.slug, slug);
  }
  assert.equal(categoryCollection(catalog, 'missing'), undefined);
  assert.equal(categoryCollection(catalog, 'constructor'), undefined);
});

test('SEO and performance are split even when imported modules share one primary category', () => {
  assert.deepEqual(ids(categoryExtensions(catalog, 'seo')), ['seo-toolkit', 'generic']);
  assert.deepEqual(ids(categoryExtensions(catalog, 'performance')), ['page-cache', 'images', 'tagged']);
});

test('checkout includes related payment restrictions but excludes incidental descriptions', () => {
  assert.deepEqual(ids(categoryExtensions(catalog, 'checkout')), ['one-step', 'payment-restrictions']);
  assert.deepEqual(ids(categoryExtensions(catalog, 'navigation-search')), ['navigation']);
});

test('Hyva membership requires the catalog flag, never just a name, tag or marketing text', () => {
  assert.deepEqual(ids(categoryExtensions(catalog, 'hyva-compatible')), ['privacy', 'tagged']);
  assert.deepEqual(categoryExtensions({ ...catalog, extensions: [] }, 'hyva-compatible'), []);
  assert.deepEqual(categoryExtensions(catalog, 'toString'), []);
});

test('collections do not duplicate modules or mutate the catalog', () => {
  const before = JSON.stringify(catalog);
  const dualMatch = make('double', 'SEO Toolkit', 'seo', { tags: ['seo'] });
  assert.deepEqual(ids(categoryExtensions({ ...catalog, extensions: [dualMatch] }, 'seo')), ['double']);
  categoryExtensions(catalog, 'performance');
  assert.equal(JSON.stringify(catalog), before);
});

test('sitemap and editorial landing filters use the same collections as category pages', () => {
  const sitemap = catalogSitemap(catalog);
  for (const slug of ['seo', 'checkout', 'performance', 'hyva-compatible']) {
    const entries = sitemap.filter(item => new URL(item.url).pathname === `/category/${slug}`);
    assert.equal(entries.length, 1);
    assert.deepEqual(ids(landingExtensions(catalog, { filter: { categorySlug: slug } })), ids(categoryCollection(catalog, slug).extensions));
  }
  assert.equal(sitemap.find(item => new URL(item.url).pathname === '/category/checkout').lastModified, '2026-10-20T00:00:00.000Z');
  const empty = catalogSitemap({ ...catalog, categories: [], extensions: [] });
  assert.ok(!empty.some(item => new URL(item.url).pathname.startsWith('/category/')));
});
