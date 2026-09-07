// api/src/metrics.js
import client from 'prom-client';

const register = new client.Registry();

// Standard-Labels (z. B. Service-Name)
register.setDefaultLabels({
  service: 'essen-wissen-api',
});

// Default-Metriken (Node-Process, GC, Eventloop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'ew_api_',
});

// HTTP-Request-Counter
export const httpRequestsTotal = new client.Counter({
  name: 'ew_api_http_requests_total',
  help: 'HTTP requests total',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// HTTP-Request-Duration
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'ew_api_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});
export const dbQueryDurationSeconds = new client.Histogram({
  name: 'ew_api_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});
export const dbQueryErrorsTotal = new client.Counter({
  name: 'ew_api_db_query_errors_total',
  help: 'Database query errors total',
  labelNames: ['operation', 'table'],
  registers: [register],
});
// Exportiertes Registry
export { register };
export { register, dbQueryDurationSeconds };