import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogDefaults, extensionListHref, extensionPage, filteredExtensions, paginationNumbers, readCatalogSearch } from '../src/lib/extension-list.ts';

const modules = Array.from({ length: 503 }, (_, index) => ({
  id: `m${index}`, slug: `module-${String(index).padStart(4, '0')}`, name: `Module ${index}`, description: 'Useful extension', shortDescription: '',
  partnerId: index % 2 ? 'b' : 'a', categoryId: index % 3 ? 'other' : 'catalog', tags: index % 5 ? [] : ['feed'],
  hyvaCompatible: index % 7 === 0, pwaReady: index % 11 === 0, priceFrom: index % 400, rating: 4.5, views: 0, createdAt: '2026-10-01',
})).reverse();
const partners = [{ id: 'a', name: 'Vendor Alpha' }, { id: 'b', name: 'Vendor Beta' }];

test('503 modules are split into bounded pages with complete coverage and no overlap', () => {
  const sorted = filteredExtensions(modules, partners, catalogDefaults);
  const ids = [];
  for (let number = 1; number <= 21; number++) {
    const page = extensionPage(sorted, String(number));
    assert.equal(page.page, number);
    assert.equal(page.pages, 21);
    assert.equal(page.items.length, number === 21 ? 23 : 24);
    ids.push(...page.items.map(item => item.id));
  }
  assert.equal(ids.length, 503);
  assert.equal(new Set(ids).size, 503);
  assert.equal(extensionPage(sorted, '2').items[0].slug, 'module-0024');
  assert.equal(extensionPage(sorted, '21').to, 503);
});

test('filters and search cover the full catalog before selecting a page', () => {
  const filtered = filteredExtensions(modules, partners, { ...catalogDefaults, partner: 'a', q: 'Vendor Alpha' });
  assert.equal(filtered.length, 252);
  const page = extensionPage(filtered, '2');
  assert.equal(page.total, 252);
  assert.equal(page.items.length, 24);
  assert.ok(page.items.every(item => item.partnerId === 'a'));
  assert.equal(page.items[0].slug, 'module-0048');
  const compatible = filteredExtensions(modules, partners, { ...catalogDefaults, cat: 'catalog', tag: 'feed', hyva: true });
  assert.ok(compatible.length > 0);
  assert.ok(compatible.every(item => item.categoryId === 'catalog' && item.tags.includes('feed') && item.hyvaCompatible));
  const free = filteredExtensions(modules, partners, { ...catalogDefaults, price: 'free' });
  assert.equal(free.length, 2);
});

test('ties have a stable order for all sorts and do not mutate catalog order', () => {
  const original = modules.map(item => item.id);
  for (const sort of ['popular', 'newest', 'cheapest', 'best-rated']) {
    const result = filteredExtensions(modules, partners, { ...catalogDefaults, sort });
    assert.deepEqual(result.map(item => item.id), filteredExtensions(modules, partners, { ...catalogDefaults, sort }).map(item => item.id));
    assert.equal(new Set([...extensionPage(result, '1').items, ...extensionPage(result, '2').items].map(item => item.id)).size, 48);
  }
  assert.deepEqual(modules.map(item => item.id), original);
});

test('empty, invalid and excessive page requests produce usable page boundaries', () => {
  for (const page of ['', 'oops', '-1', '1.5', '0']) assert.equal(extensionPage(modules, page).page, 1);
  assert.equal(extensionPage(modules, '9999999999999999999999').page, 21);
  const empty = extensionPage([], '50');
  assert.deepEqual([empty.page, empty.pages, empty.from, empty.to, empty.items.length], [1, 1, 0, 0, 0]);
});

test('pagination URLs retain all selected filters and first-page URLs omit page=1', () => {
  const search = { ...catalogDefaults, q: 'A & B', partner: 'a', cat: 'catalog', tag: 'feed', price: 'lt300', hyva: true, pwa: true, sort: 'cheapest' };
  const url = new URL(extensionListHref(search, 2), 'https://pubsetup.com');
  for (const [key, value] of Object.entries(search)) if (key !== 'page') assert.equal(url.searchParams.get(key), String(value));
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(new URL(extensionListHref(search, 1), url).searchParams.has('page'), false);
  assert.equal(extensionListHref(catalogDefaults, 1), '/extensions');
  assert.equal(readCatalogSearch({ page: ['2', '3'], hyva: ['true', 'false'] }).page, '2');
  assert.equal(readCatalogSearch({ hyva: 'false' }).hyva, false);
});

test('page navigation stays bounded for large catalogs and includes endpoints', () => {
  const numbers = paginationNumbers(12, 200);
  assert.equal(numbers[0], 1);
  assert.equal(numbers.at(-1), 200);
  assert.ok(numbers.includes(12));
  assert.ok(numbers.length <= 9);
  assert.deepEqual(paginationNumbers(1, 1), [1]);
});

test('search indexes 2000 modules once while matching names, descriptions, vendors and tags', () => {
  let descriptionReads = 0;
  const large = Array.from({ length: 2000 }, (_, index) => ({
    ...modules[index % modules.length], id: `large-${index}`, slug: `large-${index}`, name: `Catalog module ${index}`,
    shortDescription: 'Short searchable introduction', tags: ['uniquetag'],
    get description() { descriptionReads++; return 'Detailed searchable description. '.repeat(200); },
  }));
  for (const q of ['catalog module 1999', 'SHORT SEARCHABLE', 'detailed searchable', 'Vendor Alpha', 'uniquetag', 'missing phrase']) {
    const actual = filteredExtensions(large, partners, { ...catalogDefaults, q });
    if (q === 'catalog module 1999') assert.equal(actual[0]?.id, 'large-1999');
    else if (q === 'missing phrase') assert.equal(actual.length, 0);
    else assert.ok(actual.length > 0, `Missing matches for ${q}`);
  }
  assert.equal(descriptionReads, large.length, 'Keystrokes must reuse normalized text instead of re-reading and lowercasing every description');
});

test('search index refreshes when the catalog or vendor data is replaced', () => {
  const items = [{ ...modules[0], description: 'Original searchable description', partnerId: 'a' }];
  assert.equal(filteredExtensions(items, partners, { ...catalogDefaults, q: 'original searchable' }).length, 1);
  const refreshed = [{ ...items[0], description: 'Newly imported description' }];
  assert.equal(filteredExtensions(refreshed, partners, { ...catalogDefaults, q: 'newly imported' }).length, 1);
  assert.equal(filteredExtensions(refreshed, partners, { ...catalogDefaults, q: 'original searchable' }).length, 0);
  assert.equal(filteredExtensions(items, [{ id: 'a', name: 'Renamed Vendor' }], { ...catalogDefaults, q: 'renamed vendor' }).length, 1);
  assert.equal(filteredExtensions(items, partners, { ...catalogDefaults, q: 'renamed vendor' }).length, 0);
});
