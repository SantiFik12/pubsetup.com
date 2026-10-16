# pubsetup.com

Magento extensions catalog and services. Symfony 7.4 / PHP 8.4 API, Next.js 16 App Router / React 19, PostgreSQL 16, Docker Compose. The existing visual design, React components and Tailwind styles are retained.

## Local development

```bash
bash scripts/dev.sh
python3 scripts/smoke.py http://127.0.0.1:8085
```

Open http://localhost:8085. Only the nginx gateway is published, bound to localhost. PHP-FPM, Next.js and PostgreSQL are internal. The first start creates a database and applies migrations. `docker compose logs -f backend frontend worker` shows application logs; `docker compose down` stops containers while retaining data.

Migrations seed Amasty CCPA, its partner/category and all 10 services from the previous project. Service content and price sources are documented in [docs/services.md](docs/services.md). Other content is filled manually; see [docs/content.md](docs/content.md). Supabase import is optional, documented in [docs/migration.md](docs/migration.md). The fixtures under `backend/tests` are for tests only.

Services:

- `gateway`: nginx, port 8082 inside Docker; `/api/*`, `/health`, `/email/unsubscribe` route to Symfony, other requests to Next.js.
- `frontend`: existing pages on Next.js; catalog is fetched from Symfony during each request and rendered to HTML, including detail pages. Metadata and 404 responses are resolved on the server. Search/filter state is stored in the URL, comparison in localStorage.
- `backend`: public read API and validated service orders. Order prices are loaded from PostgreSQL; clients cannot set price/status or read orders. Same-origin checks, input limits and a database-backed request limit protect order submission.
- `worker`: delivers queued order notifications and confirmations through Postmark. Without `POSTMARK_SERVER_TOKEN`, it waits and does not send. Production config exposes mail variables only to PHP services.
- `migrate`: one-off tool service, applies versioned SQL with checksums and an advisory lock; also runs JSON imports. It uses the database owner, while the application uses `pubsetup_app` without superuser/schema administration permissions.

Backend uses parameterized PDO queries. The public catalog normalizes PostgreSQL arrays/JSON to JSON arrays/objects, preserves existing UUIDs and hides unpublished blog/landing records. API routes: `GET /api/catalog`, `GET /api/settings` (public Paddle client tokens only), `POST /api/orders`, `GET /health`.

## Checks

```bash
npm ci --prefix frontend
npm run lint --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
# PHP checks in Docker, including PDO PostgreSQL extensions:
docker compose run --rm --no-deps backend composer qa
python3 scripts/smoke.py http://127.0.0.1:8085 --require-content
```

`backend/tests/run.php` validates bad inputs and server-owned order fields. `backend/tests/integration.php` tests catalog visibility/types, pricing, transactional outbox, suppression, Postmark delivery/retry and rate limits using mocked HTTP. Run only against a disposable database whose name ends in `_test`; it inserts fixtures. See [docs/testing.md](docs/testing.md).

## Production

Use [PRODUCTION_HETZNER.md](PRODUCTION_HETZNER.md), adapted to this project from `/home/alexander/artwelve/PRODUCTION_HETZNER.md`. Host setup uses the original guide; project commands differ because this application has migrations, a limited database role and an email worker.

```bash
bash scripts/init-production.sh
# Set SITE_URL, release tag, HTTP_PORT and Postmark settings in .env.production.
bash scripts/deploy.sh
python3 scripts/smoke.py http://127.0.0.1:8080 --require-content
```

Fill the remaining content and review the seeded module before launch. Never run test fixtures on production. Existing Supabase orders, suppressions and unsubscribe links should be imported before cutover. PostgreSQL data resides in a named volume; `scripts/backup.sh` creates a custom-format dump. Media copied into `frontend/public/media` must be included in Git/deployment artifacts or backed up separately.

The previous TanStack/Supabase implementation remains under root `src/`, `supabase/`, and Vite/Cloudflare configuration files as a migration reference. It is not used by either Docker stack or root npm scripts. Existing local changes to those files were preserved. The former package manifest is saved in `docs/legacy-package.json`.
