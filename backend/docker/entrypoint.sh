#!/bin/sh
set -eu
php bin/console cache:warmup --no-debug >&2
exec "$@"
