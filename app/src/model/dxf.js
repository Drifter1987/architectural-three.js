/**
 * M2 — CAD walls → canonical wall graph.
 *
 * Supported DXF entities: LINE and straight LWPOLYLINE. Curved bulges are an
 * explicit error, not a silent approximation. Openings are not inferred from
 * rhythm: they are attached from a sidecar array with floor, edge and offsets.
 *
 * Browser-safe: no Node APIs, no DOM, no three.js.
 */
import { MODEL_SCHEMA_VERSION, validateModel } from '../schema.js';

export class DxfImportError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'DxfImportError';
    this.validation = options.validation ?? null;
    this.layer = options.layer ?? null;
  }
}

const UNIT_SCALE = new Map([
  [0, 1], // unitless
  [1, 0.0254], // inches
  [2, 0.3048], // feet
  [4, 0.001], // millimetres
  [5, 0.01], // centimetres
  [6, 1] // metres
]);

function fail(message, options) {
  throw new DxfImportError(message, options);
}

function groupPairs(source) {
  const lines = String(source)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n');

  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  if (lines.length % 2 !== 0) {
    fail('DXF has an odd number of group lines');
  }

  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    const code = Number(lines[index].trim());
    if (!Number.isInteger(code)) {
      fail(`invalid DXF group code "${lines[index]}" at line ${index + 1}`);
    }
    pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function group(groups, code) {
  const found = groups.find((entry) => entry.code === code);
  return found ? found.value : null;
}

function numberGroup(groups, code) {
  const value = group(groups, code);
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function headerUnitScale(pairs) {
  for (let index = 0; index < pairs.length - 1; index += 1) {
    if (pairs[index].code === 9 && pairs[index].value === '$INSUNITS') {
      const next = pairs[index + 1];
      if (next.code === 70) {
        const units = Number(next.value);
        if (UNIT_SCALE.has(units)) return UNIT_SCALE.get(units);
      }
    }
  }
  return 1;
}

function collectEntities(pairs) {
  const entities = [];
  let section = null;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];

    if (pair.code === 0 && pair.value === 'SECTION') {
      const next = pairs[index + 1];
      section = next && next.code === 2 ? next.value.toUpperCase() : null;
      if (section) index += 1;
      continue;
    }

    if (pair.code === 0 && pair.value === 'ENDSEC') {
      section = null;
      continue;
    }

    if (
      section !== 'ENTITIES' ||
      pair.code !== 0 ||
      (pair.value !== 'LINE' && pair.value !== 'LWPOLYLINE')
    ) {
      continue;
    }

    let end = index + 1;
    while (end < pairs.length && pairs[end].code !== 0) end += 1;
    entities.push({ type: pair.value, groups: pairs.slice(index + 1, end) });
    index = end - 1;
  }

  return entities;
}

function entityLayer(groups) {
  const layer = group(groups, 8);
  return layer && layer.trim() ? layer.trim() : '0';
}

function lineSegments(groups) {
  const x1 = numberGroup(groups, 10);
  const y1 = numberGroup(groups, 20);
  const x2 = numberGroup(groups, 11);
  const y2 = numberGroup(groups, 21);

  if ([x1, y1, x2, y2].some((value) => value === null)) {
    fail('LINE entity is missing 10/20/11/21 coordinates');
  }

  return [[[x1, y1], [x2, y2]]];
}

function lwPolylineSegments(groups) {
  const vertices = [];
  let current = null;
  let closed = false;

  for (const entry of groups) {
    if (entry.code === 42 && Number(entry.value) !== 0) {
      fail(
        'curved LWPOLYLINE segments (bulge) are not supported; explode the arc into straight lines first'
      );
    }
    if (entry.code === 70) {
      const flags = Number(entry.value);
      if (Number.isInteger(flags)) closed = (flags & 1) === 1;
    }
    if (entry.code === 10) {
      if (current) vertices.push(current);
      current = { x: Number(entry.value), y: null };
    } else if (entry.code === 20) {
      if (!current) fail('LWPOLYLINE vertex has a 20 code before its 10 code');
      current.y = Number(entry.value);
    }
  }
  if (current) vertices.push(current);

  const points = vertices.map((vertex, index) => {
    if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y)) {
      fail(`LWPOLYLINE vertex ${index} has invalid coordinates`);
    }
    return [vertex.x, vertex.y];
  });

  if (points.length < 2) {
    fail('LWPOLYLINE needs at least two vertices');
  }

  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    segments.push([points[index], points[index + 1]]);
  }
  if (closed && points.length > 2) {
    segments.push([points[points.length - 1], points[0]]);
  }

  return segments;
}

function floorKeyForLayer(layer, options) {
  const mapped = options.floorByLayer?.[layer];
  if (mapped) return mapped;

  const prefix = layer.match(/^(BF|GF|FF)(?:[-_:\s]|$)/i);
  if (prefix) return prefix[1].toUpperCase();

  return options.defaultFloor ?? 'GF';
}

function findFloor(floorByKey, key) {
  return (
    floorByKey.get(String(key).toUpperCase()) ??
    [...floorByKey.values()].find(
      (floor) => floor.key.toLowerCase() === String(key).toLowerCase()
    ) ??
    null
  );
}

/**
 * @param {string} source ASCII DXF text
 * @param {{
 *   floors?: Array<{key:string,name:string,z0:number,h:number}>,
 *   floorByLayer?: Record<string,string>,
 *   defaultFloor?: string,
 *   edgeNames?: Record<string,string>,
 *   kind?: string,
 *   kindByLayer?: Record<string,string>,
 *   unitScale?: number,
 *   name?: string
 * }} [options]
 * @returns {object} canonical v2 model
 */
export function importDxfWalls(source, options = {}) {
  const pairs = groupPairs(source);
  const entities = collectEntities(pairs);

  const floorDefinitions = options.floors ?? [
    { key: 'GF', name: 'Ground floor', z0: 0, h: 3.3 }
  ];
  if (!Array.isArray(floorDefinitions) || floorDefinitions.length === 0) {
    fail('options.floors must be a non-empty array');
  }

  const floorByKey = new Map();
  for (const floor of floorDefinitions) {
    if (!floor || typeof floor.key !== 'string' || floor.key.trim() === '') {
      fail('every floor needs a non-empty key');
    }
    floorByKey.set(floor.key.toUpperCase(), { ...floor, edges: [] });
  }

  const scale =
    options.unitScale === undefined ? headerUnitScale(pairs) : options.unitScale;
  if (!Number.isFinite(scale) || scale <= 0) {
    fail('unit scale must be a finite number greater than 0');
  }

  for (const entity of entities) {
    const layer = entityLayer(entity.groups);
    const floorKey = floorKeyForLayer(layer, options);
    const floor = findFloor(floorByKey, floorKey);
    if (!floor) {
      fail(
        `no floor metadata for layer "${layer}" (mapped to "${floorKey}"); add it to options.floors`,
        { layer }
      );
    }

    const segments =
      entity.type === 'LINE'
        ? lineSegments(entity.groups)
        : lwPolylineSegments(entity.groups);
    const name =
      options.edgeNames?.[layer] ??
      (layer === '0' ? 'DXF layer 0' : layer);
    const kind = options.kindByLayer?.[layer] ?? options.kind ?? 'stone';

    for (const [a, b] of segments) {
      const start = [a[0] * scale, a[1] * scale];
      const end = [b[0] * scale, b[1] * scale];
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      if (!(length > 1e-9)) {
        fail('DXF wall segment has zero length', { layer });
      }
      floor.edges.push({
        a: start,
        b: end,
        len: length,
        kind,
        name,
        openings: []
      });
    }
  }

  const floors = [...floorByKey.values()]
    .filter((floor) => floor.edges.length > 0)
    .map(({ key, name, z0, h, edges }) => ({ key, name, z0, h, edges }));

  if (floors.length === 0) {
    fail('DXF contains no supported wall entities (LINE or straight LWPOLYLINE)');
  }

  const model = {
    version: MODEL_SCHEMA_VERSION,
    name: options.name ?? 'DXF import',
    units: 'm',
    floors,
    openings: [],
    balconies: [],
    steps: [],
    planters: [],
    columns: [],
    check: []
  };

  const validation = validateModel(model);
  if (!validation.ok) {
    fail('DXF walls do not form a valid wall graph', { validation });
  }

  return model;
}

/**
 * Attach explicit openings after the walls exist. This is the only way an
 * opening gets into an imported model; there is no rhythm or façade-rule
 * inference.
 *
 * @param {object} model canonical v2 model
 * @param {Array<{
 *   floor: string, edge: number, s0: number, s1: number, sill?: number,
 *   h: number, kind?: 'W'|'D', name?: string, face?: number, out?: -1|1,
 *   axis?: 'x'|'y'
 * }> | { openings: Array<object> }} specs
 * @returns {object} canonical v2 model with openings
 */
export function attachOpenings(model, specs) {
  const base = validateModel(model);
  if (!base.ok) {
    fail('base model is not valid before openings are attached', {
      validation: base
    });
  }

  const list = Array.isArray(specs) ? specs : specs?.openings;
  if (!Array.isArray(list)) {
    fail('openings must be an array or { openings: [...] }');
  }

  const next = structuredClone(model);

  list.forEach((spec, index) => {
    if (!spec || typeof spec !== 'object') {
      fail(`opening ${index} must be an object`);
    }

    const floor = findFloor(
      new Map(next.floors.map((entry) => [entry.key.toUpperCase(), entry])),
      spec.floor
    );
    if (!floor) {
      fail(`opening ${index} references unknown floor "${spec.floor}"`);
    }

    if (!Number.isInteger(spec.edge) || spec.edge < 0 || spec.edge >= floor.edges.length) {
      fail(`opening ${index} references missing edge ${spec.edge} on floor "${floor.key}"`);
    }
    const edge = floor.edges[spec.edge];

    const s0 = Number(spec.s0);
    const s1 = Number(spec.s1);
    if (!Number.isFinite(s0) || !Number.isFinite(s1) || !(s1 > s0) || s0 < 0) {
      fail(`opening ${index} needs 0 <= s0 < s1`);
    }
    if (Number.isFinite(edge.len) && s1 > edge.len + 1e-6) {
      fail(`opening ${index} ends at ${s1} m on a ${edge.len} m edge`);
    }

    const height = Number(spec.h);
    if (!Number.isFinite(height) || height <= 0) {
      fail(`opening ${index} needs a positive height`);
    }

    const kind = spec.kind ?? 'W';
    if (kind !== 'W' && kind !== 'D') {
      fail(`opening ${index} kind must be "W" or "D"`);
    }

    const sill = spec.sill === undefined ? 0 : Number(spec.sill);
    if (!Number.isFinite(sill)) {
      fail(`opening ${index} sill must be a finite number`);
    }

    const dx = edge.b[0] - edge.a[0];
    const dz = edge.b[1] - edge.a[1];
    const axis = spec.axis ?? (Math.abs(dx) >= Math.abs(dz) ? 'y' : 'x');
    const out = spec.out ?? 1;
    const face = spec.face ?? 0;
    if (axis !== 'x' && axis !== 'y') {
      fail(`opening ${index} axis must be "x" or "y"`);
    }
    if (out !== -1 && out !== 1) {
      fail(`opening ${index} out must be -1 or 1`);
    }
    if (!Number.isFinite(face)) {
      fail(`opening ${index} face must be a finite number`);
    }

    const openingIndex = next.openings.length;
    next.openings.push({
      floor: floor.key,
      edge: spec.edge,
      axis,
      face,
      out,
      s0,
      s1,
      sill,
      kind,
      w: s1 - s0,
      h: height,
      name: spec.name ?? `Opening ${openingIndex + 1}`
    });
    edge.openings.push(openingIndex);
  });

  const validation = validateModel(next);
  if (!validation.ok) {
    fail('openings do not form a valid wall graph', { validation });
  }

  return next;
}
