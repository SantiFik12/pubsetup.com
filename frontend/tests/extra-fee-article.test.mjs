import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { moduleGuides } from '../src/lib/module-guides.ts';
import { articleTextParts } from '../src/lib/article-text.ts';

const sql = readFileSync(new URL('../../backend/migrations/023_extra_fee_checklist_guide.sql', import.meta.url), 'utf8');
const article = JSON.parse(sql.split('$article$')[1]);
test('extra-fee guide publishes its complete worksheet, sources and bidirectional module references', () => {
  assert.ok(article.published);
  assert.ok(existsSync(new URL(`../public${article.cover}`, import.meta.url)));
  assert.equal(article.content.find(block => block.type === 'table').rows.length, 8);
  assert.equal(article.content.find(block => block.type === 'list' && block.ordered).items.length, 5);
  assert.deepEqual(article.toc.map(item => item.label), article.content.filter(block => block.type === 'h2').map(block => block.text));
  for (const slug of ['extra-fee', 'extra-fee-for-magento-2']) assert.deepEqual(moduleGuides({ blogPosts: [article] }, slug), [article]);
  const links = article.content.flatMap(block => articleTextParts(block.text ?? '')).filter(part => part.type === 'link');
  assert.equal(links.filter(link => link.href.startsWith('https://support.amasty.com/')).length, 2);
  assert.ok(links.some(link => link.href.startsWith('https://experienceleague.adobe.com/')));
  assert.ok(sql.includes('ON CONFLICT (slug) DO NOTHING'));
});
