import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { checkBuild } from '../scripts/check-build.mjs';

const VALID_HTML = `<!doctype html>
<html>
<head>
  <style>:root { color-scheme: dark; }</style>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
</head>
<body>
  <main>shell</main>
  <script type="module">document.documentElement.dataset.ready = 'true';</script>
</body>
</html>`;

function makeDist(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-build-'));
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  return dir;
}

function withDist(files, assertion) {
  const dir = makeDist(files);
  try {
    assertion(checkBuild(dir), dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('passes exactly one HTML file with inline CSS, inline JS and a data icon', () => {
  withDist({ 'index.html': VALID_HTML }, (result) => {
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.scripts, 1);
    assert.equal(result.styles, 1);
    assert.ok(result.bytes > 0);
  });
});

test('rejects a second emitted file', () => {
  withDist(
    { 'index.html': VALID_HTML, 'assets/app.js': 'console.log(1);' },
    (result) => {
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((error) => error.includes('exactly one file')));
      assert.ok(result.errors.some((error) => error.includes('subdirectories')));
    }
  );
});

test('rejects an external script source', () => {
  const html = VALID_HTML.replace(
    '<script type="module">',
    '<script type="module" src="https://cdn.example/app.js">'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('external script')));
  });
});

test('rejects an external stylesheet link', () => {
  const html = VALID_HTML.replace(
    '</head>',
    '<link rel="stylesheet" href="styles.css"></head>'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('external <link>')));
  });
});

test('rejects a CSS url() asset', () => {
  const html = VALID_HTML.replace(
    'color-scheme: dark;',
    'color-scheme: dark; background: url("stone.png");'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('CSS url()')));
  });
});

test('rejects an image element with a relative source', () => {
  const html = VALID_HTML.replace(
    '<main>shell</main>',
    '<main>shell</main><img src="hero.png" alt="">'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('<img>')));
  });
});

test('rejects an inline style attribute with a CSS asset', () => {
  const html = VALID_HTML.replace(
    '<main>shell</main>',
    '<main style="background: url(stone.png)">shell</main>'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('inline style')));
  });
});

test('rejects an SVG use reference to a sibling sprite', () => {
  const html = VALID_HTML.replace(
    '<main>shell</main>',
    '<main>shell</main><svg><use href="sprite.svg#icon"></use></svg>'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('SVG asset')));
  });
});

test('rejects a data-URI srcset outright instead of splitting at its comma', () => {
  const html = VALID_HTML.replace(
    '<main>shell</main>',
    '<main>shell</main><img srcset="data:image/png;base64,AA 1x" alt="">'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('srcset is not allowed')));
    assert.equal(
      result.errors.some((error) => error.includes('srcset candidate')),
      false,
      'the old comma-splitting diagnostic must be gone'
    );
  });
});

test('accepts a single data: image source', () => {
  const html = VALID_HTML.replace(
    '<main>shell</main>',
    '<main>shell</main><img src="data:image/png;base64,AA" alt="">'
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, true, result.errors.join('\n'));
  });
});

test('rejects output without an inline module script', () => {
  const html = VALID_HTML.replace(
    '<script type="module">document.documentElement.dataset.ready = \'true\';</script>',
    ''
  );
  withDist({ 'index.html': html }, (result) => {
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.includes('no inline <script>')));
    assert.ok(result.errors.some((error) => error.includes('no inline module script')));
  });
});
