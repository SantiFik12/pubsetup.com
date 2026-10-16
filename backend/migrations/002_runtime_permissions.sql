GRANT USAGE ON SCHEMA public TO pubsetup_app;
GRANT SELECT ON partners,categories,extensions,services,blog_posts,seo_landings,app_settings TO pubsetup_app;
GRANT SELECT, INSERT ON orders TO pubsetup_app;
GRANT SELECT, INSERT, UPDATE ON email_outbox,request_limits,email_unsubscribe_tokens TO pubsetup_app;
GRANT SELECT, INSERT ON suppressed_emails,email_send_log TO pubsetup_app;
