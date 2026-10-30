import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatExtensionPrice, isFreeExtension } from '../src/lib/extension-price.ts';

test('zero prices are FREE regardless of the imported license type', () => {
  for (const priceType of ['one-time', 'subscription', 'free']) {
    assert.equal(formatExtensionPrice({ priceFrom: 0, priceType }), 'FREE');
    assert.equal(isFreeExtension({ priceFrom: 0, priceType }), true);
  }
});

test('paid prices retain their amount, and explicit free licenses remain free', () => {
  assert.equal(formatExtensionPrice({ priceFrom: 199, priceType: 'one-time' }), 'from $199');
  assert.equal(formatExtensionPrice({ priceFrom: 59.95, priceType: 'subscription' }), 'from $59.95');
  assert.equal(formatExtensionPrice({ priceFrom: 199, priceType: 'free' }), 'FREE');
});
