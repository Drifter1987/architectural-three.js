import { MODEL_SCHEMA_VERSION, validateModel } from '../schema.js';

const EPSILON = 1e-6;

function isPoint(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  );
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    area += x0 * z1 - x1 * z0;
  }
  return area / 2;
}

function perimeter(points) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    total += Math.hypot(x1 - x0, z1 - z0);
  }
  return total;
}

/**
 * Accept any closed outline and return a counter-clockwise ring starting at the
 * lexicographically smallest point, so two inputs that describe the same house
 * produce the same model.
 */
function normalizeRing(outline) {
  if (!Array.isArray(outline) || outline.length < 3) {
    throw new Error('outline must contain at least three [x, z] points');
  }

  const points = outline.map((point) => {
    if (!isPoint(point)) {
      throw new Error('every outline point must be [x, z] with finite numbers');
    }
    return [point[0], point[1]];
  });

  const [firstX, firstZ] = points[0];
  const [lastX, lastZ] = points[points.length - 1];
  if (Math.hypot(firstX - lastX, firstZ - lastZ) < EPSILON) points.pop();
  if (points.length < 3) {
    throw new Error('outline must contain at least three distinct points');
  }

  const ring = signedArea(points) < 0 ? points.slice().reverse() : points;

  let start = 0;
  for (let i = 1; i < ring.length; i++) {
    if (
      ring[i][0] < ring[start][0] ||
      (ring[i][0] === ring[start][0] && ring[i][1] < ring[start][1])
    ) {
      start = i;
    }
  }

  return ring.slice(start).concat(ring.slice(0, start));
}

function edgeAxes(edge) {
  const dx = edge.b[0] - edge.a[0];
  const dz = edge.b[1] - edge.a[1];
  const length = Math.hypot(dx, dz);
  if (length < EPSILON) throw new Error('wall edges must not be zero length');
  return {
    dx,
    dz,
    length,
    horizontal: Math.abs(dx) >= Math.abs(dz),
    ux: dx / length,
    uz: dz / length
  };
}

/**
 * Build a canonical v2 wall-graph model from a house specification:
 *
 * {
 *   name, outline: [[x,z], ...],
 *   storeys: [{ key, name, height, z0?, edgeNames?, edgeKinds? }],
 *   openings: [{ floor, edge, offset, width, height, sill, kind, name }],
 *   roof: false | { z0?, z1?, thickness?, poly? },
 *   topography,
 *   balconies, steps, planters, columns, stair, terrace
 * }
 *
 * Openings must sit on axis-aligned walls: the v2 record stores an axis and a
 * face, so a diagonal wall can be built but cannot carry a placed opening yet.
 */
export function createHouseModel(spec = {}) {
  const ring = normalizeRing(spec.outline);

  const storeys =
    Array.isArray(spec.storeys) && spec.storeys.length
      ? spec.storeys
      : [{ key: 'GF', name: 'Ground floor', height: spec.height ?? 3.2 }];

  let nextElevation = 0;
  const floors = storeys.map((storey, index) => {
    if (!storey || typeof storey !== 'object') {
      throw new Error(`storeys[${index}] must be an object`);
    }
    const height = storey.height ?? storey.h;
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error(`storeys[${index}].height must be greater than 0`);
    }
    const z0 = storey.z0 ?? nextElevation;
    if (!Number.isFinite(z0)) {
      throw new Error(`storeys[${index}].z0 must be a finite number`);
    }

    const floor = {
      key: storey.key ?? `L${index}`,
      name: storey.name ?? `Storey ${index + 1}`,
      z0,
      h: height,
      edges: ring.map((a, edgeIndex) => {
        const b = ring[(edgeIndex + 1) % ring.length];
        return {
          a: [...a],
          b: [...b],
          kind: storey.edgeKinds?.[edgeIndex] ?? 'stone',
          name: storey.edgeNames?.[edgeIndex] ?? `Wall ${edgeIndex + 1}`,
          openings: []
        };
      })
    };

    nextElevation = z0 + height;
    return floor;
  });

  const byKey = new Map(floors.map((floor) => [floor.key, floor]));
  const openings = [];

  (spec.openings ?? []).forEach((item, slot) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`openings[${slot}] must be an object`);
    }

    const floor =
      typeof item.floor === 'number' ? floors[item.floor] : byKey.get(item.floor);
    if (!floor) {
      throw new Error(`openings[${slot}] names an unknown storey`);
    }

    if (
      !Number.isInteger(item.edge) ||
      item.edge < 0 ||
      item.edge >= floor.edges.length
    ) {
      throw new Error(`openings[${slot}].edge is outside storey ${floor.key}`);
    }

    const edge = floor.edges[item.edge];
    const axes = edgeAxes(edge);
    if (Math.abs(axes.dx) > EPSILON && Math.abs(axes.dz) > EPSILON) {
      throw new Error(
        `openings[${slot}] is on a diagonal wall; v2 openings require an axis-aligned edge`
      );
    }

    const offset = item.offset ?? 0;
    const width = item.width ?? item.w;
    const height = item.height ?? item.h;
    if (!Number.isFinite(offset) || offset < -EPSILON) {
      throw new Error(`openings[${slot}].offset must be zero or greater`);
    }
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error(`openings[${slot}].width must be greater than 0`);
    }
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error(`openings[${slot}].height must be greater than 0`);
    }
    if (offset + width > axes.length + EPSILON) {
      throw new Error(
        `openings[${slot}] runs outside its wall (${offset + width} m of ${axes.length} m)`
      );
    }

    const axis = axes.horizontal ? 'y' : 'x';
    const face = axes.horizontal ? edge.a[1] : edge.a[0];
    const along = axes.horizontal ? axes.ux : axes.uz;
    const origin = axes.horizontal ? edge.a[0] : edge.a[1];
    const sA = origin + along * offset;
    const sB = sA + along * width;
    const s0 = Math.min(sA, sB);
    const s1 = Math.max(sA, sB);

    // Counter-clockwise ring: outward normal is (dz, -dx).
    const nx = axes.dz / axes.length;
    const nz = -axes.dx / axes.length;
    const out = axes.horizontal ? Math.sign(nz) : Math.sign(nx);
    if (out !== -1 && out !== 1) {
      throw new Error(`openings[${slot}] could not resolve its outward face`);
    }

    const kind = item.kind ?? 'W';
    if (kind !== 'W' && kind !== 'D') {
      throw new Error(`openings[${slot}].kind must be "W" or "D"`);
    }

    const opening = {
      floor: floor.key,
      edge: item.edge,
      axis,
      face,
      out,
      s0,
      s1,
      sill: item.sill ?? 0,
      kind,
      w: width,
      h: height,
      name: item.name ?? `Opening ${slot + 1}`
    };

    edge.openings.push(openings.length);
    openings.push(opening);
  });

  const top =
    floors[floors.length - 1].z0 + floors[floors.length - 1].h;
  const roofPoly = (spec.roof?.poly ?? ring).map((point) => [...point]);
  const roofZ0 = spec.roof?.z0 ?? top;

  const roof =
    spec.roof === false
      ? undefined
      : {
          poly: roofPoly,
          z0: roofZ0,
          z1: spec.roof?.z1 ?? roofZ0 + (spec.roof?.thickness ?? 0.32),
          perimeter: perimeter(roofPoly)
        };

  const model = {
    version: MODEL_SCHEMA_VERSION,
    name: spec.name ?? 'Procedural house',
    units: spec.units ?? 'm',
    floors,
    openings,
    balconies: spec.balconies ?? [],
    roof,
    stair: spec.stair,
    terrace: spec.terrace,
    steps: spec.steps ?? [],
    planters: spec.planters ?? [],
    columns: spec.columns ?? [],
    check: []
  };

  if (spec.topography !== undefined) {
    model.site = {
      topography: structuredClone(spec.topography),
      outline: ring.map((point) => [...point])
    };
  }

  const validation = validateModel(model);
  if (!validation.ok) {
    const first = validation.errors[0];
    throw new Error(
      `house model is invalid: ${first?.path ?? '$'}: ${first?.message ?? 'unknown error'}`
    );
  }

  return model;
}
