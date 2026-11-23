#!/usr/bin/env node
/**
 * M1 acceptance check: the frozen reference model imports into the canonical
 * v2 wall graph, validates, and survives serialization without changing shape.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ModelImportError,
  importReferenceModel,
  roundTripModel
} from '../app/src/model/import.js';
import { validateModel } from '../app/src/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(
  path.join(root, 'reference/parti-pris-three.js.html'),
  'utf8'
);

const match = html.match(/<script id="model-data"[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.error('model FAILED: reference model-data block not found');
  process.exitCode = 1;
} else {
  try {
    const legacy = JSON.parse(match[1]);
    const canonical = importReferenceModel(legacy);
    const validation = validateModel(canonical);
    const roundTripped = roundTripModel(legacy);

    if (!validation.ok) {
      console.error('model FAILED');
      for (const error of validation.errors) {
        console.error(`  - ${error.path}: ${error.message}`);
      }
      process.exitCode = 1;
    } else if (JSON.stringify(roundTripped) !== JSON.stringify(canonical)) {
      console.error('model FAILED: round-trip changed the canonical model');
      process.exitCode = 1;
    } else {
      console.log(
        `model OK  ${validation.summary.floors} floors, ` +
          `${validation.summary.walls} walls, ${validation.summary.openings} openings, ` +
          'v2 round-trip stable'
      );
    }
  } catch (error) {
    console.error('model FAILED');
    if (error instanceof ModelImportError && error.validation) {
      for (const entry of error.validation.errors) {
        console.error(`  - ${entry.path}: ${entry.message}`);
      }
    } else {
      console.error(`  - ${error.message || error}`);
    }
    process.exitCode = 1;
  }
}
