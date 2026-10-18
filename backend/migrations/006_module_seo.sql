ALTER TABLE extensions
 ADD COLUMN seo_title text NOT NULL DEFAULT '',
 ADD COLUMN seo_description text NOT NULL DEFAULT '',
 ADD COLUMN seo_source_title text NOT NULL DEFAULT '',
 ADD COLUMN seo_source_description text NOT NULL DEFAULT '';
