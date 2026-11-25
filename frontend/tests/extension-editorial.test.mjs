import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extensionBuyingNote, withExtensionEditorial } from '../src/lib/extension-editorial.ts';
import { extensionMetadata } from '../src/lib/seo.ts';

const modules = [
  { slug: 'magento-2-zoho-inventory-integration', originalUrl: 'https://meetanshi.com/magento-2-zoho-inventory-integration.html' },
  { slug: 'data-feed-manager', originalUrl: 'https://www.wyomind.com/magento2/data-feed-manager-magento.html' },
  { slug: 'extra-fee', originalUrl: 'https://www.magedelight.com/extra-fee-magento-2.html' },
];

test('buying notes apply only to the intended product and supplier', () => {
  for (const item of modules) {
    assert.ok(extensionBuyingNote(item));
    assert.equal(extensionBuyingNote({ ...item, originalUrl: 'https://another-vendor.example/module' }), undefined);
    assert.equal(extensionBuyingNote({ ...item, originalUrl: 'not a URL' }), undefined);
  }
  assert.equal(extensionBuyingNote({ slug: 'unrelated' }), undefined);
});

test('editorial descriptions and metadata survive vendor-text changes without changing vendor facts', () => {
  for (const original of modules) {
    const item = { ...original, description: 'Imported vendor body', shortDescription: 'Truncated vendor text', seoTitle: 'Vendor title', priceFrom: 129, gallery: ['/photo.png'], updatedAt: '2026-10-01' };
    const result = withExtensionEditorial(item);
    const metadata = extensionMetadata(result);
    assert.equal(metadata.title, extensionBuyingNote(item).title);
    assert.ok(metadata.description.length <= 160);
    assert.equal(metadata.alternates.canonical, `https://pubsetup.com/extension/${item.slug}`);
    assert.equal(result.description, item.description);
    assert.equal(result.priceFrom, item.priceFrom);
    assert.equal(result.shortDescription, extensionBuyingNote(item).summary);
    assert.equal(result.updatedAt, '2026-11-25T00:00:00Z');
    assert.equal(item.shortDescription, 'Truncated vendor text');
    assert.equal(withExtensionEditorial({ ...item, shortDescription: 'New import' }).shortDescription, result.shortDescription);
  }
});

test('later vendor updates retain their modification date, and uncurated modules remain untouched', () => {
  const item = { ...modules[0], updatedAt: '2026-12-01T10:00:00Z' };
  assert.equal(withExtensionEditorial(item).updatedAt, item.updatedAt);
  const other = { slug: 'other' };
  assert.equal(withExtensionEditorial(other), other);
});
