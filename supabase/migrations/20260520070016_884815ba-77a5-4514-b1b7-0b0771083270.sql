UPDATE services SET includes = ARRAY['Server requirements check','Magento 2 installation','Admin panel setup','Email & SMTP configuration','Security hardening','SSL setup'] WHERE slug = 'magento-2-setup-from-scratch';

UPDATE services SET includes = ARRAY['Server requirements assessment','Full site & DB transfer','DNS & SSL setup','Performance tuning (Redis, Varnish, RabbitMQ)','Security hardening','Post-migration QA'] WHERE slug = 'transfer-existing-store';

UPDATE services SET name = 'Security Patch Installation', includes = ARRAY['Backup before patching','Apply latest security patch','Compatibility check with extensions','Smoke test on staging','Deploy to production','Cache & index refresh'] WHERE slug = 'security-patches-installation';

UPDATE services SET includes = ARRAY['Frontend & backend profiling','Database & query analysis','Cache configuration review','Image & asset optimization audit','Server stack audit'] WHERE slug = 'performance-audit';

UPDATE services SET price = 210, unit = 'for 7 hours ($30/hr)', description = 'Routine Magento and server stack updates (PHP, MySQL, Composer, OS packages). Billed hourly, 7-hour minimum.' WHERE slug = 'magento-server-updates';

UPDATE services SET description = 'Plan and execute a full migration from Magento 1 to Magento 2: customers, orders, attributes and SEO. Billed hourly, 10-hour minimum.', includes = ARRAY['Pre-migration audit','Data migration (catalog, customers, orders)','Extensions mapping & install','URL rewrites & SEO preservation','Testing & go-live'] WHERE slug = 'migration-m1-to-m2';