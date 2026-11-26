import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { articleTextParts } from '../src/lib/article-text.ts';

const sql = readFileSync(new URL('../../backend/migrations/021_product_feed_guide.sql', import.meta.url), 'utf8');
const article = JSON.parse(sql.split('$article$')[1]);
const markdown = readFileSync(new URL('../../content/blog/magento-2-product-feeds-mapping-variants-and-validation.md', import.meta.url), 'utf8');

test('published article has its selected cover, complete table of contents and unchanged CSV', () => {
  assert.equal(article.published, true);
  assert.equal(article.date, '2026-11-26');
  assert.ok(existsSync(new URL(`../public${article.cover}`, import.meta.url)));
  assert.deepEqual(article.toc.map(item => item.label), article.content.filter(block => block.type === 'h2').map(block => block.text));
  assert.equal(new Set(article.toc.map(item => item.id)).size, article.toc.length);
  assert.equal(article.content.find(block => block.type === 'code').text, markdown.match(/```csv\n([\s\S]*?)\n```/)[1]);
  assert.equal(article.content.find(block => block.type === 'table').rows.length, 7);
  assert.equal(article.content.find(block => block.type === 'list' && block.ordered).items.length, 6);
  assert.ok(article.content.some(block => block.extensionSlug === 'data-feed-manager'));
  assert.ok(sql.includes('ON CONFLICT (slug) DO NOTHING'));
});

test('the article links to its module and primary sources instead of dropping Markdown links', () => {
  const links = article.content.flatMap(block => articleTextParts(block.text ?? '').filter(part => part.type === 'link'));
  assert.ok(links.some(link => link.href === '/extension/data-feed-manager'));
  assert.ok(links.some(link => link.href.startsWith('https://support.google.com/merchants/')));
  assert.ok(links.some(link => link.href.startsWith('https://experienceleague.adobe.com/')));
});
