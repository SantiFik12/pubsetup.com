-- Restore all distinct services described in the previous project.
-- Sources and decisions: docs/services.md. Existing user-edited rows are preserved.
INSERT INTO services(slug,name,description,includes,duration,price,unit,featured,position) VALUES
(
 'magento-2-setup-from-scratch','Magento 2 Setup from Scratch',
 'Full Magento 2 installation on your server with optimal configuration, sample data cleanup, and basic security hardening.',
 ARRAY['Server requirements check','Magento 2 installation','Admin panel setup','Email & SMTP configuration','Security hardening','SSL setup'],
 '2-3 business days',299,'fixed',true,0
),
(
 'install-magento-2-extension','Extension Installation',
 'Professional installation and configuration of a Magento 2 extension on your store, with checks on staging before deployment.',
 ARRAY['Composer-based installation','Configuration per documentation','Smoke test on staging','Deploy to production','Cache & index refresh','Rollback plan'],
 '1-2 business days',60,'per extension',true,1
),
(
 'security-patches-installation','Security Patch Installation',
 'Apply Magento 2 security patches, check extension compatibility and verify the store before deployment.',
 ARRAY['Backup before patching','Apply latest security patch','Compatibility check with extensions','Smoke test on staging','Deploy to production','Cache & index refresh'],
 '1 business day',60,'fixed',false,2
),
(
 'magento-2-speed-optimization','Optimize Magento 2 Speed',
 'Performance audit and optimization of your Magento 2 store, covering server configuration, caching, images and frontend delivery.',
 ARRAY['Performance audit','Server tuning','Cache & Varnish tuning','Image optimization','Critical CSS','Lighthouse report'],
 '5-7 business days',200,'fixed',false,3
),
(
 'performance-audit','Performance Audit',
 'Comprehensive performance audit with actionable recommendations to speed up your Magento 2 store.',
 ARRAY['Frontend & backend profiling','Database & query analysis','Cache configuration review','Image & asset optimization audit','Server stack audit'],
 '3-5 business days',499,'fixed',false,4
),
(
 'hyva-theme-migration','Hyvä Theme Migration',
 'Migrate your store from Luma to Hyvä, checking extension compatibility, preserving SEO and measuring frontend performance.',
 ARRAY['Theme installation','Custom design port','Extension compatibility check','SEO preservation','Performance benchmarks'],
 '2-4 weeks',2499,'fixed',false,5
),
(
 'transfer-existing-store','Transfer an Existing Magento Store',
 'Move an existing Magento store and its database to a new server, configure the hosting stack and verify the store after migration.',
 ARRAY['Server requirements assessment','Full site & DB transfer','DNS & SSL setup','Performance tuning (Redis, Varnish, RabbitMQ)','Security hardening','Post-migration QA'],
 'Agreed after assessment',0,'quote on request',false,6
),
(
 'magento-server-updates','Magento & Server Updates',
 'Routine Magento and server stack updates (PHP, MySQL, Composer, OS packages). Billed hourly, 7-hour minimum.',
 ARRAY['Review installed software versions','Plan compatible updates','Back up before changes','Update Magento and server software','Verify the updated store'],
 '7-hour minimum; schedule agreed with you',210,'for 7 hours ($30/hr)',false,7
),
(
 'migration-m1-to-m2','Magento 1 to Magento 2 Migration',
 'Plan and execute a full migration from Magento 1 to Magento 2: customers, orders, attributes and SEO. Billed hourly, 10-hour minimum.',
 ARRAY['Pre-migration audit','Data migration (catalog, customers, orders)','Extensions mapping & install','URL rewrites & SEO preservation','Testing & go-live'],
 '10-hour minimum; timeline agreed after assessment',0,'quote on request',false,8
),
(
 'migration-consultation','Migration Consultation',
 '30-minute expert call to plan your Magento 1 to Magento 2 migration, replatforming or upgrade strategy.',
 ARRAY['Architecture review','Roadmap','Risk assessment','Cost estimate'],
 '30 minutes',50,'per 30 minutes',false,9
)
ON CONFLICT(slug) DO NOTHING;

-- The installation service was bootstrapped by migration 003 before the full list.
UPDATE services SET position = 1 WHERE slug = 'install-magento-2-extension' AND position = 0;
