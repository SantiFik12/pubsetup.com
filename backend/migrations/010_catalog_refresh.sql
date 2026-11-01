CREATE TABLE catalog_refresh_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 vendor_id text NOT NULL DEFAULT '',
 dry_run boolean NOT NULL DEFAULT false,
 refresh_media boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','partial','failed')),
 started_at timestamptz NOT NULL DEFAULT now(),
 heartbeat_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 error text NOT NULL DEFAULT ''
);
CREATE TABLE catalog_refresh_items (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 run_id uuid NOT NULL REFERENCES catalog_refresh_runs(id),
 module_id uuid REFERENCES extensions(id) ON DELETE SET NULL,
 module_name text NOT NULL,
 vendor_name text NOT NULL,
 source_url text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','updated','unchanged','would_update','failed','skipped')),
 attempts integer NOT NULL DEFAULT 0,
 started_at timestamptz,
 finished_at timestamptz,
 changes jsonb NOT NULL DEFAULT '{}',
 warnings jsonb NOT NULL DEFAULT '[]',
 error text NOT NULL DEFAULT '',
 UNIQUE(run_id,module_id)
);
CREATE INDEX catalog_refresh_pending ON catalog_refresh_items(run_id,status,id);
CREATE TABLE catalog_source_state (
 module_id uuid PRIMARY KEY REFERENCES extensions(id) ON DELETE CASCADE,
 checked_at timestamptz NOT NULL DEFAULT now(),
 media jsonb NOT NULL DEFAULT '{}'
);
GRANT SELECT,INSERT,UPDATE ON catalog_refresh_runs,catalog_refresh_items,catalog_source_state TO pubsetup_app;
GRANT USAGE,SELECT ON SEQUENCE catalog_refresh_items_id_seq TO pubsetup_app;
