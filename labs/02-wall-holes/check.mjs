import assert from 'node:assert/strict';
import { wallGeometry, triangleCentroids, insideHole, TEX_M } from './wall.mjs';

const length = 6.898;
const height = 3.1;
const openings = [
  { x0: 1.311, x1: 3.546, y0: 0.7, y1: 2.2 },
  { x0: 5.1, x1: 5.9, y0: 0.0, y1: 2.1 }
];

const wall = wallGeometry({ length, height, openings });
assert.equal(wall.holes.length, openings.length, 'both openings became holes');

const position = wall.geometry.attributes.position;
const uv = wall.geometry.attributes.uv;
assert.ok(position.count > 6, 'triangulation added vertices');

for (let i = 0; i < position.count; i++) {
  const x = position.getX(i), y = position.getY(i);
  assert.ok(Math.abs(uv.getX(i) - x / TEX_M) < 1e-9, 'u follows wall length');
  assert.ok(Math.abs(uv.getY(i) - y / TEX_M) < 1e-9, 'v follows height');
}

const centroids = triangleCentroids(wall.geometry);
const inside = centroids.filter((c) => insideHole(c, wall.holes));
assert.equal(inside.length, 0, 'no triangle may span an opening');

const box = wall.geometry.boundingBox;
assert.ok(Math.abs(box.max.x - length) < 1e-5, 'bounding box follows wall length');
assert.ok(Math.abs(box.max.y - height) < 1e-5, 'bounding box follows wall height');

console.log('lab 02 wall holes  OK',
  JSON.stringify({ triangles: centroids.length, holes: wall.holes.length, uvMax: [uv.getX(0), uv.getY(0)] }));
