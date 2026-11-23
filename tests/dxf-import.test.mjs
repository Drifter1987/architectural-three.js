import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateModel } from '../app/src/schema.js';
import { attachOpenings, importDxfWalls } from '../app/src/model/dxf.js';

const FLOORS = [
  { key: 'GF', name: 'Ground floor', z0: 0, h: 3.2 },
  { key: 'FF', name: 'First floor', z0: 3.2, h: 3.1 }
];

const DXF = `0
SECTION
2
HEADER
9
$INSUNITS
70
6
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
GF-WALLS
10
0
20
0
11
6
21
0
0
LWPOLYLINE
8
FF-WALLS
90
4
70
1
10
0
20
0
10
4
20
0
10
4
20
3
10
0
20
3
0
TEXT
8
NOTES
10
1
20
1
40
0.2
1
ignore me
0
ENDSEC
0
EOF
`;

test('imports LINE and closed LWPOLYLINE walls into named floor edges', () => {
  const model = importDxfWalls(DXF, { floors: FLOORS });
  const validation = validateModel(model);

  assert.equal(validation.ok, true, validation.errors.map((e) => `${e.path}: ${e.message}`).join('\n'));
  assert.deepEqual(validation.summary, { floors: 2, walls: 5, openings: 0 });
  assert.deepEqual(model.floors.map((floor) => floor.key), ['GF', 'FF']);

  const ground = model.floors.find((floor) => floor.key === 'GF');
  assert.equal(ground.edges.length, 1);
  assert.equal(ground.edges[0].name, 'GF-WALLS');
  assert.deepEqual(ground.edges[0].a, [0, 0]);
  assert.deepEqual(ground.edges[0].b, [6, 0]);
  assert.equal(ground.edges[0].len, 6);

  const first = model.floors.find((floor) => floor.key === 'FF');
  assert.equal(first.edges.length, 4, 'closed polyline must yield four wall segments');
  assert.ok(first.edges.every((edge) => edge.name === 'FF-WALLS'));
  assert.ok(first.edges.some((edge) => edge.a[1] === 3 && edge.b[1] === 3));
});

test('attaches openings explicitly and keeps the base model untouched', () => {
  const base = importDxfWalls(DXF, { floors: FLOORS });
  const withOpening = attachOpenings(base, [
    {
      floor: 'GF',
      edge: 0,
      s0: 1,
      s1: 2.5,
      sill: 0.9,
      h: 1.5,
      kind: 'W',
      name: 'Ground window'
    }
  ]);

  assert.equal(base.openings.length, 0, 'base model must not be mutated');
  assert.equal(withOpening.openings.length, 1);
  assert.equal(validateModel(withOpening).ok, true);

  const opening = withOpening.openings[0];
  assert.equal(opening.w, 1.5);
  assert.equal(opening.axis, 'y');
  assert.equal(opening.kind, 'W');
  assert.equal(withOpening.floors[0].edges[0].openings[0], 0);
});

test('rejects openings outside the edge or on a missing edge', () => {
  const base = importDxfWalls(DXF, { floors: FLOORS });
  assert.throws(
    () =>
      attachOpenings(base, [
        { floor: 'GF', edge: 0, s0: 1, s1: 99, h: 1.5 }
      ]),
    /ends at 99 m/
  );
  assert.throws(
    () =>
      attachOpenings(base, [
        { floor: 'GF', edge: 4, s0: 1, s1: 2, h: 1.5 }
      ]),
    /missing edge/
  );
});

test('rejects curved polylines instead of flattening them silently', () => {
  const curved = DXF.replace('70\n1\n10', '70\n1\n42\n0.5\n10');
  assert.throws(
    () => importDxfWalls(curved, { floors: FLOORS }),
    /bulge/
  );
});

test('rejects files without supported walls and layers without floor metadata', () => {
  assert.throws(
    () => importDxfWalls('0\nSECTION\n2\nENTITIES\n0\nTEXT\n8\nNOTES\n0\nENDSEC\n0\nEOF\n'),
    /no supported wall entities/
  );

  const unknown = DXF.replaceAll('GF-WALLS', 'ZZ-WALLS');
  assert.throws(
    () => importDxfWalls(unknown, { floors: FLOORS, defaultFloor: 'ZZ' }),
    /no floor metadata/
  );
});

test('applies an explicit unit scale to CAD coordinates', () => {
  const model = importDxfWalls(DXF, { floors: FLOORS, unitScale: 0.001 });
  assert.equal(model.floors[0].edges[0].len, 0.006);
});
