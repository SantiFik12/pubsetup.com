import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { articleTextParts } from '../src/lib/article-text.ts';
import { moduleGuides } from '../src/lib/module-guides.ts';
import { latestBlogPosts } from '../src/lib/blog-feed.ts';
import { catalogSitemap } from '../src/lib/sitemap.ts';

const files = ['028_api_integration_guide.sql', '029_erp_crm_integration_guide.sql', '030_cron_indexers_guide.sql'];
const articles = files.map(file => JSON.parse(readFileSync(new URL(`../../backend/migrations/${file}`, import.meta.url), 'utf8').split('$article$')[1]));

test('operations guides retain worksheets, primary-source and service links, and read-only diagnostic commands', () => {
  const services = ['third-party-api-integration', 'erp-crm-integration', 'magento-server-updates'];
  const rows = [7, 8, 8];
  for (const [index, article] of articles.entries()) {
    assert.ok(article.published);
    assert.ok(existsSync(new URL(`../public${article.cover}`, import.meta.url)));
    assert.equal(article.content.find(block => block.type === 'table').rows.length, rows[index]);
    assert.equal(article.content.find(block => block.type === 'list' && block.ordered).items.length, 5);
    assert.deepEqual(article.toc.map(item => item.label), article.content.filter(block => block.type === 'h2').map(block => block.text));
    const source = readFileSync(new URL(`../../content/blog/${article.slug}.md`, import.meta.url), 'utf8');
    for (const block of article.content.filter(block => block.type === 'p')) assert.ok(source.includes(block.text));
    const links = article.content.flatMap(block => articleTextParts(block.text ?? '')).filter(part => part.type === 'link').map(part => part.href);
    assert.ok(links.includes(`/services/${services[index]}`));
    assert.ok(links.some(href => href.startsWith('https://experienceleague.adobe.com/') || href.startsWith('https://developer.adobe.com/')));
    assert.ok(links.some(href => articles.some(other => other !== article && href === `/blog/${other.slug}`)));
  }
  assert.equal(articles[2].content.find(block => block.type === 'code').text, 'crontab -l\nphp --version\nphp bin/magento indexer:status\nphp bin/magento indexer:show-mode');
  for (const slug of ['magento-2-zoho-inventory-integration', 'magento-2-zoho-crm-integration']) assert.deepEqual(moduleGuides({ blogPosts: articles }, slug), [articles[1]]);
  for (const slug of ['cron-scheduler', 'cron-scheduler-pro']) assert.deepEqual(moduleGuides({ blogPosts: articles }, slug), [articles[2]]);
});

test('three new articles appear in the bounded home feed and the shared sitemap', () => {
  const older = Array.from({ length: 15 }, (_, i) => ({ slug: `older-${i}`, date: '2026-11-27' }));
  const feed = latestBlogPosts([...older, ...articles]);
  assert.equal(feed.length, 6);
  for (const article of articles) assert.ok(feed.includes(article));
  const sitemap = catalogSitemap({ extensions: [], categories: [], partners: [], services: [], blogPosts: articles, seoLandings: [] });
  for (const article of articles) assert.ok(sitemap.some(entry => entry.url.endsWith(`/blog/${article.slug}`)));
});
