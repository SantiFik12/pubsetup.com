-- Integration services requested 2026-11-27. Hourly rates are agreed before work.
-- Preserve existing service content and pricing on repeated application.
INSERT INTO services(slug,name,description,includes,duration,price,unit,featured,position) VALUES
(
 'third-party-api-integration','Third-Party API Integration',
 'Connect your Magento 2 store to a third-party API. Scope and hourly rate are agreed before work begins. Billed hourly, 3-hour minimum.',
 ARRAY['API documentation and endpoint review','Authentication and field mapping','Implementation of the agreed API connection','Error handling and staging checks','Handover and configuration notes'],
 '3-hour minimum; schedule agreed after assessment',0,'quote on request',false,10
),
(
 'erp-crm-integration','ERP / CRM Integration',
 'Integrate Magento 2 with your ERP or CRM using agreed data flows and synchronization requirements. Scope and hourly rate are agreed before work begins. Billed hourly, 10-hour minimum.',
 ARRAY['Business workflow and integration scope review','Data mapping for the agreed entities','Sync direction, scheduling and retry planning','Implementation and staging acceptance checks','Handover and operational notes'],
 '10-hour minimum; timeline agreed after assessment',0,'quote on request',false,11
)
ON CONFLICT(slug) DO NOTHING;
