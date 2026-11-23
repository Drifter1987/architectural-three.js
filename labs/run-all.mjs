#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const labDirs = fs.readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d\d-/.test(d.name))
  .map((d) => d.name)
  .sort();

let ran = 0;
for (const dir of labDirs) {
  const file = path.join(here, dir, 'check.mjs');
  if (!fs.existsSync(file)) continue;
  await import(new URL(`./${dir}/check.mjs`, import.meta.url).href);
  ran++;
}

assert.ok(ran > 0, 'no lab checks found');
console.log(`\n${ran} lab check(s) passed`);
