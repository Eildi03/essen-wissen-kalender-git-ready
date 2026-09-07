# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system --gid 10001 appgroup \
    && useradd --system --uid 10001 --gid appgroup --home-dir /app appuser
COPY --from=dependencies --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup scripts ./scripts
COPY --chown=appuser:appgroup db ./db
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]
