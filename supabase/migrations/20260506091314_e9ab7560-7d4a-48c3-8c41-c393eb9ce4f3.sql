
INSERT INTO public.categories (slug, name, description, icon)
VALUES ('compliance', 'Compliance & Legal', 'GDPR, CCPA, age verification, price transparency and other law-based modules.', 'Scale')
ON CONFLICT (slug) DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE slug='compliance'),
     amasty AS (SELECT id FROM public.partners WHERE slug='amasty')
UPDATE public.extensions SET category_id = (SELECT id FROM cat)
WHERE slug IN ('cookie-consent','gdpr');

WITH cat AS (SELECT id FROM public.categories WHERE slug='compliance'),
     amasty AS (SELECT id FROM public.partners WHERE slug='amasty')
INSERT INTO public.extensions (
  slug, name, partner_id, category_id, short_description, description,
  price_from, price_type, rating, reviews, recommended, best_seller,
  affiliate_url, magento_versions, hyva_compatible, pwa_ready, edition,
  install_complexity, has_trial, has_demo, support_months, features,
  use_cases, tags, install_price, cover_image, gallery, user_guide_url
) VALUES
('omnibus-price-tracker','Omnibus Price Tracker for Magento 2', (SELECT id FROM amasty), (SELECT id FROM cat),
 'Bring your store pricing into line with EU Omnibus Directive requirements.',
 'Display the lowest product price from the previous 30 days, monitor price change history, and protect your store from fines while staying transparent with customers.',
 199,'one-time',0,0,false,false,'https://amasty.com/omnibus-price-tracker-for-magento-2.html?a=pubsetup',
 ARRAY['2.4.x'],true,false,'both','simple',false,true,12,
 ARRAY['Show lowest price from last 30+ days','Display historical prices on category & product pages','Highlight % difference between current and minimum prices','Per-website Omnibus prices','Configurable products support','Hyvä-ready storefront'],
 ARRAY['EU Omnibus compliance','Pricing transparency'],
 ARRAY['compliance','hyva','eu','pricing'],
 60,'',
 '["https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_655f02150cfe0.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_6761606ad23fb.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_6891ab805a2aa.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_676160bf5f3f8.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_666f45410a3c0.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_666f45410a784.png","https://cdn.amasty.com/media/catalog/product/o/m/omnibus-price-tracker-for-magento-2_6761625b3e11b.png"]'::jsonb,
 'https://amasty.com/docs/doku.php?id=magento_2:omnibus_price_tracker'),

('price-history','Price History for Magento 2', (SELECT id FROM amasty), (SELECT id FROM cat),
 'Track and analyze price changes with full history grid and historical price display.',
 'Optimize pricing strategy by tracking price changes, showcasing the lowest prices over the past N days on product and category pages and building shopper trust.',
 199,'one-time',0,0,false,false,'https://amasty.com/price-history-for-magento-2.html?a=pubsetup',
 ARRAY['2.4.x'],true,false,'both','simple',false,true,12,
 ARRAY['Track price change history from a handy grid','Filter price change recordings','Display historical prices for all or only discounted products','Automatic price log cleaning','Hyvä-ready storefront'],
 ARRAY['EU Omnibus compliance','Pricing transparency'],
 ARRAY['compliance','hyva','pricing'],
 60,'',
 '["https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_655f02b0a025b.png","https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_64a7c228ea7e7.png","https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_64a7c228ea853.png","https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_64a7c228ea8d4.png","https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_64a7c228ea953.png","https://cdn.amasty.com/media/catalog/product/p/r/price-history-for-magento-2_64a7c228ea9c6.png"]'::jsonb,
 'https://amasty.com/docs/doku.php?id=magento_2:price_history'),

('price-per-unit','Price per Unit for Magento 2', (SELECT id FROM amasty), (SELECT id FROM cat),
 'Automatic base price calculation by weight, volume or length to comply with regulations.',
 'Show unit prices, create custom units, and place price-per-unit blocks on product, category, cart and checkout pages — boost compliance and customer trust.',
 139,'one-time',0,0,false,false,'https://amasty.com/base-price-for-magento-2.html?a=pubsetup',
 ARRAY['2.4.x'],true,false,'both','simple',false,true,12,
 ARRAY['Show unit prices by weight, volume, length','Custom units tailored to your products','Price per unit blocks on PDP, category, cart, checkout','Tier prices unit costs','Hyvä-ready storefront','WCAG compliant'],
 ARRAY['EU unit pricing compliance','Grocery & wholesale stores'],
 ARRAY['compliance','hyva','pricing','wcag'],
 60,'',
 '["https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_65a628e659ccc.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_6616ca891d359.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_65a628e65a197.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_65a628e65a1e2.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_65a628e65a23a.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_65a628e65a284.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_6616ca891d9cd.png","https://cdn.amasty.com/media/catalog/product/b/a/base-price-for-magento-2_671b6739aa093.png"]'::jsonb,
 'https://amasty.com/docs/doku.php?id=magento_2:base_price'),

('ccpa','California Consumer Privacy Act for Magento 2', (SELECT id FROM amasty), (SELECT id FROM cat),
 'Make your Magento 2 store fully compliant with the CCPA bill in one solution.',
 'Adjust privacy settings for California residents, let visitors know what data is collected, and allow them to download or delete their personal info in one click.',
 149,'one-time',4.5,2,false,false,'https://amasty.com/california-consumer-privacy-act-for-magento-2.html?a=pubsetup',
 ARRAY['2.4.x'],true,false,'both','simple',false,true,12,
 ARRAY['Adjust privacy settings for California residents','Allow users to reject sale or sharing of personal data','One-click data download and deletion requests','Hyvä-ready storefront','WCAG compliant'],
 ARRAY['CCPA compliance','US privacy law'],
 ARRAY['compliance','hyva','privacy','ccpa','us'],
 60,'',
 '["https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b917f5.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b92057.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b920ec.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b9213b.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b9218a.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b921d6.png","https://cdn.amasty.com/media/catalog/product/c/a/california-consumer-privacy-act-for-magento-2_652e892b92223.png"]'::jsonb,
 'https://amasty.com/docs/doku.php?id=magento_2:california_consumer_privacy_act'),

('age-verification','Age Verification for Magento 2', (SELECT id FROM amasty), (SELECT id FROM cat),
 'Set strong age verification measures for age-restricted products.',
 'Display age verification popups on any page with three layout options, request age verification during purchase and limit by store view or customer group.',
 99,'one-time',0,0,false,false,'https://amasty.com/age-verification-for-magento-2.html?a=pubsetup',
 ARRAY['2.4.x'],true,false,'both','simple',false,true,12,
 ARRAY['Display age verification on any page','Three popup layout options','Request verification during purchase','Limit by store view and customer group','Hyvä-ready storefront','ADA & WCAG compliant'],
 ARRAY['Alcohol, tobacco, vape, adult stores'],
 ARRAY['compliance','hyva','age','popup'],
 60,'',
 '["https://cdn.amasty.com/media/catalog/product/a/g/age-verification-for-magento-2_6703be6901920.png","https://cdn.amasty.com/media/catalog/product/a/g/age-verification-for-magento-2_6703bc5ee86be.png","https://cdn.amasty.com/media/catalog/product/a/g/age-verification-for-magento-2_6703bc5ee8708.png","https://cdn.amasty.com/media/catalog/product/a/g/age-verification-for-magento-2_6703bc5ee8752.png","https://cdn.amasty.com/media/catalog/product/a/g/age-verification-for-magento-2_6703bc5ee8793.png"]'::jsonb,
 'https://amasty.com/docs/doku.php?id=magento_2:age_verification')
ON CONFLICT (slug) DO NOTHING;
