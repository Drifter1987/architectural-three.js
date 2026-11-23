import assert from 'node:assert/strict';
import { buildScene, stats, disposeScene } from './scene.mjs';

const { root, camera } = buildScene();
const s = stats(root);

assert.equal(s.meshes, 3, 'three wall panels');
assert.equal(s.lights, 1, 'one directional light');
assert.equal(s.geometries, 1, 'geometry is shared');
assert.equal(s.materials, 1, 'material is shared');
assert.equal(s.triangles, 36, '3 boxes × 12 triangles');
assert.ok(Math.abs(camera.aspect - 16 / 9) < 1e-9);

const disposed = disposeScene(root);
assert.equal(disposed.geometryDisposals, 1, 'shared geometry disposed once');
assert.equal(disposed.materialDisposals, 1, 'shared material disposed once');

console.log('lab 01 core        OK', JSON.stringify(s), JSON.stringify(disposed));
