import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articleHref, articleTextParts } from '../src/lib/article-text.ts';

test('article references produce links, emphasis and inline code without interpreting HTML', () => {
  const parts = articleTextParts('Read [the guide](https://support.google.com/merchants/answer/7052112?hl=en), use `item_group_id` and **review** <script>alert(1)</script>.');
  assert.deepEqual(parts.find(part => part.type === 'link'), { type: 'link', text: 'the guide', href: 'https://support.google.com/merchants/answer/7052112?hl=en' });
  assert.ok(parts.some(part => part.type === 'code' && part.text === 'item_group_id'));
  assert.ok(parts.some(part => part.type === 'strong' && part.text === 'review'));
  assert.ok(parts.some(part => part.type === 'text' && part.text.includes('<script>')));
});

test('unsafe protocols are plain text and site links use local routes', () => {
  for (const href of ['javascript:alert', 'data:text/html,evil', '//evil.example', '/\\evil.example', 'https://user:pass@example.com', 'https://example.com\n']) assert.equal(articleHref(href), undefined);
  assert.equal(articleHref('https://pubsetup.com/extension/data-feed-manager'), '/extension/data-feed-manager');
  assert.equal(articleHref('/blog/guide#example'), '/blog/guide#example');
  assert.equal(articleTextParts('[bad](javascript:evil)')[0].type, 'text');
});
