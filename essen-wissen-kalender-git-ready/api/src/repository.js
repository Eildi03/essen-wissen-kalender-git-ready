import { query } from './db.js';

//export async function listPublicEvents(filters) {
//  const sql = /* deine SELECT-Query */;
//  const params = /* deine Parameter */;
//  const result = await query(sql, params, {
//    operation: 'select',
//    table: 'public_calendar_events',
//  });
//  return result.rows;
//}

//export async function createEvent(input) {
//  const sql = /* INSERT-Query */;
//  const params = /* Parameter */;
//
//  const result = await query(sql, params, {
//    operation: 'insert',
 //   table: 'events',
 // });
//
//  return result.rows[0];
//}

const baseColumns = `
  e.id, e.series_id AS "seriesId", e.occurrence_start AS "occurrenceStart",
  e.title, e.public_title AS "publicTitle", e.description, e.public_description AS "publicDescription",
  e.event_type AS "eventType", e.status, e.starts_at AS "startsAt", e.ends_at AS "endsAt",
  e.all_day AS "allDay", e.timezone, e.institution_id AS "institutionId", e.location_id AS "locationId",
  e.expected_children AS "expectedChildren", e.expected_companions AS "expectedCompanions",
  e.target_group AS "targetGroup", e.topic, e.internal_notes AS "internalNotes",
  e.visibility, e.show_public_status AS "showPublicStatus", e.created_by AS "createdBy",
  e.created_at AS "createdAt", e.updated_by AS "updatedBy", e.updated_at AS "updatedAt",
  i.name AS "institutionName", i.institution_type AS "institutionType",
  l.federal_state_code AS "federalStateCode", fs.name AS "federalState",
  l.postal_code AS "postalCode", l.city, l.district, l.street,
  l.house_number AS "houseNumber", l.building_room AS "buildingRoom",
  l.arrival_notes AS "arrivalNotes", l.parking_notes AS "parkingNotes",
  l.latitude, l.longitude
`;

const baseJoins = `
  FROM essen_wissen.events e
  LEFT JOIN essen_wissen.institutions i ON i.id = e.institution_id
  LEFT JOIN essen_wissen.locations l ON l.id = e.location_id
  LEFT JOIN essen_wissen.federal_states fs ON fs.code = l.federal_state_code
`;

function filtersToSql(filters, internal) {
  const values = [];
  const where = [internal ? 'e.deleted_at IS NULL' : 'true'];
  const prefix = internal ? 'e.' : '';
  if (filters.id) { values.push(filters.id); where.push(`${prefix}id = $${values.length}`); }
  if (filters.from) { values.push(filters.from); where.push(`${prefix}ends_at >= $${values.length}`); }
  if (filters.to) { values.push(filters.to); where.push(`${prefix}starts_at < $${values.length}`); }
  if (filters.type) { values.push(filters.type); where.push(`${prefix}event_type = $${values.length}`); }
  if (filters.status) { values.push(filters.status); where.push(`${prefix}status = $${values.length}`); }
  if (filters.visibility) { values.push(filters.visibility); where.push(`${prefix}visibility = $${values.length}`); }
  if (filters.state) { values.push(filters.state); where.push(`${internal ? 'l.federal_state_code' : 'federal_state'} = $${values.length}`); }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    const n = values.length;
    where.push(internal
      ? `(e.title ILIKE $${n} OR e.public_title ILIKE $${n} OR i.name ILIKE $${n} OR l.city ILIKE $${n} OR l.postal_code ILIKE $${n} OR e.topic ILIKE $${n} OR concat_ws(' ', c.first_name, c.last_name) ILIKE $${n})`
      : `(title ILIKE $${n} OR institution_name ILIKE $${n} OR city ILIKE $${n} OR description ILIKE $${n})`);
  }
  return { where, values };
}

export async function listPublicEvents(filters = {}) {
  const { where, values } = filtersToSql(filters, false);
  return (await query(`SELECT * FROM essen_wissen.public_calendar_events WHERE ${where.join(' AND ')} ORDER BY starts_at`, values)).rows;
}

export async function listInternalEvents(filters = {}) {
  const { where, values } = filtersToSql(filters, true);
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  values.push(limit, offset);
  const sql = `
    SELECT ${baseColumns},
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'id', c.id, 'firstName', c.first_name, 'lastName', c.last_name,
        'function', c.function_title, 'phone', c.phone, 'mobilePhone', c.mobile_phone,
        'email', c.email, 'isPrimary', ec.is_primary
      )) FILTER (WHERE c.id IS NOT NULL), '[]'::jsonb) AS contacts,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'id', r.id, 'name', r.name, 'type', r.resource_type, 'status', r.status,
        'isPrimary', er.is_primary
      )) FILTER (WHERE r.id IS NOT NULL), '[]'::jsonb) AS resources
    ${baseJoins}
    LEFT JOIN essen_wissen.event_contacts ec ON ec.event_id = e.id
    LEFT JOIN essen_wissen.contacts c ON c.id = ec.contact_id
    LEFT JOIN essen_wissen.event_resources er ON er.event_id = e.id
    LEFT JOIN essen_wissen.resources r ON r.id = er.resource_id
    WHERE ${where.join(' AND ')}
    GROUP BY e.id, i.name, i.institution_type, l.federal_state_code, fs.name, l.postal_code,
      l.city, l.district, l.street, l.house_number, l.building_room, l.arrival_notes,
      l.parking_notes, l.latitude, l.longitude
    ORDER BY e.starts_at
    LIMIT $${values.length - 1} OFFSET $${values.length}`;
  return (await query(sql, values)).rows;
}

export async function countInternalEvents(filters = {}) {
  const { where, values } = filtersToSql(filters, true);
  const sql = `
    SELECT count(DISTINCT e.id)::int AS count
    ${baseJoins}
    LEFT JOIN essen_wissen.event_contacts ec ON ec.event_id = e.id
    LEFT JOIN essen_wissen.contacts c ON c.id = ec.contact_id
    WHERE ${where.join(' AND ')}`;
  return (await query(sql, values)).rows[0].count;
}

export async function getInternalEvent(id) {
  const rows = await listInternalEvents({ id, limit: 1, offset: 0 });
  return rows[0] || null;
}

export async function getUserWithPermissions(email) {
  const result = await query(`
    SELECT u.id, u.email, u.password_hash AS "passwordHash", u.first_name AS "firstName",
      u.last_name AS "lastName", u.is_active AS "isActive",
      COALESCE(array_agg(DISTINCT ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL), '{}') AS roles,
      COALESCE(array_agg(DISTINCT rp.permission_code) FILTER (WHERE rp.permission_code IS NOT NULL), '{}') AS permissions
    FROM essen_wissen.app_users u
    LEFT JOIN essen_wissen.user_roles ur ON ur.user_id = u.id
    LEFT JOIN essen_wissen.role_permissions rp ON rp.role_code = ur.role_code
    WHERE u.email = $1
    GROUP BY u.id`, [email]);
  return result.rows[0] || null;
}

export async function updateLastLogin(id) {
  await query('UPDATE essen_wissen.app_users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function insertEvent(client, input, userId) {
  const values = [
    input.title, input.publicTitle ?? null, input.description ?? null, input.publicDescription ?? null,
    input.eventType, input.status || 'request', input.startsAt, input.endsAt, input.allDay ?? false,
    input.timezone || 'Europe/Berlin', input.institutionId ?? null, input.locationId ?? null,
    input.expectedChildren ?? 0, input.expectedCompanions ?? 0, input.targetGroup ?? null,
    input.topic ?? null, input.internalNotes ?? null, input.visibility || 'internal',
    input.showPublicStatus ?? true, userId, userId,
  ];
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const result = await client.query(`
    INSERT INTO essen_wissen.events (
      title, public_title, description, public_description, event_type, status, starts_at, ends_at,
      all_day, timezone, institution_id, location_id, expected_children, expected_companions,
      target_group, topic, internal_notes, visibility, show_public_status, created_by, updated_by
    ) VALUES (${placeholders}) RETURNING id`, values);
  const id = result.rows[0].id;
  await syncRelations(client, id, input);
  return id;
}

export async function updateEvent(client, id, input, userId) {
  const columns = {
    title: 'title', publicTitle: 'public_title', description: 'description', publicDescription: 'public_description',
    eventType: 'event_type', status: 'status', startsAt: 'starts_at', endsAt: 'ends_at', allDay: 'all_day',
    timezone: 'timezone', institutionId: 'institution_id', locationId: 'location_id', expectedChildren: 'expected_children',
    expectedCompanions: 'expected_companions', targetGroup: 'target_group', topic: 'topic', internalNotes: 'internal_notes',
    visibility: 'visibility', showPublicStatus: 'show_public_status',
  };
  const updates = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (input[key] !== undefined) { values.push(input[key]); updates.push(`${column} = $${values.length}`); }
  }
  if (updates.length) {
    values.push(userId, id);
    await client.query(`UPDATE essen_wissen.events SET ${updates.join(', ')}, updated_by = $${values.length - 1} WHERE id = $${values.length} AND deleted_at IS NULL`, values);
  } else if (input.resourceIds === undefined && input.contactIds === undefined) {
    return;
  }
  await syncRelations(client, id, input);
}

async function syncRelations(client, eventId, input) {
  if (input.resourceIds !== undefined) {
    await client.query('DELETE FROM essen_wissen.event_resources WHERE event_id = $1', [eventId]);
    for (let index = 0; index < input.resourceIds.length; index += 1) {
      await client.query('INSERT INTO essen_wissen.event_resources (event_id, resource_id, is_primary) VALUES ($1, $2, $3)', [eventId, input.resourceIds[index], index === 0]);
    }
  }
  if (input.contactIds !== undefined) {
    await client.query('DELETE FROM essen_wissen.event_contacts WHERE event_id = $1', [eventId]);
    for (let index = 0; index < input.contactIds.length; index += 1) {
      await client.query('INSERT INTO essen_wissen.event_contacts (event_id, contact_id, is_primary) VALUES ($1, $2, $3)', [eventId, input.contactIds[index], index === 0]);
    }
  }
}

export async function softDeleteEvent(client, id, userId) {
  await client.query('UPDATE essen_wissen.events SET deleted_at = now(), deleted_by = $1, updated_by = $1 WHERE id = $2 AND deleted_at IS NULL', [userId, id]);
}
