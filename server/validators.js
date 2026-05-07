/**
 * Server-side validation helpers for inputs
 */

export const MAX_TITLE_LENGTH = 255;
export const MAX_COURSE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_TAGS_LENGTH = 500;
export const MAX_TAGS_COUNT = 20;
// Upload limit (bytes). Override with UPLOAD_MAX_MB env var.
const UPLOAD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 200);
export const MAX_FILE_SIZE = Math.max(1, UPLOAD_MAX_MB) * 1024 * 1024;

/**
 * Sanitize and validate a string field
 */
export function validateString(value, fieldName, minLength = 1, maxLength = 255) {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
  const trimmed = String(value).trim();
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  return trimmed;
}

/**
 * Sanitize and validate optional string field
 */
export function validateStringOptional(value, fieldName, maxLength = 255) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  return trimmed;
}

/**
 * Validate and parse tags from comma-separated string
 */
export function validateTags(value) {
  if (!value) return [];
  const tagString = String(value).trim();
  if (tagString.length > MAX_TAGS_LENGTH) {
    throw new Error(`Tags must not exceed ${MAX_TAGS_LENGTH} characters`);
  }
  const tags = tagString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, MAX_TAGS_COUNT);
  if (tags.length > MAX_TAGS_COUNT) {
    throw new Error(`Maximum ${MAX_TAGS_COUNT} tags allowed`);
  }
  return tags;
}

/**
 * Validate ownerId (UUID format)
 */
export function validateOwnerId(value) {
  if (!value) return null;
  const id = String(value).trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid ownerId format');
  }
  return id;
}

/**
 * Validate resource ID (UUID format)
 */
export function validateResourceId(value) {
  if (!value) {
    throw new Error('Resource ID is required');
  }
  const id = String(value).trim();
  // Accept any non-empty string as resource ID to support seeded IDs and legacy formats
  if (id.length === 0 || id.length > 255) {
    throw new Error('Invalid resource ID format');
  }
  return id;
}

/**
 * Validate boolean field
 */
export function validateBoolean(value) {
  if (value === undefined || value === null) return false;
  return Boolean(value);
}

/**
 * Validate upload payload
 */
export function validateUploadPayload(body, filename) {
  const errors = [];

  try {
    // Any file type supported; keep only basic filename sanity.
    if (!filename || String(filename).trim().length === 0) {
      errors.push('Invalid file name');
    }
  } catch {
    errors.push('Invalid file name');
  }

  try {
    if (body.title) {
      body.title = validateStringOptional(body.title, 'Title', MAX_TITLE_LENGTH);
    }
  } catch (e) {
    errors.push(e.message);
  }

  try {
    if (body.course) {
      body.course = validateStringOptional(body.course, 'Course', MAX_COURSE_LENGTH);
    }
  } catch (e) {
    errors.push(e.message);
  }

  try {
    if (body.description) {
      body.description = validateStringOptional(body.description, 'Description', MAX_DESCRIPTION_LENGTH);
    }
  } catch (e) {
    errors.push(e.message);
  }

  try {
    if (body.tags) {
      body.tags = validateTags(body.tags);
    }
  } catch (e) {
    errors.push(e.message);
  }

  try {
    if (body.ownerId) {
      body.ownerId = validateOwnerId(body.ownerId);
    }
  } catch (e) {
    errors.push(e.message);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return body;
}

/**
 * Validate favorite toggle payload
 */
export function validateFavoritePayload(body) {
  const errors = [];

  try {
    body.favorite = validateBoolean(body.favorite);
  } catch (e) {
    errors.push(e.message);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return body;
}

/**
 * Validate progress payload (0..100)
 */
export function validateProgressPayload(body) {
  const errors = [];
  let progress = body?.progress;

  try {
    const n = Number(progress);
    if (!Number.isFinite(n)) {
      errors.push('Progress must be a number');
    } else {
      const clamped = Math.max(0, Math.min(100, Math.round(n)));
      body.progress = clamped;
    }
  } catch (e) {
    errors.push(e.message || 'Invalid progress');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return body;
}

/**
 * Validate list resources query
 */
export function validateListResourcesQuery(query) {
  const errors = [];

  if (query.ownerId) {
    try {
      query.ownerId = validateOwnerId(query.ownerId);
    } catch (e) {
      errors.push(e.message);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return query;
}
