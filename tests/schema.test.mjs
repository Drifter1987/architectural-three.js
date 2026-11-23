import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  MODEL_SCHEMA_VERSION,
  validateModel
} from '../app/src/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture() {
  return {
    version: MODEL_SCHEMA_VERSION,
    name: 'Test shell',
    floors: [
      {
        key: 'L0',
        name: 'Shell storey',
        z0: 0,
        h: 3.2,
        edges: [
          {
            a: [0, 0],
            b: [4, 0],
            kind: 'stone',
            name: 'Shell wall',
            openings: [0]
          }
        ]
      }
    ],
    openings: [
      {
        floor: 'L0',
        edge: 0,
        axis: 'y',
        face: 0,
        out: 1,
        s0: 1,
        s1: 2.2,
        sill: 0.9,
        kind: 'W',
        w: 1.2,
        h: 1.5,
        name: 'Shell opening'
      }
    ],
    balconies: [],
    steps: [],
    planters: [],
    columns: [],
    check: []
  };
}

function errorsOf(model, options) {
  return validateModel(model, options).errors.map(
    (error) => `${error.path}: ${error.message}`
  );
}

test('accepts the minimal version 2 shell model', () => {
  const result = validateModel(fixture());
  assert.equal(result.ok, true, errorsOf(fixture()).join('\n'));
  assert.equal(result.version, 2);
  assert.deepEqual(result.summary, { floors: 1, walls: 1, openings: 1 });
});

test('accepts the reference model as a legacy fixture at 74 walls and 57 openings', () => {
  const html = fs.readFileSync(
    path.join(root, 'reference/parti-pris-three.js.html'),
    'utf8'
  );
  const model = JSON.parse(
    html.match(/<script id="model-data"[^>]*>([\s\S]*?)<\/script>/)[1]
  );

  const strict = validateModel(model);
  assert.equal(strict.ok, false);
  assert.deepEqual(
    strict.errors.map((error) => error.path),
    ['$.version'],
    'the only missing piece in the legacy data is the version field'
  );

  const result = validateModel(model, { allowLegacy: true });
  assert.equal(result.ok, true, result.errors.slice(0, 8).map((error) => `${error.path}: ${error.message}`).join('\n'));
  assert.equal(result.version, 1);
  assert.deepEqual(result.summary, { floors: 3, walls: 74, openings: 57 });
});

test('rejects a model without a version unless legacy mode is requested', () => {
  const model = fixture();
  delete model.version;
  assert.deepEqual(errorsOf(model), ['$.version: missing version; expected 2']);
  assert.equal(validateModel(model, { allowLegacy: true }).ok, true);
});

test('rejects duplicate floor keys and unknown opening floors', () => {
  const model = fixture();
  model.floors.push(structuredClone(model.floors[0]));
  let errors = errorsOf(model);
  assert.ok(errors.some((error) => error.includes('duplicate floor key')));

  const unknown = fixture();
  unknown.openings[0].floor = 'NOPE';
  errors = errorsOf(unknown);
  assert.ok(errors.some((error) => error.includes('unknown floor')));
});

test('rejects an opening that is not listed on its edge', () => {
  const model = fixture();
  model.floors[0].edges[0].openings = [];
  const errors = errorsOf(model);
  assert.ok(errors.some((error) => error.includes('not listed on edge')));
});

test('rejects a local edge index that points at the wrong wall', () => {
  const model = fixture();
  model.openings[0].edge = 1;
  const errors = errorsOf(model);
  assert.ok(errors.some((error) => error.includes('outside floor')));
});

test('rejects invalid opening geometry and kind', () => {
  const model = fixture();
  Object.assign(model.openings[0], {
    axis: 'z',
    out: 0,
    s1: 0,
    kind: 'X',
    w: 0
  });
  const errors = errorsOf(model);
  assert.ok(errors.some((error) => error.includes('"x" or "y"')));
  assert.ok(errors.some((error) => error.includes('-1 or 1')));
  assert.ok(errors.some((error) => error.includes('greater than s0')));
  assert.ok(errors.some((error) => error.includes('"W" (window) or "D" (door)')));
  assert.ok(errors.some((error) => error.includes('greater than 0')));
});

test('does not throw on null or malformed models', () => {
  for (const model of [null, 42, [], 'model']) {
    const result = validateModel(model);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  }
});
