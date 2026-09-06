import { Router } from 'express';
import { authMiddleware, hashPassword, requireAnyPermission, requirePermission, signToken, verifyPassword } from './auth.js';
import { query, withTransaction } from './db.js';
import { countInternalEvents, getInternalEvent, getUserWithPermissions, insertEvent, listInternalEvents, listPublicEvents, softDeleteEvent, updateEvent, updateLastLogin } from './repository.js';
import { eventInput, httpError, isUuid, pagination, requiredString } from './validation.js';
// api/src/ratelimit.js
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'RATE_LIMITED', message: 'Zu viele Anmeldeversuche. Bitte spaeter erneut versuchen.' },
});

export const publicLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
export const apiLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false });
export const router = Router();



const ALLOWED_ROLES = new Set(['administrator', 'planner', 'internal_reader']);

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'essen-wissen-kalender-api' }));

router.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const email = requiredString(req.body?.email, 'email', 320).toLowerCase();
    const password = requiredString(req.body?.password, 'password', 500);
    const user = await getUserWithPermissions(email);
    if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'E-Mail-Adresse oder Passwort ist nicht korrekt.' });
    const { passwordHash, ...publicUser } = user;
    await updateLastLogin(user.id);
    return res.json({ token: signToken({ sub: user.id, email: user.email, roles: user.roles, permissions: user.permissions }), expiresIn: process.env.JWT_TTL || '8h', user: publicUser });
  } catch (error) { return next(error); }
});

router.get('/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await getUserWithPermissions(req.user.email);
    if (!user || !user.isActive) return res.status(401).json({ error: 'INVALID_USER', message: 'Benutzer ist nicht aktiv.' });
    const { passwordHash, ...publicUser } = user;
    return res.json({ user: publicUser });
  } catch (error) { return next(error); }
});

router.get('/public/events', publicLimiter, async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString();
    const to = req.query.to || new Date(Date.now() + 365 * 86400000).toISOString();
    const data = await listPublicEvents({ from, to, type: req.query.type, status: req.query.status, state: req.query.state, search: req.query.search });
    return res.json({ data });
  } catch (error) { return next(error); }
});

router.use('/events', authMiddleware);

router.get('/events', requireAnyPermission('calendar.read_internal'), async (req, res, next) => {
  try {
    const { limit, offset } = pagination(req.query);
    const filters = { from: req.query.from, to: req.query.to, type: req.query.type, status: req.query.status, visibility: req.query.visibility, state: req.query.state, search: req.query.search, limit, offset };
    const [data, total] = await Promise.all([listInternalEvents(filters), countInternalEvents(filters)]);
    return res.json({ data, pagination: { limit, offset, total } });
  } catch (error) { return next(error); }
});

router.get('/events/:id', requireAnyPermission('calendar.read_internal'), async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) throw httpError(400, 'VALIDATION_ERROR', 'Ungueltige Veranstaltungs-ID.');
    const data = await getInternalEvent(req.params.id);
    if (!data) return res.status(404).json({ error: 'NOT_FOUND', message: 'Veranstaltung nicht gefunden.' });
    return res.json({ data });
  } catch (error) { return next(error); }
});

router.post('/events', requirePermission('event.create'), async (req, res, next) => {
  try {
    const input = eventInput(req.body);
    const id = await withTransaction(client => insertEvent(client, input, req.user.sub), { userId: req.user.sub, requestId: req.id });
    return res.status(201).json({ data: await getInternalEvent(id) });
  } catch (error) { return next(error); }
});

router.patch('/events/:id', requirePermission('event.update'), async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) throw httpError(400, 'VALIDATION_ERROR', 'Ungueltige Veranstaltungs-ID.');
    if (!await getInternalEvent(req.params.id)) return res.status(404).json({ error: 'NOT_FOUND', message: 'Veranstaltung nicht gefunden.' });
    const input = eventInput(req.body, true);
    await withTransaction(client => updateEvent(client, req.params.id, input, req.user.sub), { userId: req.user.sub, requestId: req.id });
    return res.json({ data: await getInternalEvent(req.params.id) });
  } catch (error) { return next(error); }
});

router.delete('/events/:id', requirePermission('event.delete'), async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) throw httpError(400, 'VALIDATION_ERROR', 'Ungueltige Veranstaltungs-ID.');
    if (!await getInternalEvent(req.params.id)) return res.status(404).json({ error: 'NOT_FOUND', message: 'Veranstaltung nicht gefunden.' });
    await withTransaction(client => softDeleteEvent(client, req.params.id, req.user.sub), { userId: req.user.sub, requestId: req.id });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

router.post('/events/:id/cancel', requirePermission('event.update'), async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) throw httpError(400, 'VALIDATION_ERROR', 'Ungueltige Veranstaltungs-ID.');
    const reason = req.body?.reason ? String(req.body.reason).trim() : 'Termin abgesagt';
    await withTransaction(client => client.query("UPDATE essen_wissen.events SET status = 'cancelled', internal_notes = COALESCE(internal_notes || E'\\n', '') || $1, updated_by = $2 WHERE id = $3 AND deleted_at IS NULL", [reason, req.user.sub, req.params.id]), { userId: req.user.sub, requestId: req.id });
    return res.json({ data: await getInternalEvent(req.params.id) });
  } catch (error) { return next(error); }
});

router.get('/statistics/yearly', requireAnyPermission('calendar.read_internal'), async (req, res, next) => {
  try { return res.json({ data: (await query('SELECT * FROM essen_wissen.event_yearly_statistics ORDER BY year')).rows }); }
  catch (error) { return next(error); }
});

router.get('/statistics/federal-states', requireAnyPermission('calendar.read_internal'), async (req, res, next) => {
  try { return res.json({ data: (await query('SELECT * FROM essen_wissen.event_statistics_by_federal_state ORDER BY year, federal_state')).rows }); }
  catch (error) { return next(error); }
});

router.get('/admin/users', requirePermission('user.manage'), async (req, res, next) => {
  try {
    const data = (await query(`SELECT u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName", u.is_active AS "isActive", u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt", COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL), '{}') AS roles FROM essen_wissen.app_users u LEFT JOIN essen_wissen.user_roles ur ON ur.user_id = u.id GROUP BY u.id ORDER BY u.last_name, u.first_name`)).rows;
    return res.json({ data });
  } catch (error) { return next(error); }
});

router.post('/admin/users', requirePermission('user.manage'), async (req, res, next) => {
  try {
    const email = requiredString(req.body?.email, 'email', 320).toLowerCase();
    const password = requiredString(req.body?.password, 'password', 500);
    if (password.length < 12) throw httpError(400, 'VALIDATION_ERROR', 'Das Passwort muss mindestens 12 Zeichen enthalten.');
    const firstName = requiredString(req.body?.firstName, 'firstName', 100);
    const lastName = requiredString(req.body?.lastName, 'lastName', 100);
    const roles = Array.isArray(req.body?.roles) && req.body.roles.length ? req.body.roles : ['internal_reader'];
    const id = await withTransaction(async client => {
      const result = await client.query('INSERT INTO essen_wissen.app_users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id', [email, await hashPassword(password), firstName, lastName]);
      for (const role of roles) await client.query('INSERT INTO essen_wissen.user_roles (user_id, role_code, assigned_by) VALUES ($1, $2, $3)', [result.rows[0].id, role, req.user.sub]);
      return result.rows[0].id;
    }, { userId: req.user.sub, requestId: req.id });
    return res.status(201).json({ data: { id, email, firstName, lastName, roles } });
  } catch (error) { return next(error); }
});

router.post('/admin/users/:id/roles', requirePermission('user.manage'), async (req, res, next) => {
  try {
    if (req.body.roles.some(role => !ALLOWED_ROLES.has(role))) {
        throw httpError(400, 'VALIDATION_ERROR', 'Die Rollenliste enthaelt einen unbekannten Wert.');}
    if (req.params.id === req.user.sub && !req.body.roles.includes('administrator')) {
        throw httpError(409, 'LAST_ADMIN', 'Die eigene Administratorrolle kann nicht entzogen werden.');}
    if (!isUuid(req.params.id) || !Array.isArray(req.body?.roles)) throw httpError(400, 'VALIDATION_ERROR', 'Benutzer-ID oder Rollenliste ist ungueltig.');
    await withTransaction(async client => {
      await client.query('DELETE FROM essen_wissen.user_roles WHERE user_id = $1', [req.params.id]);
      for (const role of req.body.roles) await client.query('INSERT INTO essen_wissen.user_roles (user_id, role_code, assigned_by) VALUES ($1, $2, $3)', [req.params.id, role, req.user.sub]);
    }, { userId: req.user.sub, requestId: req.id });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export function notFound(req, res) { return res.status(404).json({ error: 'NOT_FOUND', message: 'API-Endpunkt nicht gefunden.' }); }
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === '23P01') return res.status(409).json({ error: 'RESOURCE_CONFLICT', message: 'Die Ressource ist im gewaehlten Zeitraum bereits belegt.' });
  if (error.code === '23505') return res.status(409).json({ error: 'DUPLICATE', message: 'Der Datensatz existiert bereits.' });
  if (error.code === '23503') return res.status(400).json({ error: 'INVALID_REFERENCE', message: 'Eine referenzierte Einrichtung, Ressource oder Kontaktperson existiert nicht.' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: error.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Interner Serverfehler.' : error.message, details: error.details });
}
