CREATE TABLE admin_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE CHECK (email = lower(email)),
 password_hash text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE extensions ADD COLUMN original_url text NOT NULL DEFAULT '';
ALTER TABLE extensions ADD COLUMN published boolean NOT NULL DEFAULT true;
ALTER TABLE extensions ADD COLUMN source_updated_at timestamptz;
UPDATE extensions SET original_url = split_part(affiliate_url, '?', 1) WHERE affiliate_url <> '';
CREATE TABLE module_metrics (
 extension_id uuid PRIMARY KEY REFERENCES extensions(id) ON DELETE CASCADE,
 module_clicks bigint NOT NULL DEFAULT 0 CHECK (module_clicks >= 0),
 affiliate_clicks bigint NOT NULL DEFAULT 0 CHECK (affiliate_clicks >= 0)
);
GRANT SELECT,INSERT,UPDATE ON admin_users TO pubsetup_app;
GRANT INSERT,UPDATE ON partners,categories,extensions TO pubsetup_app;
GRANT SELECT,INSERT,UPDATE ON module_metrics TO pubsetup_app;
