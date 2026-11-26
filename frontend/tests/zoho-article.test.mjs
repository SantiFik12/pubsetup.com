import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { moduleGuides } from '../src/lib/module-guides.ts';

const sql = readFileSync(new URL('../../backend/migrations/022_zoho_inventory_setup_guide.sql', import.meta.url), 'utf8');
const article = JSON.parse(sql.split('$article$')[1]);

test('Zoho setup guide has its one selected cover, complete worksheet, checklist and contextual module link', () => {
  assert.equal(article.published, true);
  assert.ok(existsSync(new URL(`../public${article.cover}`, import.meta.url)));
  assert.deepEqual(article.toc.map(item => item.label), article.content.filter(block => block.type === 'h2').map(block => block.text));
  assert.equal(article.content.find(block => block.type === 'table').rows.length, 7);
  assert.equal(article.content.find(block => block.type === 'list' && block.ordered).items.length, 6);
  assert.equal(moduleGuides({ blogPosts: [article] }, 'magento-2-zoho-inventory-integration').length, 1);
  assert.ok(sql.includes('ON CONFLICT (slug) DO NOTHING'));
});
