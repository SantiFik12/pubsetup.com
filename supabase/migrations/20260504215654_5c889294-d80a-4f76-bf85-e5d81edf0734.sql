UPDATE extensions
SET gallery = (
  SELECT jsonb_agg(
    regexp_replace(elem #>> '{}', '/cache/[a-f0-9]+/', '/')
  )
  FROM jsonb_array_elements(gallery) AS elem
)
WHERE category_id = (SELECT id FROM categories WHERE slug = 'analytics')
  AND jsonb_array_length(gallery) > 0;