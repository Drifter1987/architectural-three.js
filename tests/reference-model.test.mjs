import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'reference/parti-pris-three.js.html'), 'utf8');

function jsonTag(id) {
  const match = html.match(new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)</script>`));
  assert.ok(match, `missing #${id}`);
  return JSON.parse(match[1]);
}

const model = jsonTag('model-data');
const estimate = jsonTag('estimate-data');
const ideas = jsonTag('ideas-data');

test('model is a measured three-storey villa, not a generated footprint', () => {
  assert.equal(model.floors.length, 3);
  assert.deepEqual(model.floors.map((f) => f.key), ['BF', 'GF', 'FF']);
  assert.equal(model.floors.reduce((sum, f) => sum + f.edges.length, 0), 74);
  assert.equal(model.openings.length, 57);
  assert.equal(model.balconies.length, 8);
  assert.equal(model.steps.length, 8);
  assert.equal(model.columns.length, 2);
  assert.equal(model.roof.poly.length, 12);
  assert.equal(model.stair.poly.length, 4);
});

test('every wall edge is named and every opening is placed on an edge', () => {
  const edges = model.floors.flatMap((f) => f.edges);
  assert.ok(edges.every((e) => typeof e.name === 'string' && e.name.length > 3));
  assert.ok(edges.every((e) => Array.isArray(e.a) && Array.isArray(e.b)));
  assert.ok(model.openings.every((o) => Number.isInteger(o.edge)));
  assert.ok(model.openings.every((o) => typeof o.sill === 'number'));
  const kinds = new Set(model.openings.map((o) => o.kind));
  assert.deepEqual([...kinds].sort(), ['D', 'W']);
});

test('wall quantities reconcile against the workbook column', () => {
  assert.equal(model.check.length, 3);
  for (const row of model.check) {
    assert.ok(row.wb_net > 0);
    assert.ok(Math.abs(row.net - row.wb_net) < 2, `${row.key} net must reconcile within 2 m²`);
    assert.ok(row.minor < 2, `${row.key} minor discrepancy must stay small`);
  }
});

test('estimate data is a full priced schedule', () => {
  assert.equal(estimate.items.length, 37);
  assert.equal(estimate.stones.length, 8);
  assert.equal(estimate.sections.length, 4);
  assert.ok(Object.keys(estimate.rates).length >= 20);
  assert.ok(ideas.ideas.length >= 4);
  assert.ok(ideas.sources.length >= 1);
});

test('the bundle is three.js r128 with OrbitControls, no asset imports', () => {
  assert.match(html, /const e="128"/);
  assert.match(html, /THREE\.OrbitControls/);
  assert.equal(/data:(image|model)\//.test(html), false, 'no embedded media');
  assert.equal(/\.(glb|gltf|hdr|exr|ktx2)['"]/.test(html), false, 'no external 3D assets');
});
