#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'reference');
const sumsPath = path.join(dir, 'SHA256SUMS');

if (!fs.existsSync(sumsPath)) {
  console.error('reference/SHA256SUMS is missing');
  process.exit(1);
}

const line = fs.readFileSync(sumsPath, 'utf8').trim().split(/\r?\n/)[0];
const [expected, name] = line.split(/\s+/);
const file = path.join(dir, name);

if (!fs.existsSync(file)) {
  console.error(`reference file missing: ${name}`);
  process.exit(1);
}

const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const size = fs.statSync(file).size;

if (actual !== expected) {
  console.error(`REFERENCE MODIFIED\n  expected ${expected}\n  actual   ${actual}`);
  process.exit(1);
}

console.log(`reference OK  ${name}  ${size} bytes  sha256 ${actual}`);
