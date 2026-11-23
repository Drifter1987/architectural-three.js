import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createHouseModel } from '../app/src/model/house.js';
import { validateModel } from '../app/src/schema.js';
import { buildVilla, wallHoles } from '../app/src/scene/villa.js';

function near(actual, expected, epsilon = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${expected}, received ${actual}`
  );
}

const RECTANGLE = [
  [0, 0],
  [12, 0],
  [12, 9],
  [0, 9]
];

function house(overrides = {}) {
  return createHouseModel({
    name: 'Test house',
    outline: RECTANGLE,
    storeys: [
      { key: 'GF', name: 'Ground floor', height: 3.2 },
      { key: 'FF', name: 'First floor', height: 3.0 }
    ],
    openings: [
      {
        floor: 'GF',
        edge: 0,
        offset: 2,
        width: 1.6,
        height: 1.5,
        sill: 0.9,
        kind: 'W',
        name: 'Front window'
      },
      {
        floor: 'GF',
        edge: 0,
        offset: 8,
        width: 1.2,
        height: 2.3,
        sill: 0,
        kind: 'D',
        name: 'Front door'
      }
    ],
    topography: { plateau: 0.4, levels: [0.4, 2.0] },
    ...overrides
  });
}

test('turns an outline and storey dimensions into a valid v2 house', () => {
  const model = house();

  assert.equal(validateModel(model).ok, true);
  assert.equal(model.floors.length, 2);
  assert.equal(model.floors[0].edges.length, 4);
  assert.equal(model.floors[0].z0, 0);
  near(model.floors[1].z0, 3.2);
  near(model.roof.z0, 6.2);
  near(model.roof.z1, 6.52);
  assert.equal(model.roof.poly.length, 4);
  assert.deepEqual(model.site.topography, { plateau: 0.4, levels: [0.4, 2.0] });
});

test('places openings by edge, offset and size with the correct outward face', () => {
  const model = house();
  const [window, door] = model.openings;

  assert.equal(window.axis, 'y');
  assert.equal(window.face, 0);
  assert.equal(window.out, -1);
  near(window.s0, 2);
  near(window.s1, 3.6);
  near(window.w, 1.6);
  near(window.h, 1.5);
  assert.equal(door.kind, 'D');
  near(door.s0, 8);
  near(door.s1, 9.2);
  assert.deepEqual(model.floors[0].edges[0].openings, [0, 1]);

  const holes = wallHoles(model.floors[0].edges[0], model.floors[0], model.openings);
  assert.equal(holes.length, 2);
  near(holes[0].a, 2);
  near(holes[0].b, 3.6);
  near(holes[0].bottom, 0.9);
  near(holes[0].top, 2.4);
  near(holes[1].a, 8);
  near(holes[1].b, 9.2);
  near(holes[1].top, 2.3);
});

test('renders the generated house with the same builder as the reference villa', () => {
  const built = buildVilla(house());

  assert.equal(built.stats.walls, 8);
  assert.equal(built.stats.openings, 2);
  assert.equal(built.stats.slabs, 3);

  const window = built.group.getObjectByName('opening:0');
  assert.ok(window);
  assert.ok(window.userData.partCount >= 30);
  near(window.position.x, 2.8);
  near(window.position.y, 0.9);
  near(window.position.z, 0);
  near(window.rotation.y, Math.PI);

  const door = built.group.getObjectByName('opening:1');
  assert.ok(door);
  assert.ok(door.children.some((child) => child.material === built.materials.iron));
  near(door.position.x, 8.6);
  near(door.position.y, 0);
});

test('normalizes clockwise outlines to the same counter-clockwise ring', () => {
  const cw = createHouseModel({
    outline: [
      [0, 0],
      [0, 9],
      [12, 9],
      [12, 0]
    ],
    storeys: [{ key: 'GF', height: 3 }],
    openings: []
  });

  assert.deepEqual(cw.floors[0].edges[0].a, [0, 0]);
  assert.deepEqual(cw.floors[0].edges[0].b, [12, 0]);
  assert.equal(validateModel(cw).ok, true);
});

test('builds any orthogonal outline, including an L-shaped plan', () => {
  const model = createHouseModel({
    outline: [
      [0, 0],
      [10, 0],
      [10, 4],
      [4, 4],
      [4, 8],
      [0, 8]
    ],
    storeys: [{ key: 'GF', height: 3.0 }],
    openings: []
  });

  assert.equal(model.floors[0].edges.length, 6);
  assert.equal(buildVilla(model).stats.walls, 6);
});

test('rejects openings that do not fit or sit on a diagonal wall', () => {
  assert.throws(
    () =>
      createHouseModel({
        outline: [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4]
        ],
        storeys: [{ key: 'GF', height: 3 }],
        openings: [
          {
            floor: 'GF',
            edge: 0,
            offset: 3.5,
            width: 1,
            height: 1,
            kind: 'W'
          }
        ]
      }),
    /runs outside/
  );

  assert.throws(
    () =>
      createHouseModel({
        outline: [
          [0, 0],
          [4, 0],
          [4, 4]
        ],
        storeys: [{ key: 'GF', height: 3 }],
        openings: [
          {
            floor: 'GF',
            edge: 2,
            offset: 0.2,
            width: 1,
            height: 1,
            kind: 'W'
          }
        ]
      }),
    /axis-aligned/
  );
});
