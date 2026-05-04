UPDATE extensions
SET gallery = '[]'::jsonb
WHERE category_id = (SELECT id FROM categories WHERE slug = 'analytics');