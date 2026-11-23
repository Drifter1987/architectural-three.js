/**
 * Canonical wall-graph schema (ADR 0002), version 2.
 *
 * Pure data validation: no DOM, no three.js, no mutation. The reference
 * `model-data` predates the version field, so it can be checked with
 * `{ allowLegacy: true }` as the parity fixture.
 */

export const MODEL_SCHEMA_VERSION = 2;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isIndex = (value) => Number.isInteger(value) && value >= 0;
const isPoint = (value) =>
  Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber);

/**
 * @param {unknown} model
 * @param {{ allowLegacy?: boolean, maxErrors?: number }} [options]
 * @returns {{
 *   ok: boolean,
 *   errors: Array<{ path: string, message: string }>,
 *   warnings: Array<{ path: string, message: string }>,
 *   truncated: boolean,
 *   version: number | null,
 *   summary: { floors: number, walls: number, openings: number }
 * }}
 */
export function validateModel(model, options = {}) {
  const allowLegacy = options.allowLegacy === true;
  const maxErrors =
    Number.isInteger(options.maxErrors) && options.maxErrors > 0
      ? options.maxErrors
      : 50;

  const errors = [];
  const warnings = [];
  let truncated = false;

  const add = (path, message) => {
    if (errors.length < maxErrors) errors.push({ path, message });
    else truncated = true;
  };
  const warn = (path, message) => warnings.push({ path, message });

  const summary = { floors: 0, walls: 0, openings: 0 };

  if (!isRecord(model)) {
    add('$', 'model must be an object');
    return { ok: false, errors, warnings, truncated, version: null, summary };
  }

  let version = model.version;
  if (version === undefined) {
    if (allowLegacy) {
      version = 1;
      warn('$.version', 'missing version; accepted as legacy v1');
    } else {
      add('$.version', `missing version; expected ${MODEL_SCHEMA_VERSION}`);
      version = null;
    }
  } else if (version === 1 && allowLegacy) {
    warn('$.version', 'legacy version 1; expected version 2');
  } else if (version !== MODEL_SCHEMA_VERSION) {
    add('$.version', `must be ${MODEL_SCHEMA_VERSION}`);
  }

  if (model.name !== undefined && !isText(model.name)) {
    add('$.name', 'must be a non-empty string when present');
  }

  const seenFloorKeys = new Set();
  const floorEdges = new Map();

  if (!Array.isArray(model.floors) || model.floors.length === 0) {
    add('$.floors', 'must be a non-empty array');
  } else {
    summary.floors = model.floors.length;

    model.floors.forEach((floor, floorIndex) => {
      const path = `$.floors[${floorIndex}]`;

      if (!isRecord(floor)) {
        add(path, 'must be an object');
        return;
      }

      if (!isText(floor.key)) {
        add(`${path}.key`, 'must be a non-empty string');
      } else if (seenFloorKeys.has(floor.key)) {
        add(`${path}.key`, `duplicate floor key "${floor.key}"`);
      } else {
        seenFloorKeys.add(floor.key);
      }

      if (!isText(floor.name)) {
        add(`${path}.name`, 'must be a non-empty room/facade name');
      }
      if (!isFiniteNumber(floor.z0)) {
        add(`${path}.z0`, 'must be a finite number');
      }
      if (!isFiniteNumber(floor.h) || floor.h <= 0) {
        add(`${path}.h`, 'must be a finite number greater than 0');
      }

      if (!Array.isArray(floor.edges) || floor.edges.length === 0) {
        add(`${path}.edges`, 'must be a non-empty array');
        return;
      }

      floorEdges.set(floor.key, floor.edges);

      floor.edges.forEach((edge, edgeIndex) => {
        const edgePath = `${path}.edges[${edgeIndex}]`;
        summary.walls += 1;

        if (!isRecord(edge)) {
          add(edgePath, 'must be an object');
          return;
        }

        if (!isPoint(edge.a)) {
          add(`${edgePath}.a`, 'must be [x, z] with finite numbers');
        }
        if (!isPoint(edge.b)) {
          add(`${edgePath}.b`, 'must be [x, z] with finite numbers');
        }
        if (isPoint(edge.a) && isPoint(edge.b)) {
          if (edge.a[0] === edge.b[0] && edge.a[1] === edge.b[1]) {
            add(edgePath, 'a and b must not be the same point');
          }
        }
        if (!isText(edge.kind)) {
          add(`${edgePath}.kind`, 'must be a non-empty string');
        }
        if (!isText(edge.name)) {
          add(`${edgePath}.name`, 'must be a non-empty wall name');
        }
        if (!Array.isArray(edge.openings)) {
          add(`${edgePath}.openings`, 'must be an array of opening indices');
        } else {
          const seen = new Set();
          edge.openings.forEach((openingIndex, slot) => {
            if (!isIndex(openingIndex)) {
              add(
                `${edgePath}.openings[${slot}]`,
                'must be a non-negative integer'
              );
            } else if (seen.has(openingIndex)) {
              add(
                `${edgePath}.openings[${slot}]`,
                `duplicate opening index ${openingIndex}`
              );
            } else {
              seen.add(openingIndex);
            }
          });
        }
      });
    });
  }

  const openings = model.openings;

  if (!Array.isArray(openings)) {
    add('$.openings', 'must be an array');
  } else {
    summary.openings = openings.length;

    openings.forEach((opening, openingIndex) => {
      const path = `$.openings[${openingIndex}]`;

      if (!isRecord(opening)) {
        add(path, 'must be an object');
        return;
      }

      if (!isFiniteNumber(opening.face)) {
        add(`${path}.face`, 'must be a finite numeric offset');
      }
      if (opening.axis !== 'x' && opening.axis !== 'y') {
        add(`${path}.axis`, 'must be "x" or "y"');
      }
      if (opening.out !== -1 && opening.out !== 1) {
        add(`${path}.out`, 'must be -1 or 1');
      }
      if (!isFiniteNumber(opening.s0)) {
        add(`${path}.s0`, 'must be a finite number');
      }
      if (!isFiniteNumber(opening.s1)) {
        add(`${path}.s1`, 'must be a finite number');
      }
      if (
        isFiniteNumber(opening.s0) &&
        isFiniteNumber(opening.s1) &&
        !(opening.s1 > opening.s0)
      ) {
        add(`${path}.s1`, 'must be greater than s0');
      }
      if (!isFiniteNumber(opening.sill)) {
        add(`${path}.sill`, 'must be a finite number');
      }
      if (opening.kind !== 'W' && opening.kind !== 'D') {
        add(`${path}.kind`, 'must be "W" (window) or "D" (door)');
      }
      if (!isFiniteNumber(opening.w) || opening.w <= 0) {
        add(`${path}.w`, 'must be a finite number greater than 0');
      }
      if (!isFiniteNumber(opening.h) || opening.h <= 0) {
        add(`${path}.h`, 'must be a finite number greater than 0');
      }
      if (!isText(opening.name)) {
        add(`${path}.name`, 'must be a non-empty opening name');
      }

      if (!isText(opening.floor)) {
        add(`${path}.floor`, 'must be a floor key');
        return;
      }

      const edges = floorEdges.get(opening.floor);
      if (!edges) {
        add(`${path}.floor`, `unknown floor "${opening.floor}"`);
        return;
      }

      if (!isIndex(opening.edge)) {
        add(`${path}.edge`, 'must be a non-negative integer');
        return;
      }

      if (opening.edge >= edges.length) {
        add(
          `${path}.edge`,
          `index ${opening.edge} is outside floor "${opening.floor}" (${edges.length} edges)`
        );
        return;
      }

      const edge = edges[opening.edge];
      if (!isRecord(edge) || !Array.isArray(edge.openings)) {
        return;
      }

      if (!edge.openings.includes(openingIndex)) {
        add(
          path,
          `opening is not listed on edge "${opening.floor}"[${opening.edge}]`
        );
      }
    });
  }

  // Edge lists may point at openings that do not exist.
  if (Array.isArray(model.floors)) {
    model.floors.forEach((floor, floorIndex) => {
      if (!isRecord(floor) || !Array.isArray(floor.edges)) return;
      floor.edges.forEach((edge, edgeIndex) => {
        if (!isRecord(edge) || !Array.isArray(edge.openings)) return;
        edge.openings.forEach((openingIndex, slot) => {
          if (isIndex(openingIndex) && (!Array.isArray(openings) || openingIndex >= openings.length)) {
            add(
              `$.floors[${floorIndex}].edges[${edgeIndex}].openings[${slot}]`,
              `opening index ${openingIndex} does not exist`
            );
          }
        });
      });
    });
  }

  if (model.stair_openings !== undefined) {
    if (!Array.isArray(model.stair_openings)) {
      add('$.stair_openings', 'must be an array when present');
    } else {
      model.stair_openings.forEach((opening, openingIndex) => {
        const path = `$.stair_openings[${openingIndex}]`;
        if (!isRecord(opening)) {
          add(path, 'must be an object');
          return;
        }
        if (opening.axis !== 'x' && opening.axis !== 'y') {
          add(`${path}.axis`, 'must be "x" or "y"');
        }
        if (!isFiniteNumber(opening.face)) {
          add(`${path}.face`, 'must be a finite numeric offset');
        }
        if (opening.out !== -1 && opening.out !== 1) {
          add(`${path}.out`, 'must be -1 or 1');
        }
        if (
          !isFiniteNumber(opening.s0) ||
          !isFiniteNumber(opening.s1) ||
          !(opening.s1 > opening.s0)
        ) {
          add(`${path}.s1`, 'must be a finite number greater than s0');
        }
        if (!isFiniteNumber(opening.sill)) {
          add(`${path}.sill`, 'must be a finite number');
        }
        if (opening.kind !== 'W' && opening.kind !== 'D') {
          add(`${path}.kind`, 'must be "W" or "D"');
        }
        if (!isFiniteNumber(opening.w) || opening.w <= 0) {
          add(`${path}.w`, 'must be a finite number greater than 0');
        }
        if (!isFiniteNumber(opening.h) || opening.h <= 0) {
          add(`${path}.h`, 'must be a finite number greater than 0');
        }
        if (!isText(opening.name)) {
          add(`${path}.name`, 'must be a non-empty opening name');
        }
      });
    }
  }

  for (const key of ['balconies', 'steps', 'planters', 'columns', 'check']) {
    if (model[key] === undefined) continue;
    if (!Array.isArray(model[key])) {
      add(`$.${key}`, 'must be an array when present');
      continue;
    }
    model[key].forEach((item, index) => {
      if (!isRecord(item)) {
        add(`$.${key}[${index}]`, 'must be an object');
      } else if (key === 'check' && !isText(item.key)) {
        add(`$.check[${index}].key`, 'must be a non-empty reconciliation key');
      }
    });
  }

  for (const key of ['roof', 'stair', 'terrace', 'stepwall']) {
    if (model[key] !== undefined && !isRecord(model[key])) {
      add(`$.${key}`, 'must be an object when present');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    truncated,
    version,
    summary
  };
}
