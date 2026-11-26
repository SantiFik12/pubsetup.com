import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moduleHref, moduleDisplayName, recordModuleClick } from '../src/lib/module-links.ts';
import { moduleGuides } from '../src/lib/module-guides.ts';
import { latestBlogPosts } from '../src/lib/blog-feed.ts';
import { articleSchema } from '../src/lib/structured-data.ts';

test('canonical module links are independent of best-effort click tracking', async () => {
  assert.equal(moduleHref('data-feed-manager'), '/extension/data-feed-manager');
  const calls = [];
  await recordModuleClick('module name', async (...args) => { calls.push(args); return new Response(null, { status: 302 }); });
  assert.equal(calls[0][0], '/go/module/module%20name');
  assert.equal(calls[0][1].redirect, 'manual');
  assert.equal(calls[0][1].keepalive, true);
  await assert.doesNotReject(recordModuleClick('missing', async () => { throw new Error('Offline'); }));
});

test('display names remove repeated platform prefixes or suffixes without changing the module identity', () => {
  assert.equal(moduleDisplayName('Magento 2 Zoho Inventory Integration'), 'Zoho Inventory Integration');
  assert.equal(moduleDisplayName('Navigation for Magento 2'), 'Navigation');
  assert.equal(moduleDisplayName('Magento 2 - CSV Export for Magento 2'), 'CSV Export');
  assert.equal(moduleDisplayName('Data Feed Manager'), 'Data Feed Manager');
});

test('reverse guide links use actual references and include each article only once', () => {
  const catalog = { blogPosts: [
    { slug: 'card', content: [{ extensionSlug: 'feed' }, { extensionSlug: 'feed' }] },
    { slug: 'inline', content: [{ type: 'p', text: '[Feed](https://pubsetup.com/extension/feed#setup)' }] },
    { slug: 'unrelated', content: [{ type: 'p', text: 'Feed marketing and [other module](/extension/feed-pro)' }] },
  ] };
  assert.deepEqual(moduleGuides(catalog, 'feed').map(post => post.slug), ['card', 'inline']);
  assert.deepEqual(moduleGuides(catalog, 'missing'), []);
});

test('home shows six most recently published articles, respecting creation order within one day', () => {
  const posts = Array.from({ length: 10 }, (_, i) => ({ slug: `post-${i}`, date: '2026-11-08', createdAt: `2026-11-08T10:00:0${i}Z` }));
  posts.push({ slug: 'new', date: '2026-11-26' });
  posts[0].updatedAt = '2026-12-01';
  assert.deepEqual(latestBlogPosts(posts).map(post => post.slug), ['new', 'post-9', 'post-8', 'post-7', 'post-6', 'post-5']);
  assert.equal(posts[0].slug, 'post-0');
  assert.equal(latestBlogPosts([]).length, 0);
});

test('editorial team is an organization and a named author remains a person', () => {
  const post = { slug: 'guide', title: 'Guide', excerpt: 'Example', date: '2026-11-26', author: 'Pubsetup Team' };
  assert.equal(articleSchema(post).author['@type'], 'Organization');
  assert.equal(articleSchema({ ...post, author: 'Jane Doe' }).author['@type'], 'Person');
});
