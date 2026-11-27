import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { moduleGuides } from '../src/lib/module-guides.ts';
import { articleTextParts } from '../src/lib/article-text.ts';
import { latestBlogPosts } from '../src/lib/blog-feed.ts';
import { catalogSitemap } from '../src/lib/sitemap.ts';

const files = ['024_payment_restrictions_guide.sql', '025_shipping_restrictions_guide.sql'];
const articles = files.map(file => JSON.parse(readFileSync(new URL(`../../backend/migrations/${file}`, import.meta.url), 'utf8').split('$article$')[1]));
const references = [
  ['payment-restrictions-for-magento-2', 'payment-restrictions'],
  ['shipping-restrictions-for-magento-2', 'shipping-restrictions', 'shipping-rules-extension-for-magento-2'],
];

test('both guides retain worksheet data, source links, covers and reciprocal product references', () => {
  for (const [index, article] of articles.entries()) {
    assert.equal(article.published, true);
    assert.ok(existsSync(new URL(`../public${article.cover}`, import.meta.url)));
    assert.equal(article.content.find(block => block.type === 'table').rows.length, 9);
    assert.equal(article.content.find(block => block.type === 'list' && block.ordered).items.length, 5);
    assert.deepEqual(article.toc.map(item => item.label), article.content.filter(block => block.type === 'h2').map(block => block.text));
    const parts = article.content.flatMap(block => articleTextParts(block.text ?? ''));
    const links = parts.filter(part => part.type === 'link').map(part => part.href);
    assert.ok(links.some(href => href.startsWith('https://amasty.com/user-guides/')));
    assert.ok(links.some(href => href.startsWith('https://experienceleague.adobe.com/')));
    assert.ok(links.includes(`/blog/${articles[1 - index].slug}`));
    for (const slug of references[index]) assert.deepEqual(moduleGuides({ blogPosts: articles }, slug), [article]);
    const source = readFileSync(new URL(`../../content/blog/${article.slug}.md`, import.meta.url), 'utf8');
    for (const block of article.content.filter(block => block.type === 'p')) assert.ok(source.includes(block.text), 'Published paragraphs diverged from review source');
  }
});

test('new publications enter the six-article feed and sitemap through the existing shared pipeline', () => {
  const older = Array.from({ length: 10 }, (_, index) => ({ slug: `older-${index}`, date: '2026-11-26' }));
  const feed = latestBlogPosts([...older, ...articles]);
  assert.equal(feed.length, 6);
  for (const article of articles) assert.ok(feed.includes(article));
  const sitemap = catalogSitemap({ extensions: [], categories: [], partners: [], services: [], blogPosts: articles, seoLandings: [] });
  for (const article of articles) assert.ok(sitemap.some(entry => entry.url.endsWith(`/blog/${article.slug}`)));
});
