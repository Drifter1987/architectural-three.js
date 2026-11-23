#!/usr/bin/env node
/**
 * Single-file build gate.
 *
 * `npm run build` must leave exactly one HTML file in dist/ and that file must
 * not reference any external or sibling asset. The gate is intentionally
 * strict: a future chart, font, texture or code-split chunk has to be inlined or
 * the build fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BYTES = 1_200_000;

function listFiles(dir) {
  const files = [];
  const directories = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      files.push({ path: absolute, symlink: true, bytes: 0 });
    } else if (entry.isDirectory()) {
      directories.push(absolute);
      const nested = listFiles(absolute);
      files.push(...nested.files);
      directories.push(...nested.directories);
    } else if (entry.isFile()) {
      files.push({
        path: absolute,
        symlink: false,
        bytes: fs.statSync(absolute).size
      });
    }
  }

  return { files, directories };
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function isInlineUrl(value) {
  return /^data:/i.test(value.trim()) || value.trim().startsWith('#');
}

/**
 * @param {string} [distDir]
 * @returns {{
 *   ok: boolean,
 *   errors: string[],
 *   file: string | null,
 *   bytes: number,
 *   scripts: number,
 *   styles: number
 * }}
 */
export function checkBuild(distDir = path.join(ROOT, 'dist')) {
  const errors = [];
  const result = {
    ok: false,
    errors,
    file: null,
    bytes: 0,
    scripts: 0,
    styles: 0
  };

  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    errors.push(`dist directory does not exist: ${distDir}`);
    return result;
  }

  const { files, directories } = listFiles(distDir);
  if (directories.length > 0) {
    errors.push(
      `dist must contain no subdirectories, found: ${directories
        .map((dir) => path.relative(distDir, dir) || '.')
        .join(', ')}`
    );
  }

  if (files.length !== 1) {
    errors.push(
      `expected exactly one file in dist, found ${files.length}: ${
        files.map((file) => path.relative(distDir, file.path)).join(', ') || '(none)'
      }`
    );
  }

  const symlinks = files.filter((file) => file.symlink);
  if (symlinks.length > 0) {
    errors.push(
      `dist must not contain symlinks: ${symlinks
        .map((file) => path.relative(distDir, file.path))
        .join(', ')}`
    );
  }

  const htmlFiles = files.filter(
    (file) => !file.symlink && path.extname(file.path).toLowerCase() === '.html'
  );
  if (htmlFiles.length !== 1) {
    errors.push(`expected exactly one .html file, found ${htmlFiles.length}`);
    return result;
  }

  result.file = htmlFiles[0].path;
  result.bytes = htmlFiles[0].bytes;

  if (result.bytes > MAX_BYTES) {
    errors.push(
      `single-file output is ${result.bytes} bytes, over the ${MAX_BYTES}-byte budget`
    );
  }

  const html = fs.readFileSync(result.file, 'utf8');

  if (!/^<!doctype html>/i.test(html.trimStart())) {
    errors.push('output must start with <!doctype html>');
  }

  const scriptTags = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(
    (match) => match[0]
  );
  const styleTags = [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(
    (match) => match[0]
  );
  result.scripts = scriptTags.length;
  result.styles = styleTags.length;

  if (scriptTags.length === 0) {
    errors.push('output has no inline <script>');
  }
  if (styleTags.length === 0) {
    errors.push('output has no inline <style>');
  }
  if (!scriptTags.some((tag) => /<script\b[^>]*\btype\s*=\s*["']module["']/i.test(tag))) {
    errors.push('output has no inline module script');
  }

  const scriptSrc = [...html.matchAll(/<script\b[^>]*>/gi)]
    .map((match) => attr(match[0], 'src'))
    .filter(Boolean);
  for (const src of scriptSrc) {
    errors.push(`external script reference: ${src}`);
  }

  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = attr(tag[0], 'href');
    if (href && !isInlineUrl(href)) {
      errors.push(`external <link> reference: ${href}`);
    }
  }

  for (const match of html.matchAll(
    /<([a-z][\w-]*)\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi
  )) {
    const tag = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4];
    if (!isInlineUrl(value)) {
      errors.push(`<${tag}> references an external asset: ${value}`);
    }
  }

  for (const match of html.matchAll(
    /<[a-z][\w-]*\b[^>]*\bposter\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi
  )) {
    const value = (match[1] ?? match[2] ?? match[3]).trim();
    if (!value.startsWith('data:')) {
      errors.push(`external media reference: ${value}`);
    }
  }

  // srcset is deliberately rejected rather than parsed: its comma grammar is
  // ambiguous with data: URLs, and this shell only needs one inlined image.
  if (/\bsrcset\s*=/i.test(html)) {
    errors.push(
      'srcset is not allowed; inline one data: URL in src instead'
    );
  }

  for (const tag of html.matchAll(/<(?:image|use)\b[^>]*>/gi)) {
    const href = attr(tag[0], 'href') || attr(tag[0], 'xlink:href');
    if (href && !isInlineUrl(href)) {
      errors.push(`external SVG asset reference: ${href}`);
    }
  }

  for (const match of html.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const css = match[1] ?? match[2] ?? '';
    for (const url of css.matchAll(
      /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi
    )) {
      const value = (url[1] ?? url[2] ?? url[3] ?? '').trim();
      if (!value.startsWith('data:') && !value.startsWith('#')) {
        errors.push(`inline style references an external asset: ${value}`);
      }
    }
  }

  for (const match of html.matchAll(/<object\b[^>]*>/gi)) {
    const data = attr(match[0], 'data');
    if (data && !isInlineUrl(data)) {
      errors.push(`external <object> data: ${data}`);
    }
  }

  if (/<base\b/i.test(html)) {
    errors.push('<base> is not allowed in a portable single-file document');
  }

  if (/sourceMappingURL=/i.test(html)) {
    errors.push('source map reference is not allowed in the shipped file');
  }

  for (const style of styleTags) {
    if (/@import\b/i.test(style)) {
      errors.push('CSS @import is not allowed; inline the stylesheet');
    }
    for (const match of style.matchAll(
      /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi
    )) {
      const value = (match[1] ?? match[2] ?? match[3] ?? '').trim();
      if (!value.startsWith('data:') && !value.startsWith('#')) {
        errors.push(`CSS url() references an external asset: ${value}`);
      }
    }
  }

  result.ok = errors.length === 0;
  return result;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = checkBuild(target);

  if (!result.ok) {
    console.error('build FAILED');
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
  } else {
    const relative = path.relative(process.cwd(), result.file) || result.file;
    console.log(
      `build OK  ${relative}  ${(result.bytes / 1024).toFixed(1)} KB  ` +
        `${result.scripts} inline script(s), ${result.styles} inline style block(s), 0 external assets`
    );
  }
}
