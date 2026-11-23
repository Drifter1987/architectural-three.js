/**
 * M1 — wall-graph import / round-trip.
 *
 * The frozen reference stores a complete model but predates the version field.
 * `importReferenceModel` validates that legacy shape, deep-copies it, and stamps
 * the canonical version. It never mutates the source object.
 *
 * Browser-safe: no Node APIs, no DOM, no three.js.
 */
import { MODEL_SCHEMA_VERSION, validateModel } from '../schema.js';

export class ModelImportError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'ModelImportError';
    this.validation = options.validation ?? null;
  }
}

function rejected(message, validation) {
  return new ModelImportError(message, { validation });
}

function requireValid(model, { allowLegacy }) {
  const validation = validateModel(model, { allowLegacy });
  if (!validation.ok) {
    const first = validation.errors[0];
    const detail = first ? `${first.path}: ${first.message}` : 'unknown error';
    throw rejected(`model validation failed (${detail})`, validation);
  }
  return validation;
}

/**
 * Convert a legacy reference model into a canonical v2 model.
 *
 * @param {unknown} legacy
 * @param {{ name?: string, units?: string }} [options]
 * @returns {object} canonical model (deep copy)
 */
export function importReferenceModel(legacy, options = {}) {
  requireValid(legacy, { allowLegacy: true });

  const canonical = structuredClone(legacy);
  canonical.version = MODEL_SCHEMA_VERSION;
  canonical.name =
    canonical.name ??
    options.name ??
    'Villa Abdo (reference model)';
  canonical.units = canonical.units ?? options.units ?? 'm';

  return canonical;
}

/**
 * Serialize only a valid canonical model.
 *
 * @param {unknown} model
 * @returns {string}
 */
export function exportCanonicalModel(model) {
  requireValid(model, { allowLegacy: false });
  return JSON.stringify(model);
}

/**
 * Parse and validate a canonical model.
 *
 * @param {string} json
 * @returns {object}
 */
export function parseCanonicalModel(json) {
  let model;
  try {
    model = JSON.parse(json);
  } catch (error) {
    throw rejected('model JSON could not be parsed', {
      ok: false,
      errors: [{ path: '$', message: String(error.message || error) }]
    });
  }

  requireValid(model, { allowLegacy: false });
  return model;
}

/**
 * Import, serialize and parse again. The result must deep-equal the canonical
 * import; the source object remains untouched.
 *
 * @param {unknown} legacy
 * @param {{ name?: string, units?: string }} [options]
 * @returns {object}
 */
export function roundTripModel(legacy, options = {}) {
  const canonical = importReferenceModel(legacy, options);
  return parseCanonicalModel(exportCanonicalModel(canonical));
}
