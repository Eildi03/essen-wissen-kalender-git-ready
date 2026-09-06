import express from 'express';
import crypto from 'node:crypto';
import { config } from './config.js';
import { closePool, healthcheck } from './db.js';
import { errorHandler, notFound, router } from './routes.js';
import helmet from 'helmet';
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(express.json({ limit: '1mb' }));
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

app.get('/healthz', async (req, res) => { try { await healthcheck(); return res.json({ status: 'ok' }); } catch { return res.status(503).json({ status: 'unavailable' }); } });
app.use('/api/v1', router); app.use(notFound); app.use(errorHandler);
const server = app.listen(config.port, () => console.log(`Essen-Wissen API laeuft auf Port ${config.port}`));
async function shutdown(signal) { console.log(`${signal}: Server wird beendet.`); server.close(async () => { await closePool(); process.exit(0); }); }
process.on('SIGTERM', () => shutdown('SIGTERM')); process.on('SIGINT', () => shutdown('SIGINT'));
