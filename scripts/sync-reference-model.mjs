#!/usr/bin/env node
/**
 * Generate the canonical v2 model fixture used by the app.
 *
 * The frozen reference HTML remains read-only; this script extracts its
 * `model-data` island, imports it through the M1 normalizer, and writes the
 * canonical JSON that the app bundles. Run this only when intentionally
 * updating the fixture.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { importReferenceModel } from '../app/src/model/import.js';
import { validateModel } from '../app/src/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = path.join(root, 'reference/parti-pris-three.js.html');
const output = path.join(root, 'app/src/model/reference-model.json');

const html = fs.readFileSync(reference, 'utf8');
const match = html.match(/<script id="model-data"[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.error('reference model-data island not found');
  process.exitCode = 1;
} else {
  const legacy = JSON.parse(match[1]);
  const canonical = importReferenceModel(legacy);
  const validation = validateModel(canonical);
  if (!validation.ok) {
    console.error('canonical reference model is invalid');
    for (const error of validation.errors) {
      console.error(`  - ${error.path}: ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    fs.writeFileSync(output, `${JSON.stringify(canonical, null, 2)}\n`);
    const bytes = fs.statSync(output).size;
    console.log(
      `wrote ${path.relative(root, output)}  ${validation.summary.floors} floors, ` +
        `${validation.summary.walls} walls, ${validation.summary.openings} openings, ${bytes} bytes`
    );
  }
}
