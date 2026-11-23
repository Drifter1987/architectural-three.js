import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Box3 } from 'three';

import { importReferenceModel } from '../app/src/model/import.js';
import {
  buildVilla,
  stairEdgeOpenings,
  wallHoles
} from '../app/src/scene/villa.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = JSON.parse(
  fs.readFileSync(path.join(root, 'app/src/model/reference-model.json'), 'utf8')
);
const model = importReferenceModel(reference);
const { group, materials, stats } = buildVilla(model);

function near(actual, expected, epsilon = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${expected}, received ${actual}`
  );
}

function named(prefix) {
  const objects = [];
  group.traverse((object) => {
    if (object.name?.startsWith(prefix)) objects.push(object);
  });
  return objects;
}

function worldBox(name) {
  const object = group.getObjectByName(name);
  assert.ok(object, `missing object "${name}"`);
  return new Box3().setFromObject(object);
}

test('cuts every wall opening into its edge, including the reverse-wound wall', () => {
  assert.deepEqual(stats, {
    walls: 78,
    openings: 60,
    slabs: 11,
    balconies: 8
  });

  const basement = model.floors.find((floor) => floor.key === 'BF');
  const holes = wallHoles(basement.edges[0], basement, model.openings);

  assert.equal(holes.length, 2);
  near(holes[0].a, 1.311);
  near(holes[0].b, 3.546);
  near(holes[0].bottom, 0.7);
  near(holes[0].top, 2.2);
  near(holes[1].a, 5.281);
  near(holes[1].b, 6.095);
  near(holes[1].bottom, 1.4);
  near(holes[1].top, 2.2);

  const reversed = basement.edges[23];
  const left = wallHoles(reversed, basement, model.openings);
  assert.equal(left.length, 1);
  near(left[0].a, 1.222);
  near(left[0].b, 3.46);
});

test('keeps a sunken sill below the floor line instead of shifting the frame', () => {
  const opening = model.openings.find((entry) => entry.sill < 0);
  assert.ok(opening, 'the reference model has a sunken sill');

  const floor = model.floors.find((entry) => entry.key === opening.floor);
  const edge = floor.edges[opening.edge];
  const single = { ...edge, openings: [0] };
  const [hole] = wallHoles(single, floor, [opening]);

  assert.ok(hole);
  near(hole.bottom, floor.z0 + 0.003);
  near(hole.top, floor.z0 + opening.sill + opening.h);

  const frame = group.getObjectByName(
    `opening:${model.openings.indexOf(opening)}`
  );
  near(frame.position.y, floor.z0 + opening.sill);
});

test('builds one oriented frame group per opening', () => {
  const frames = named('opening:').filter((object) => object.isGroup);
  assert.equal(frames.length, 57);
  assert.equal(new Set(frames.map((object) => object.name)).size, 57);

  for (const [index, opening] of model.openings.entries()) {
    const frame = group.getObjectByName(`opening:${index}`);
    assert.ok(frame, `missing opening ${index}`);

    const floor = model.floors.find((entry) => entry.key === opening.floor);
    const mid = (opening.s0 + opening.s1) / 2;
    const sill = opening.sill || 0;
    const expected =
      opening.axis === 'x'
        ? [opening.face, floor.z0 + sill, mid]
        : [mid, floor.z0 + sill, opening.face];

    near(frame.position.x, expected[0]);
    near(frame.position.y, expected[1]);
    near(frame.position.z, expected[2]);

    const rotation =
      opening.axis === 'x'
        ? opening.out > 0
          ? Math.PI / 2
          : -Math.PI / 2
        : opening.out > 0
          ? 0
          : Math.PI;
    near(frame.rotation.y, rotation);
  }
});

test('wires the 32-part window component into every opening', () => {
  const frame = group.getObjectByName('opening:0');
  assert.equal(frame.userData.partCount, 32);
  assert.equal(frame.children.length, 32);

  const members = frame.children.filter(
    (child) => child.material === materials.frame
  );
  assert.ok(members.length >= 15, 'outer frame, two sashes and a meeting stile');

  const widest = members.reduce((best, child) =>
    child.geometry.parameters.width > best.geometry.parameters.width
      ? child
      : best
  );
  near(widest.geometry.parameters.width, 2.235);
  near(widest.geometry.parameters.height, 0.06);

  const tallest = members.reduce((best, child) =>
    child.geometry.parameters.height > best.geometry.parameters.height
      ? child
      : best
  );
  near(tallest.geometry.parameters.height, 1.5);

  const panes = frame.children.filter(
    (child) => child.material === materials.glass
  );
  assert.equal(panes.length, 2, 'a sliding window has two sashes');
  for (const pane of panes) {
    near(pane.geometry.parameters.width, 1.0475);
    near(pane.geometry.parameters.height, 1.29);
    assert.ok(pane.position.z < 0, 'glass must sit inside the reveal');
  }

  const reveal = frame.children.find(
    (child) => child.material === materials.trim && child.position.z < 0
  );
  assert.ok(reveal, 'the reveal must sit behind the wall face');

  const surround = frame.children.find(
    (child) => child.material === materials.trim && child.position.z > 0
  );
  assert.ok(surround, 'the stone surround must project from the wall');

  for (const [index, opening] of model.openings.entries()) {
    const built = group.getObjectByName(`opening:${index}`);
    assert.ok(
      built.userData.partCount >= (opening.kind === 'D' ? 15 : 30),
      `opening ${index} is still a shell`
    );
  }
});

test('uses the door glazing and ironmongery for door openings', () => {
  for (const [index, opening] of model.openings.entries()) {
    if (opening.kind !== 'D') continue;
    const frame = group.getObjectByName(`opening:${index}`);
    assert.ok(
      frame.children.some((child) => child.material === materials.doorGlass),
      `door ${index} needs door glazing`
    );
    assert.ok(
      frame.children.some((child) => child.material === materials.iron),
      `door ${index} needs a handle`
    );
    assert.equal(
      frame.children.some((child) => child.material === materials.glass),
      false
    );
  }
});

test('lays floor, roof, balcony and stair slabs where the model puts them', () => {
  const roof = worldBox('slab:roof');
  near(roof.min.y, 9.39);
  near(roof.max.y, 9.71);

  const groundFloor = worldBox('slab:floor:GF');
  near(groundFloor.min.y, 2.8);
  near(groundFloor.max.y, 3.1);

  const firstFloor = worldBox('slab:floor:FF');
  near(firstFloor.min.y, 6.1);
  near(firstFloor.max.y, 6.4);

  assert.equal(group.getObjectByName('slab:floor:BF'), undefined);

  const stairRoof = worldBox('stair:roof');
  near(stairRoof.min.y, 12.51);
  near(stairRoof.max.y, 12.71);

  const balconySlabs = named('balcony:').filter((object) =>
    object.name.endsWith(':slab')
  );
  assert.equal(balconySlabs.length, 7);

  for (const [index, balcony] of model.balconies.entries()) {
    if (!balcony.slab) continue;
    const slab = worldBox(`balcony:${index}:slab`);
    near(slab.min.y, balcony.z - 0.25);
    near(slab.max.y, balcony.z);
  }

  const kitchen = worldBox('balcony:2:slab');
  near(kitchen.min.x, 11.485);
  near(kitchen.max.x, 14.164);
  near(kitchen.min.z, 7.234);
  near(kitchen.max.z, 9.253);
});

test('builds all eight balconies with their parapet runs', () => {
  assert.equal(stats.balconies, 8);

  const parapets = named('balcony:').filter((object) =>
    object.name.includes(':parapet:')
  );
  assert.equal(parapets.length, 19);

  for (const [index, balcony] of model.balconies.entries()) {
    assert.ok(group.getObjectByName(`balcony:${index}:parapet:0`));

    for (const [slot, segment] of balcony.par.entries()) {
      const mesh = group.getObjectByName(`balcony:${index}:parapet:${slot}`);
      assert.ok(mesh, `missing parapet ${index}:${slot}`);

      const [x1, z1, x2, z2] = segment;
      near(
        mesh.geometry.parameters.width,
        Math.hypot(x2 - x1, z2 - z1)
      );
      near(mesh.geometry.parameters.height, 1.05);
      near(mesh.geometry.parameters.depth, 0.15);
      near(mesh.position.y, balcony.z + 0.525);
      near(mesh.rotation.y, Math.atan2(-(z2 - z1), x2 - x1));
    }
  }

  assert.equal(group.getObjectByName('balcony:0:slab'), undefined);
});

test('builds the stair room shell with two windows and its roof door', () => {
  const walls = named('stair:wall:');
  assert.equal(walls.length, 4);
  assert.equal(named('stair:opening:').length, 3);

  const stair = model.stair;
  const edge = (index) => ({
    a: stair.poly[index],
    b: stair.poly[(index + 1) % stair.poly.length]
  });

  assert.equal(stairEdgeOpenings(edge(1), model.stair_openings).length, 1);
  assert.equal(stairEdgeOpenings(edge(3), model.stair_openings).length, 2);

  const west = stairEdgeOpenings(edge(3), model.stair_openings);
  const holes = wallHoles(
    { ...edge(3), openings: west.map((_, index) => index) },
    { z0: stair.z0, h: stair.h },
    west
  );

  assert.equal(holes.length, 2);
  near(holes[0].a, 2.002);
  near(holes[0].b, 2.952);
  near(holes[0].bottom, 10.61);
  near(holes[0].top, 11.81);

  const window = group.getObjectByName('stair:opening:3:0');
  assert.ok(window);
  near(window.position.x, -1.922);
  near(window.position.y, 10.61);
  near(window.position.z, 11.888);
  near(window.rotation.y, -Math.PI / 2);

  const door = group.getObjectByName('stair:opening:1:0');
  assert.ok(door);
  near(door.position.x, 4.078);
  near(door.position.y, 9.71);
  near(door.position.z, 12.513);
  near(door.rotation.y, Math.PI / 2);
  assert.ok(
    door.children.some((child) => child.material === materials.doorGlass)
  );
});
