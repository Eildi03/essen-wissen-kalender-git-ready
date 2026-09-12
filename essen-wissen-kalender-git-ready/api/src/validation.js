const EVENT_TYPES = new Set(["bus", "kitchen", "other"]);
const EVENT_STATUSES = new Set([
  "request",
  "planned",
  "confirmed",
  "done",
  "cancelled",
]);
const VISIBILITIES = new Set(["internal", "partial_public", "public"]);
export function httpError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}
export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}
export function requiredString(value, field, max = 240) {
  if (typeof value !== "string" || !value.trim())
    throw httpError(400, "VALIDATION_ERROR", `${field} ist erforderlich.`);
  if (value.trim().length > max)
    throw httpError(400, "VALIDATION_ERROR", `${field} ist zu lang.`);
  return value.trim();
}
export function optionalString(value, field, max = 5000) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string")
    throw httpError(400, "VALIDATION_ERROR", `${field} muss Text sein.`);
  if (value.trim().length > max)
    throw httpError(400, "VALIDATION_ERROR", `${field} ist zu lang.`);
  return value.trim();
}
function enumValue(value, field, values, fallback) {
  const result = value === undefined ? fallback : value;
  if (!values.has(result))
    throw httpError(
      400,
      "VALIDATION_ERROR",
      `${field} enthaelt einen ungueltigen Wert.`,
    );
  return result;
}
function uuidOrNull(value, field) {
  if (value === null) return null;
  if (!isUuid(value))
    throw httpError(
      400,
      "VALIDATION_ERROR",
      `${field} muss eine gueltige UUID sein.`,
    );
  return value;
}
function isoDateTime(value, field, required = true) {
  if (!value && !required) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
    throw httpError(
      400,
      "VALIDATION_ERROR",
      `${field} muss ein gueltiger ISO-Zeitpunkt sein.`,
    );
  return value;
}
function nonNegativeInteger(value, field, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0)
    throw httpError(
      400,
      "VALIDATION_ERROR",
      `${field} muss eine positive ganze Zahl sein.`,
    );
  return number;
}
export function eventInput(body = {}, partial = false) {
  const input = {};
  if (!partial || body.title !== undefined)
    input.title = requiredString(body.title, "title", 240);
  if (body.publicTitle !== undefined)
    input.publicTitle = optionalString(body.publicTitle, "publicTitle", 240);
  if (body.description !== undefined)
    input.description = optionalString(body.description, "description");
  if (body.publicDescription !== undefined)
    input.publicDescription = optionalString(
      body.publicDescription,
      "publicDescription",
    );
  if (!partial || body.eventType !== undefined)
    input.eventType = enumValue(
      body.eventType,
      "eventType",
      EVENT_TYPES,
      "bus",
    );
  if (!partial || body.status !== undefined)
    input.status = enumValue(body.status, "status", EVENT_STATUSES, "request");
  if (!partial || body.startsAt !== undefined)
    input.startsAt = isoDateTime(body.startsAt, "startsAt");
  if (!partial || body.endsAt !== undefined)
    input.endsAt = isoDateTime(body.endsAt, "endsAt");
  if (
    input.startsAt &&
    input.endsAt &&
    Date.parse(input.endsAt) <= Date.parse(input.startsAt)
  )
    throw httpError(
      400,
      "VALIDATION_ERROR",
      "endsAt muss nach startsAt liegen.",
    );
  if (body.allDay !== undefined) input.allDay = Boolean(body.allDay);
  if (body.timezone !== undefined)
    input.timezone = requiredString(body.timezone, "timezone", 64);
  if (body.institutionId !== undefined)
    input.institutionId = uuidOrNull(body.institutionId, "institutionId");
  if (body.locationId !== undefined)
    input.locationId = uuidOrNull(body.locationId, "locationId");
  if (body.expectedChildren !== undefined)
    input.expectedChildren = nonNegativeInteger(
      body.expectedChildren,
      "expectedChildren",
    );
  if (body.expectedCompanions !== undefined)
    input.expectedCompanions = nonNegativeInteger(
      body.expectedCompanions,
      "expectedCompanions",
    );
  if (body.targetGroup !== undefined)
    input.targetGroup = optionalString(body.targetGroup, "targetGroup", 240);
  if (body.topic !== undefined)
    input.topic = optionalString(body.topic, "topic", 240);
  if (body.internalNotes !== undefined)
    input.internalNotes = optionalString(body.internalNotes, "internalNotes");
  if (body.visibility !== undefined)
    input.visibility = enumValue(
      body.visibility,
      "visibility",
      VISIBILITIES,
      "internal",
    );
  if (body.showPublicStatus !== undefined)
    input.showPublicStatus = Boolean(body.showPublicStatus);
  if (body.resourceIds !== undefined) {
    if (
      !Array.isArray(body.resourceIds) ||
      body.resourceIds.some((id) => !isUuid(id))
    )
      throw httpError(
        400,
        "VALIDATION_ERROR",
        "resourceIds muss gueltige UUIDs enthalten.",
      );
    input.resourceIds = [...new Set(body.resourceIds)];
  }
  if (body.contactIds !== undefined) {
    if (
      !Array.isArray(body.contactIds) ||
      body.contactIds.some((id) => !isUuid(id))
    )
      throw httpError(
        400,
        "VALIDATION_ERROR",
        "contactIds muss gueltige UUIDs enthalten.",
      );
    input.contactIds = [...new Set(body.contactIds)];
  }
  return input;
}
export function pagination(query) {
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 200);
  const offset = Math.max(Number(query.offset || 0), 0);
  if (!Number.isInteger(limit) || !Number.isInteger(offset))
    throw httpError(
      400,
      "VALIDATION_ERROR",
      "limit und offset muessen ganze Zahlen sein.",
    );
  return { limit, offset };
}
