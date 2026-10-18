import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extensionMetadata, pageMetadata, metaDescription, serializeJsonLd, landingExtensions, siteUrl } from '../src/lib/seo.ts';
import { catalogSitemap } from '../src/lib/sitemap.ts';
import { extensionSchema, serviceSchema } from '../src/lib/structured-data.ts';

const extension = { id: 'extension', slug: 'navigation', name: 'Navigation', shortDescription: 'Product filtering.', description: 'Product filtering and navigation.', partnerId: 'vendor', categoryId: 'category', priceFrom: 159, priceType: 'subscription', originalUrl: 'https://vendor.example/navigation', affiliateUrl: 'https://vendor.example/navigation?ref=ours', coverImage: '/media/modules/cover.png', gallery: [], tags: ['navigation'], rating: 4.5, reviews: 10, createdAt: '2026-01-01', updatedAt: '2026-10-17T07:00:00Z', hyvaCompatible: true };
const catalog = { extensions: [extension], categories: [{ id: 'category', slug: 'navigation', updatedAt: '2026-01-01' }, { id: 'empty', slug: 'empty' }], partners: [{ id: 'vendor', slug: 'vendor', updatedAt: '2026-01-01' }, { id: 'empty', slug: 'empty' }], services: [], blogPosts: [], seoLandings: [{ slug: 'filtered', filter: { partnerSlug: 'vendor', categorySlug: 'navigation' } }, { slug: 'empty', filter: { categorySlug: 'missing' } }] };

test('metadata has bounded descriptions, absolute canonical and per-page social images', () => {
  const metadata = pageMetadata({ title: 'Navigation', description: '<b>Useful</b> '.repeat(50), path: '/extension/navigation', image: extension.coverImage });
  assert.ok(metadata.description.length <= 160);
  assert.ok(!metadata.description.includes('<b>'));
  assert.equal(metadata.alternates.canonical, `${siteUrl}/extension/navigation`);
  assert.equal(metadata.openGraph.images[0].url, `${siteUrl}${extension.coverImage}`);
  assert.deepEqual(metadata.twitter.images, [`${siteUrl}${extension.coverImage}`]);
  assert.equal(metaDescription('   ', 'Fallback text'), 'Fallback text');
});

test('JSON-LD escapes script injection and preserves original data after decoding', () => {
  const payload = { name: '</script><script>alert(1)</script>&' };
  const serialized = serializeJsonLd(payload);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), payload);
});

test('products identify the vendor as seller and do not copy third-party ratings into JSON-LD', () => {
  const schema = extensionSchema(extension, { name: 'Vendor', website: 'https://vendor.example' });
  assert.equal(schema.offers.price, 159);
  assert.equal(schema.offers.seller.name, 'Vendor');
  assert.equal(schema.offers.url, extension.originalUrl);
  assert.ok(!('aggregateRating' in schema));
  assert.ok(!('offers' in extensionSchema({ ...extension, priceFrom: 0 })));
  assert.equal(extensionSchema({ ...extension, priceFrom: 0, priceType: 'free' }).offers.price, 0);
});

test('quote-only services do not advertise a free price', () => {
  assert.ok(!('offers' in serviceSchema({ slug: 'migration', name: 'Migration', description: 'Quote required', price: 0 })));
  assert.equal(serviceSchema({ slug: 'install', name: 'Install', description: 'Installation', price: 60 }).offers.price, 60);
  assert.equal(serviceSchema({ slug: 'development', name: 'Development', price: 400, unit: '$50/hr' }).offers.priceSpecification.minPrice, 400);
});

test('sitemap uses database modification dates and excludes empty sections and utility routes', () => {
  const sitemap = catalogSitemap(catalog);
  const paths = sitemap.map(item => new URL(item.url).pathname);
  assert.ok(paths.includes('/extension/navigation'));
  assert.ok(paths.includes('/category/navigation'));
  assert.ok(paths.includes('/filtered'));
  for (const path of ['/empty', '/category/empty', '/partner/empty', '/blog', '/services', '/admin_panel', '/checkout', '/compare']) assert.ok(!paths.includes(path), path);
  assert.equal(sitemap.find(item => item.url.endsWith('/extension/navigation')).lastModified, '2026-10-17T07:00:00.000Z');
  assert.equal(sitemap.find(item => item.url.endsWith('/category/navigation')).lastModified, '2026-10-17T07:00:00.000Z');
  assert.ok(!('lastModified' in sitemap.find(item => item.url.endsWith('/privacy'))));
  assert.equal(new Set(sitemap.map(item => item.url)).size, sitemap.length);
});

test('landing filters match the page contents, including partner and missing category', () => {
  assert.equal(landingExtensions(catalog, catalog.seoLandings[0]).length, 1);
  assert.equal(landingExtensions(catalog, catalog.seoLandings[1]).length, 0);
  assert.equal(landingExtensions(catalog, { filter: { partnerSlug: 'missing' } }).length, 0);
});


test('module SEO fields control search and social metadata independently of card content', () => {
  const item = { ...extension, seoTitle: 'Magento 2 Navigation | Product Filters', seoDescription: 'Find products using configurable filters in Magento 2. Compare module features and installation options.' };
  const metadata = extensionMetadata(item);
  assert.equal(metadata.title, item.seoTitle);
  assert.equal(metadata.description, item.seoDescription);
  assert.equal(metadata.openGraph.title, item.seoTitle);
  assert.equal(metadata.twitter.description, item.seoDescription);
  assert.equal(item.name, 'Navigation');
  assert.equal(extensionMetadata(extension).title, extension.name);
});
