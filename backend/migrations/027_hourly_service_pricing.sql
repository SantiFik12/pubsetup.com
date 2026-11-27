-- Owner-approved hourly rate: $30/hour for services with a minimum commitment.
UPDATE services AS service
SET price = pricing.hours * 30,
    unit = 'for ' || pricing.hours || ' hours ($30/hr)',
    description = replace(
        replace(service.description, 'Scope and hourly rate are agreed before work begins.', 'Scope is agreed before work begins.'),
        'Billed hourly,', 'Billed at $30/hour,'
    )
FROM (VALUES
    ('third-party-api-integration', 3),
    ('erp-crm-integration', 10),
    ('migration-m1-to-m2', 10),
    ('magento-server-updates', 7)
) AS pricing(slug, hours)
WHERE service.slug = pricing.slug;
