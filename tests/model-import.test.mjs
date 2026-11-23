import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateModel } from '../app/src/schema.js';
import {
  ModelImportError,
  exportCanonicalModel,
  importReferenceModel,
  parseCanonicalModel,
  roundTripModel
} from '../app/src/model/import.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(
  path.join(root, 'reference/parti-pris-three.js.html'),
  'utf8'
);
const reference = JSON.parse(
  html.match(/<script id="model-data"[^>]*>([\s\S]*?)<\/script>/)[1]
);

function clone(value) {
  return structuredClone(value);
}

test('imports the reference model into a valid v2 model without mutating it', () => {
  const before = JSON.stringify(reference);
  const canonical = importReferenceModel(reference);

  assert.equal(JSON.stringify(reference), before, 'source must not be mutated');
  assert.equal(canonical.version, 2);
  assert.equal(canonical.units, 'm');
  assert.match(canonical.name, /reference/i);
  assert.equal(validateModel(canonical).ok, true);
  assert.deepEqual(validateModel(canonical).summary, {
    floors: 3,
    walls: 74,
    openings: 57
  });
});

test('round-trips 74 walls and 57 openings with stable opening placement', () => {
  const canonical = importReferenceModel(reference);
  const roundTripped = roundTripModel(reference);

  assert.deepEqual(roundTripped, canonical);
  assert.equal(roundTripped.floors.reduce((sum, floor) => sum + floor.edges.length, 0), 74);
  assert.equal(roundTripped.openings.length, 57);

  const sample = canonical.openings[0];
  const edge = canonical.floors.find((floor) => floor.key === sample.floor).edges[sample.edge];
  assert.ok(edge.openings.includes(0));
  assert.equal(roundTripped.openings[0].floor, sample.floor);
  assert.equal(roundTripped.openings[0].edge, sample.edge);
  assert.equal(roundTripped.openings[0].s0, sample.s0);
  assert.equal(roundTripped.openings[0].s1, sample.s1);
});

test('rejects an invalid reference model with diagnostic validation errors', () => {
  const broken = clone(reference);
  broken.floors[0].edges[0].name = '';

  assert.throws(
    () => importReferenceModel(broken),
    (error) => {
      assert.ok(error instanceof ModelImportError);
      assert.ok(error.validation);
      assert.ok(
        error.validation.errors.some((entry) =>
          entry.path.endsWith('.edges[0].name')
        )
      );
      return true;
    }
  );
});

test('rejects malformed JSON and invalid canonical models', () => {
  assert.throws(
    () => parseCanonicalModel('{not json'),
    (error) => error instanceof ModelImportError && error.validation.errors[0].path === '$'
  );

  const canonical = importReferenceModel(reference);
  canonical.openings[0].floor = 'MISSING';
  assert.throws(
    () => exportCanonicalModel(canonical),
    (error) =>
      error instanceof ModelImportError &&
      error.validation.errors.some((entry) => entry.message.includes('unknown floor'))
  );
});

test('is idempotent when importing an already canonical model', () => {
  const canonical = importReferenceModel(reference);
  const again = importReferenceModel(canonical);
  assert.deepEqual(again, canonical);
});
