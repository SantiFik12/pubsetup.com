import assert from 'node:assert/strict';
import { test } from 'node:test';
import { relatedExtensions } from '../src/lib/related-extensions.ts';

const item = (slug, name, categoryId = 'checkout') => ({ id: slug, slug, name, categoryId });
test('related products require a shared subject, exclude self and never fill with generic matches', () => {
  const source = item('fee', 'Extra Fee for Magento 2');
  const match = item('other', 'Magento 2 Extra Fee');
  assert.deepEqual(relatedExtensions([source, match, match, item('checkout', 'Magento 2 One Step Checkout'), item('generic', 'Magento 2 Extension')], source), [match]);
  assert.deepEqual(relatedExtensions([match], item('generic', 'Magento 2 Integration')), []);
  assert.deepEqual(relatedExtensions([item('zoho', 'Zoho CRM Integration')], item('inventory', 'Magento 2 Zoho Inventory Integration')), []);
  assert.deepEqual(relatedExtensions([item('unit', 'Price per Unit')], item('customer', 'Price per Customer')), []);
  assert.deepEqual(relatedExtensions([item('recommendations', 'AI Product Recommendations')], item('studio', 'AI Product Studio')), []);
});
test('new imports and source refreshes use current facts without saved recommendations', () => {
  const source = item('fee', 'Magento 2 Extra Fee');
  const imported = item('new-import', 'Extra Fee for Magento 2');
  assert.deepEqual(relatedExtensions([source], source), []);
  assert.deepEqual(relatedExtensions([source, imported], source), [imported]);
  assert.deepEqual(relatedExtensions([source, { ...imported, name: 'Magento 2 Inventory Reports' }], source), []);
});
test('results have a stable order independent of import order and a three-link maximum', () => {
  const source = item('fee', 'Extra Fee for Magento 2');
  const candidates = ['d', 'b', 'c', 'a'].map(slug => item(slug, 'Magento 2 Extra Fee'));
  assert.deepEqual(relatedExtensions(candidates, source).map(e => e.slug), ['a', 'b', 'c']);
  assert.deepEqual(relatedExtensions(candidates.reverse(), source).map(e => e.slug), ['a', 'b', 'c']);
});
