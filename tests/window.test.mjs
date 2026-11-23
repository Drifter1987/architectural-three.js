import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Box3 } from 'three';

import {
  GLAZING,
  SURROUNDS,
  buildWindow,
  createWindowMaterials
} from '../app/src/components/window.js';

function near(actual, expected, epsilon = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${expected}, received ${actual}`
  );
}

function partNames(built) {
  return built.parts.map((part) => part.userData.part);
}

test('the default window is a 32-part assembly with three shared materials', () => {
  const built = buildWindow();

  assert.equal(built.info.partCount, 32);
  assert.equal(built.parts.length, 32);
  assert.ok(built.parts.length >= 30);
  assert.equal(built.info.usedMaterials, 3);

  const used = new Set(built.parts.map((part) => part.material));
  assert.deepEqual(
    [...used],
    [built.materials.stone, built.materials.frame, built.materials.glass]
  );

  const bounds = new Box3().setFromObject(built.group);
  assert.ok(bounds.min.x <= -0.8);
  assert.ok(bounds.max.x >= 0.8);
  assert.ok(bounds.max.y > 1.5 + 0.2);
  assert.ok(bounds.max.z - bounds.min.z > 0.2);
});

test('recesses the glass and frame behind a full-depth stone reveal', () => {
  const built = buildWindow();
  const pane = built.parts.find((part) => part.name === 'glass-left');
  const reveal = built.parts.find((part) => part.name === 'reveal-left');
  const surround = built.parts.find((part) => part.name === 'surround-jamb');

  assert.ok(pane);
  assert.ok(reveal);
  assert.ok(surround);
  assert.ok(pane.position.z < 0, 'glass must sit behind the wall face');
  assert.ok(reveal.position.z < 0, 'reveal must run into the wall');
  assert.ok(surround.position.z > 0, 'surround must project from the wall');
  near(reveal.geometry.parameters.depth, 0.2);
});

test('builds five distinct stone surrounds', () => {
  const counts = new Set();

  for (const surround of SURROUNDS) {
    const built = buildWindow({ surround });
    assert.equal(built.info.surround, surround);
    counts.add(built.parts.length);

    const names = partNames(built);
    assert.ok(names.some((name) => name.startsWith('surround-')));
    if (surround === 'stepped') assert.ok(names.includes('surround-step'));
    if (surround === 'eared') assert.ok(names.includes('surround-ear'));
    if (surround === 'blocks') assert.ok(names.includes('surround-block'));
    if (surround === 'thin') {
      assert.equal(names.includes('surround-jamb'), false);
    }
  }

  assert.equal(counts.size, 5, 'each surround must change the part count');
});

test('builds four distinct glazing patterns', () => {
  const counts = new Set();

  for (const glazing of GLAZING) {
    const built = buildWindow({ glazing });
    assert.equal(built.info.glazing, glazing);
    counts.add(built.parts.length);

    const names = partNames(built);
    if (glazing === 'slide') {
      assert.equal(names.filter((name) => name === 'glass-left').length, 1);
      assert.equal(names.filter((name) => name === 'glass-right').length, 1);
      assert.ok(names.includes('meeting-stile'));
    }
    if (glazing === 'french') {
      assert.equal(names.filter((name) => name === 'glazing-bar-v').length, 2);
      assert.ok(names.includes('glazing-bar-h'));
      assert.ok(names.includes('transom'));
    }
    if (glazing === 'grid') {
      assert.ok(names.filter((name) => name === 'muntin-v').length >= 3);
      assert.ok(names.filter((name) => name === 'muntin-h').length >= 3);
      assert.ok(names.includes('transom'));
    }
    if (glazing === 'clear') {
      assert.equal(names.includes('muntin-v'), false);
      assert.equal(names.includes('meeting-stile'), false);
      assert.equal(names.filter((name) => name === 'clear-stile-left').length, 1);
    }
  }

  assert.equal(counts.size, 4, 'each glazing pattern must change the part count');
});

test('adds shutters, grilles, heads and corbelled sills on request', () => {
  const built = buildWindow({
    shutters: 'wood',
    grille: 'deco',
    head: 'lintel',
    sill: 'corbel'
  });
  const names = partNames(built);

  assert.equal(names.filter((name) => name === 'shutter-panel').length, 2);
  assert.equal(names.filter((name) => name === 'shutter-slat').length, 8);
  assert.ok(names.filter((name) => name === 'grille-bar').length > 0);
  assert.ok(names.filter((name) => name === 'grille-ring').length > 0);
  assert.ok(names.includes('head-lintel'));
  assert.equal(names.includes('head-band'), false);
  assert.equal(names.filter((name) => name === 'sill-corbel').length, 2);
  assert.ok(built.parts.some((part) => part.material === built.materials.shutterWood));
});

test('builds a door with a threshold and ironmongery, not a sill or shutters', () => {
  const built = buildWindow({
    kind: 'door',
    width: 1.1,
    height: 2.2,
    glazing: 'clear',
    head: 'none',
    sill: 'none',
    shutters: 'green'
  });
  const names = partNames(built);

  assert.ok(names.includes('threshold'));
  assert.ok(names.includes('door-handle'));
  assert.ok(names.includes('door-lock'));
  assert.equal(names.includes('sill'), false);
  assert.equal(names.includes('shutter-panel'), false);
  assert.ok(built.parts.some((part) => part.material === built.materials.glass));
  assert.ok(built.parts.some((part) => part.material === built.materials.iron));
});

test('reuses injected materials and rejects unknown variants', () => {
  const materials = createWindowMaterials();
  const built = buildWindow({ materials, width: 2.0, height: 1.4 });

  assert.equal(built.materials, materials);
  assert.ok(built.parts.every((part) => Object.values(materials).includes(part.material)));

  assert.throws(() => buildWindow({ surround: 'bogus' }), /surround/);
  assert.throws(() => buildWindow({ glazing: 'bogus' }), /glazing/);
  assert.throws(() => buildWindow({ width: 0 }), /width/);
});
