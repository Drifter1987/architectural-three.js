import assert from 'node:assert/strict';
import { buildWindow, partCounts } from './window.mjs';

const full = buildWindow({ width: 1.2, height: 1.5, surround: 'flat', glazing: 'slide', head: 'cornice', grille: true, shutters: true });
const counts = partCounts(full.parts);

assert.ok(full.parts.length >= 30, `expected ≥30 parts, got ${full.parts.length}`);
assert.equal(full.materials.length, 3, 'frame, stone and glass only');
assert.ok(counts.glass === 1 && counts.frame === 4 && counts.reveal === 4, 'core assemblies');
assert.ok(counts.grille >= 10, 'grille bars present');
assert.ok(counts.shutter === 2, 'two shutters');

const plain = buildWindow({ width: 1.2, height: 1.5, surround: 'flat', head: 'none' });
assert.ok(full.bbox.max.x > plain.bbox.max.x, 'shutters widen the assembly');
assert.ok(full.bbox.max.y > plain.bbox.max.y, 'cornice head raises the assembly');

const profiles = ['flat', 'stepped', 'eared', 'blocks', 'thin'];
const sizes = new Set();
for (const surround of profiles) {
  const w = buildWindow({ width: 1.2, height: 1.5, surround, head: 'none' });
  const n = w.parts.length;
  assert.ok(!sizes.has(n), `surround ${surround} must have a distinct part count`);
  sizes.add(n);
}

const clear = buildWindow({ width: 1.2, height: 1.5, glazing: 'clear', head: 'none' });
const grid = buildWindow({ width: 1.2, height: 1.5, glazing: 'grid', head: 'none' });
assert.ok(grid.parts.length > clear.parts.length, 'grid glazing adds bars');

console.log('lab 03 window      OK',
  JSON.stringify({ full: full.parts.length, counts, surrounds: [...sizes], grid: grid.parts.length, clear: clear.parts.length }));
