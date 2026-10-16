-- First real catalog entry requested by the owner. Other content is filled manually.
-- Product information and media: https://amasty.com/california-consumer-privacy-act-for-magento-2.html
-- Checked 2026-10-16. Future catalog edits are not overwritten by this migration.
INSERT INTO partners(slug,name,logo_letter,description,website)
VALUES ('amasty','Amasty','A','Magento extensions and tools by Amasty.','https://amasty.com')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO categories(slug,name,description,icon)
VALUES ('compliance','Compliance & Legal','Privacy, customer data and compliance tools for Magento stores.','Scale')
ON CONFLICT(slug) DO NOTHING;

-- Installation price retained from the previous catalog's CCPA entry.
INSERT INTO services(slug,name,description,includes,duration,price,unit,featured,position)
VALUES ('install-magento-2-extension','Extension Installation',
    'Installation and initial configuration of a Magento 2 extension on your store.',
    ARRAY['Check Magento and module compatibility','Install with Composer','Configure the extension','Test on staging','Deploy and refresh caches'],
    '1 business day',60,'per extension',true,0)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO extensions (
    slug,name,partner_id,category_id,short_description,description,price_from,price_type,
    rating,reviews,recommended,best_seller,affiliate_url,magento_versions,hyva_compatible,
    pwa_ready,edition,install_complexity,has_trial,has_demo,support_months,
    features,use_cases,tags,install_price,cover_image,gallery,user_guide_url
)
VALUES (
    'ccpa','California Consumer Privacy Act',
    (SELECT id FROM partners WHERE slug='amasty'),
    (SELECT id FROM categories WHERE slug='compliance'),
    'Manage customer privacy in Magento 2 with data downloads, deletion requests and controls for the sale or sharing of personal information.',
    'Amasty CCPA adds customer-facing privacy controls and consent management to Magento 2. Shoppers can request a copy of their stored data, ask for account removal and set their preferences for data sharing. Store teams can target privacy settings by location, add consent fields to forms and review recorded decisions. The extension also supports scheduled data removal and integration with Hyva storefronts and checkout.',
    159,'subscription',4.5,2,false,false,
    'https://amasty.com/california-consumer-privacy-act-for-magento-2.html',
    ARRAY['2.4.5','2.4.6','2.4.7','2.4.8'],true,false,'both','simple',false,true,0,
    ARRAY['Location-based privacy controls','Customer data export and account removal requests','Opt-out preferences for personal data sharing','Configurable consent fields on store forms','Consent records for store administrators','Scheduled removal of retained customer data','Hyva storefront and checkout integration'],
    ARRAY['Stores serving customers in California','Customer privacy and consent management'],
    ARRAY['ccpa','privacy','compliance','hyva'],60,
    '/images/extensions/ccpa/cover.png',
    '["/images/extensions/ccpa/privacy-settings.png","/images/extensions/ccpa/consent-settings.png"]'::jsonb,
    'https://amasty.com/user-guides/magento-2-california-consumer-privacy-act/'
)
ON CONFLICT(slug) DO NOTHING;
