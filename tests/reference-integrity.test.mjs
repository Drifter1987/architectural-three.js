import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'reference');
const sums = fs.readFileSync(path.join(dir, 'SHA256SUMS'), 'utf8').trim().split(/\r?\n/);
const [expected, name] = sums[0].split(/\s+/);
const file = path.join(dir, name);

test('reference file exists byte-for-byte as published', () => {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.length, 960097, 'reference byte length');
  const actual = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, expected, 'reference sha256');
});

test('reference contains no CRLF line endings', () => {
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(text.includes('\r\n'), false, 'reference must stay LF-only');
  assert.equal(text.split('\n').length, 4065, '4064 lines plus final newline');
});

test('reference is not edited by the published repo HEAD', () => {
  // The only permitted change is the rename into reference/.
  const tracked = path.join(root, 'parti-pris-three.js.html');
  assert.equal(fs.existsSync(tracked), false, 'old path must not remain');
});
