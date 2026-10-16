#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
umask 077
set -o noclobber
{
    printf '%s\n' 'COMPOSE_PROJECT_NAME=pubsetup-prod' 'RELEASE_TAG=initial' 'HTTP_PORT=8080' 'SITE_URL=https://pubsetup.com' 'POSTGRES_DB=pubsetup' 'POSTGRES_USER=pubsetup'
    printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'APP_DB_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'APP_SECRET=%s\n' "$(openssl rand -hex 32)"
    printf '%s\n' 'POSTMARK_SERVER_TOKEN=' 'POSTMARK_MESSAGE_STREAM=outbound' 'MAIL_FROM=noreply@pubsetup.com' 'MAIL_NOTIFICATION_TO=contact@pubsetup.com'
} > .env.production
printf '%s\n' 'Created .env.production (0600). Set URL, release tag, port and Postmark token before deployment.'
