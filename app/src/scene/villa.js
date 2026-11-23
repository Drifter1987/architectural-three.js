import {
  BoxGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Path,
  Shape,
  ShapeGeometry,
  Vector2
} from 'three';

import { buildWindow } from '../components/window.js';
import { batchByMaterial } from './batch.js';
import { createMaterials } from './materials.js';

const PARAPET_HEIGHT = 1.05;
const PARAPET_DEPTH = 0.15;

function segmentLength(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function edgeFrame(edge) {
  const length = segmentLength(edge.a, edge.b);
  if (!length) return null;
  return {
    length,
    ux: (edge.b[0] - edge.a[0]) / length,
    uz: (edge.b[1] - edge.a[1]) / length
  };
}

function projectPoint(edge, frame, [x, z]) {
  return (x - edge.a[0]) * frame.ux + (z - edge.a[1]) * frame.uz;
}

function openingSpan(opening, edge, frame) {
  const [p0, p1] =
    opening.axis === 'x'
      ? [
          [opening.face, opening.s0],
          [opening.face, opening.s1]
        ]
      : [
          [opening.s0, opening.face],
          [opening.s1, opening.face]
        ];
  const t0 = projectPoint(edge, frame, p0);
  const t1 = projectPoint(edge, frame, p1);
  return { t0: Math.min(t0, t1), t1: Math.max(t0, t1) };
}

/**
 * Rectangular holes for one wall, in edge-local coordinates (`a`/`b` along the
 * wall, `bottom`/`top` absolute heights). Pure: no geometry is created.
 */
export function wallHoles(edge, floor, openings) {
  const frame = edgeFrame(edge);
  if (!frame) return [];

  const z0 = floor.z0;
  const z1 = z0 + floor.h;
  const holes = [];

  for (const index of edge.openings || []) {
    const opening = openings[index];
    if (!opening) continue;

    const span = openingSpan(opening, edge, frame);
    const a = Math.max(0.003, span.t0);
    const b = Math.min(frame.length - 0.003, span.t1);
    const sill = opening.sill || 0;
    const bottom = Math.max(z0 + 0.003, z0 + sill);
    const top = Math.min(z1 - 0.003, z0 + sill + opening.h);
    if (b - a < 0.05 || top - bottom < 0.05) continue;

    holes.push({ a, b, bottom, top });
  }

  return holes;
}

/**
 * Attach stair-room openings to a wall by axis, face and span. The stair
 * polygon has no explicit `openings` lists, so the match has to be geometric.
 */
export function stairEdgeOpenings(edge, openings = []) {
  const dx = edge.b[0] - edge.a[0];
  const dz = edge.b[1] - edge.a[1];
  const alongX = Math.abs(dx) >= Math.abs(dz);
  const axis = alongX ? 'y' : 'x';
  const face = alongX ? edge.a[1] : edge.a[0];
  const lo = alongX
    ? Math.min(edge.a[0], edge.b[0])
    : Math.min(edge.a[1], edge.b[1]);
  const hi = alongX
    ? Math.max(edge.a[0], edge.b[0])
    : Math.max(edge.a[1], edge.b[1]);

  return openings.filter(
    (opening) =>
      opening.axis === axis &&
      Math.abs(opening.face - face) < 1e-6 &&
      Math.min(opening.s0, opening.s1) >= lo - 1e-6 &&
      Math.max(opening.s0, opening.s1) <= hi + 1e-6
  );
}

function wallGeometry(edge, floor, openings) {
  const frame = edgeFrame(edge);
  if (!frame || frame.length < 0.02) return null;

  const { length, ux, uz } = frame;
  const z0 = floor.z0;
  const z1 = z0 + floor.h;
  const shape = new Shape();
  shape.moveTo(0, z0);
  shape.lineTo(length, z0);
  shape.lineTo(length, z1);
  shape.lineTo(0, z1);
  shape.closePath();

  for (const hole of wallHoles(edge, floor, openings)) {
    const path = new Path();
    path.moveTo(hole.a, hole.bottom);
    path.lineTo(hole.a, hole.top);
    path.lineTo(hole.b, hole.top);
    path.lineTo(hole.b, hole.bottom);
    path.closePath();
    shape.holes.push(path);
  }

  const geometry = new ShapeGeometry(shape);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const along = position.getX(i);
    position.setXYZ(
      i,
      edge.a[0] + ux * along,
      position.getY(i),
      edge.a[1] + uz * along
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

function buildOpening(opening, z0, materials, name) {
  const width = Math.abs(opening.s1 - opening.s0);
  const height = opening.h;
  if (width < 0.05 || height < 0.05) return null;

  const sill = opening.sill || 0;
  const mid = (opening.s0 + opening.s1) / 2;
  const isDoor = opening.kind === 'D';

  const built = buildWindow({
    width,
    height,
    kind: isDoor ? 'door' : 'window',
    surround: 'flat',
    glazing: isDoor ? 'clear' : 'slide',
    shutters: 'none',
    grille: 'none',
    head: isDoor ? 'none' : 'cornice',
    sill: isDoor ? 'none' : 'plain',
    materials: {
      stone: materials.trim,
      frame: materials.frame,
      glass: isDoor ? materials.doorGlass : materials.glass,
      iron: materials.iron,
      shutterGreen: materials.shutterGreen,
      shutterWood: materials.shutterWood
    }
  });

  const group = built.group;
  group.name = name;
  group.position.set(
    opening.axis === 'x' ? opening.face : mid,
    z0 + sill,
    opening.axis === 'x' ? mid : opening.face
  );
  group.rotation.y =
    opening.axis === 'x'
      ? opening.out > 0
        ? Math.PI / 2
        : -Math.PI / 2
      : opening.out > 0
        ? 0
        : Math.PI;
  group.userData.opening = opening;
  group.userData.partCount = built.info.partCount;
  group.userData.component = built.info;

  return group;
}

function addWall(group, edge, floor, openings, material, name) {
  const geometry = wallGeometry(edge, floor, openings);
  if (!geometry) return null;

  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSlab(group, points, y0, thickness, material, name) {
  if (!Array.isArray(points) || points.length < 3) return null;

  const shape = new Shape(points.map(([x, z]) => new Vector2(x, -z)));
  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y0, 0);
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addParapet(group, segment, z, material, name) {
  const [x1, z1, x2, z2] = segment;
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length < 0.05) return null;

  const mesh = new Mesh(
    new BoxGeometry(length, PARAPET_HEIGHT, PARAPET_DEPTH),
    material
  );
  mesh.name = name;
  mesh.position.set(
    (x1 + x2) / 2,
    z + PARAPET_HEIGHT / 2,
    (z1 + z2) / 2
  );
  mesh.rotation.y = Math.atan2(-(z2 - z1), x2 - x1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addStairRoom(group, model, materials, stats, windowGroups, batchOpenings) {
  const stair = model.stair;
  if (!Array.isArray(stair?.poly) || stair.poly.length < 3) return;

  const floor = { z0: stair.z0, h: stair.h };
  const openings = model.stair_openings || [];

  stair.poly.forEach((a, index) => {
    const b = stair.poly[(index + 1) % stair.poly.length];
    const edge = {
      a,
      b,
      kind: 'stone',
      name: `stair wall ${index}`,
      openings: []
    };
    const local = stairEdgeOpenings(edge, openings);
    edge.openings = local.map((_, slot) => slot);

    if (
      addWall(group, edge, floor, local, materials.wall, `stair:wall:${index}`)
    ) {
      stats.walls += 1;
    }

    local.forEach((opening, slot) => {
      const mesh = buildOpening(
        opening,
        floor.z0,
        materials,
        `stair:opening:${index}:${slot}`
      );
      if (!mesh) return;
      windowGroups.push(mesh);
      if (!batchOpenings) group.add(mesh);
      stats.openings += 1;
    });
  });

  if (
    addSlab(
      group,
      stair.poly,
      stair.z0 + stair.h,
      0.2,
      [materials.roofTop, materials.roofSide],
      'stair:roof'
    )
  ) {
    stats.slabs += 1;
  }
}

export function buildVilla(model, { batchOpenings = false, materialState } = {}) {
  const group = new Group();
  group.name = 'villa';
  const materials = createMaterials(materialState);
  const stats = { walls: 0, openings: 0, slabs: 0, balconies: 0 };
  const windowGroups = [];
  const floors = new Map((model.floors || []).map((floor) => [floor.key, floor]));
  const openings = model.openings || [];

  for (const floor of model.floors || []) {
    for (const [index, edge] of (floor.edges || []).entries()) {
      const wall = addWall(
        group,
        edge,
        floor,
        openings,
        edge.kind === 'soil' ? materials.soil : materials.wall,
        `wall:${floor.key}:${index}`
      );
      if (wall) stats.walls += 1;
    }
  }

  openings.forEach((opening, index) => {
    const floor = floors.get(opening.floor);
    if (!floor) return;
    const mesh = buildOpening(
      opening,
      floor.z0,
      materials,
      `opening:${index}`
    );
    if (!mesh) return;
    windowGroups.push(mesh);
    if (!batchOpenings) group.add(mesh);
    stats.openings += 1;
  });

  for (const floor of model.floors || []) {
    if (floor.key === 'BF') continue;
    if (
      addSlab(
        group,
        model.roof?.poly,
        floor.z0 - 0.3,
        0.3,
        materials.slab,
        `slab:floor:${floor.key}`
      )
    ) {
      stats.slabs += 1;
    }
  }

  if (
    model.roof &&
    addSlab(
      group,
      model.roof.poly,
      model.roof.z0,
      Math.max(0.25, model.roof.z1 - model.roof.z0),
      [materials.roofTop, materials.roofSide],
      'slab:roof'
    )
  ) {
    stats.slabs += 1;
  }

  (model.balconies || []).forEach((balcony, index) => {
    if (
      balcony.slab &&
      addSlab(
        group,
        balcony.poly,
        balcony.z - 0.25,
        0.25,
        materials.slab,
        `balcony:${index}:slab`
      )
    ) {
      stats.slabs += 1;
    }

    (balcony.par || []).forEach((segment, slot) => {
      addParapet(
        group,
        segment,
        balcony.z,
        materials.trim,
        `balcony:${index}:parapet:${slot}`
      );
    });

    stats.balconies += 1;
  });

  addStairRoom(
    group,
    model,
    materials,
    stats,
    windowGroups,
    batchOpenings
  );

  let windowBatches = 0;
  if (batchOpenings && windowGroups.length) {
    const batch = batchByMaterial(windowGroups);
    windowBatches = batch.children.length;
    group.add(batch);
  }

  return { group, materials, stats, windowGroups, windowBatches };
}
