import express from 'express';
import crypto from 'node:crypto';
import { config } from './config.js';
import { closePool, healthcheck } from './db.js';
import { errorHandler, notFound, router } from './routes.js';
import helmet from 'helmet';
import { register, httpRequestsTotal, httpRequestDurationSeconds } from './metrics.js';
// einfache Metrik-Middleware

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationSec = Number(durationNs) / 1e9;

    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSec);
  });

  next();
});
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
app.use((req, res, next) => { req.id = req.headers['x-request-id'] || crypto.randomUUID(); res.setHeader('x-request-id', req.id); next(); });
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (config.nodeEnv === 'production' && config.corsOrigin === '*') {
    throw new Error('CORS_ORIGIN darf in Produktion nicht "*" sein.');
  }
  if (origin && (config.corsOrigin === "*" || origin === config.corsOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Request-Id",
    );
    return res.status(204).send();
  }
  return next();
});

// Prometheus-Metrics-Endpunkt
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    console.error('Fehler beim Erzeugen von /metrics', error);
    res.status(500).send('metrics_error');
  }
});
app.get('/healthz', async (req, res) => { try { await healthcheck(); return res.json({ status: 'ok' }); } catch { return res.status(503).json({ status: 'unavailable' }); } });
app.use('/api/v1', router); app.use(notFound); app.use(errorHandler);
const server = app.listen(config.port, () => console.log(`Essen-Wissen API laeuft auf Port ${config.port}`));
async function shutdown(signal) { console.log(`${signal}: Server wird beendet.`); server.close(async () => { await closePool(); process.exit(0); }); }
process.on('SIGTERM', () => shutdown('SIGTERM')); process.on('SIGINT', () => shutdown('SIGINT'));
