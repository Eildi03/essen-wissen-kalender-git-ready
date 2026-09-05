#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
files='README.md package.json package-lock.json .env.example .gitignore .gitattributes compose.yaml compose.dev.yaml LICENSE api/package.json api/package-lock.json api/Dockerfile api/db/schema.sql api/src/server.js api/src/auth.js api/src/db.js api/src/repository.js api/src/routes.js api/src/validation.js frontend/public/index.html frontend/Dockerfile frontend/nginx.conf proxy/Caddyfile proxy/Caddy.productionfile docs/deployment.md docs/security-checklist.md scripts/generate-secrets.ps1 scripts/check-project.sh'
for file in $files; do test -f "$ROOT/$file" || { echo "FEHLT: $file" >&2; exit 1; }; done
printf '%s\n' 'Projektstruktur: OK'
