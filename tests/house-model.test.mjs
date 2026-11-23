import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXAMPLE_HOUSE } from '../app/src/model/example-house.js';
import { createHouseModel } from '../app/src/model/house.js';
import {
  HOUSE_SAMPLES,
  SAMPLE_HOUSES_BY_KEY
} from '../app/src/model/houses/index.js';
import { STARTER_HOUSE } from '../app/src/model/starter-house.js';
import { validateModel } from '../app/src/schema.js';
import { buildVilla, wallHoles } from '../app/src/scene/villa.js';
import {
  normalizedToRawEdge,
  rawToNormalizedEdge
} from '../app/src/ui/house-editor.js';

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

test('maps editor edge order through the model ring normalization', () => {
  const shifted = [
    [0, 0],
    [14, 0],
    [14, 9],
    [8, 9],
    [8, 5],
    [-1, 5]
  ];
  assert.equal(rawToNormalizedEdge(shifted, 0), 1);
  assert.equal(normalizedToRawEdge(shifted, 1), 0);
  for (let index = 0; index < shifted.length; index += 1) {
    assert.equal(
      normalizedToRawEdge(shifted, rawToNormalizedEdge(shifted, index)),
      index
    );
  }

  const clockwise = [
    [0, 0],
    [0, 9],
    [12, 9],
    [12, 0]
  ];
  assert.equal(rawToNormalizedEdge(clockwise, 0), 3);
  assert.equal(rawToNormalizedEdge(clockwise, 1), 2);
  assert.equal(normalizedToRawEdge(clockwise, 0), 3);
  assert.equal(normalizedToRawEdge(clockwise, 2), 1);
  for (let index = 0; index < clockwise.length; index += 1) {
    assert.equal(
      normalizedToRawEdge(clockwise, rawToNormalizedEdge(clockwise, index)),
      index
    );
  }
});

test('keeps the editor starter spec valid and buildable', () => {
  const model = createHouseModel(STARTER_HOUSE);

  assert.equal(validateModel(model).ok, true);
  assert.equal(model.floors.length, 2);
  assert.equal(model.floors[0].edges.length, 6);
  assert.equal(model.openings.length, 6);

  const built = buildVilla(model);
  assert.equal(built.stats.walls, 12);
  assert.equal(built.stats.openings, 6);
  assert.equal(built.stats.slabs, 3);
});

test('builds all five documented house samples without overlap', () => {
  assert.equal(HOUSE_SAMPLES.length, 5);
  assert.equal(SAMPLE_HOUSES_BY_KEY.size, 5);

  for (const sample of HOUSE_SAMPLES) {
    assert.ok(sample.key, 'sample key is required');
    assert.ok(sample.label, `${sample.key} needs a picker label`);
    assert.ok(sample.spec?.name, `${sample.key} needs a spec name`);
    assert.equal(SAMPLE_HOUSES_BY_KEY.get(sample.key), sample);

    const model = createHouseModel(sample.spec);
    assert.equal(validateModel(model).ok, true);
    assert.equal(
      model.floors.length * model.floors[0].edges.length,
      buildVilla(model).stats.walls
    );

    const floors = new Map(model.floors.map((floor) => [floor.key, floor]));
    const walls = new Map();
    for (const opening of model.openings) {
      const floor = floors.get(opening.floor);
      assert.ok(floor, `${opening.name} has a storey`);
      assert.ok(
        opening.sill + opening.h <= floor.h + 1e-6,
        `${opening.name} rises above ${opening.floor}`
      );
      const key = `${opening.floor}:${opening.edge}`;
      if (!walls.has(key)) walls.set(key, []);
      walls.get(key).push([opening.s0, opening.s1]);
    }

    for (const intervals of walls.values()) {
      intervals.sort((a, b) => a[0] - b[0]);
      for (let index = 1; index < intervals.length; index += 1) {
        assert.ok(
          intervals[index][0] >= intervals[index - 1][1] - 1e-6,
          `${sample.key} has overlapping openings`
        );
      }
    }

    const built = buildVilla(model);
    assert.equal(built.stats.openings, model.openings.length);
    assert.ok(built.stats.slabs >= model.floors.length);
  }

  assert.ok(HOUSE_SAMPLES.some(({ spec }) => spec.storeys.length >= 3));
  assert.ok(HOUSE_SAMPLES.some(({ spec }) => (spec.balconies ?? []).length > 0));
});

test('loads the worked Mediterranean courtyard villa', () => {
  const model = createHouseModel(EXAMPLE_HOUSE);

  assert.equal(validateModel(model).ok, true);
  assert.equal(model.floors.length, 2);
  assert.equal(model.floors[0].edges.length, 6);
  assert.equal(model.openings.length, 20);

  const built = buildVilla(model);
  assert.equal(built.stats.walls, 12);
  assert.equal(built.stats.openings, 20);
  assert.equal(built.stats.slabs, 3);

  const courtyardDoor = model.openings[10];
  assert.equal(courtyardDoor.kind, 'D');
  assert.equal(courtyardDoor.edge, 2);
  assert.equal(courtyardDoor.out, 1);
  assert.ok(built.group.getObjectByName('opening:10'));
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
