#!/bin/sh
set -e

# Only create directories if they don't exist
mkdir -p /var/cache/nginx/client_temp 2>/dev/null || true
mkdir -p /var/run/nginx 2>/dev/null || true

# Run nginx directly
exec "$@"
