# ADR 0001 — Ship a single HTML file

- Status: accepted
- Date: 2026-11-23

## Context

The reference is one 960 KB HTML file containing the UI, the architectural data,
the app code and Three.js. It runs from a static server, has no runtime package
manager, no CORS setup, no asset pipeline and no build step. That portability is
a product feature: the file can be emailed, archived or opened years later.

A modern authoring setup would normally use ES modules, npm packages and a dev
server. Those are fine for development but must not change what ships.

## Decision

1. The **shipped artefact is a single `.html` file** containing HTML, CSS,
   JavaScript, Three.js and the model data.
2. Authoring may use modules and npm **only if** the build emits that single
   file. The chosen tool is Vite + `vite-plugin-singlefile`, pinned, with the
   output committed under `dist/` only when a release is cut.
3. **No runtime network and no CDN.** Three.js is bundled. The shipped file
   must not fetch any script, stylesheet, font, image or API at runtime. Web
   fonts are limited to system fonts or inlined data URLs; Google Fonts is not
   permitted.
4. The reference file remains a separate, frozen artefact. It is never the build
   input and never edited.
5. Build output must stay under **1.2 MB** and load with zero 404s.
   `scripts/check-build.mjs` enforces this after every `npm run build`: it fails
   on a second file, a subdirectory, an external `src`/`href`, a `srcset`, a
   CSS `url()`, an `@import`, a source map, or output over the size budget.

## Consequences

- Tree-shaking matters: import only the Three.js modules actually used.
- Large data islands are embedded as `<script type="application/json">` and
  parsed at boot, exactly like the reference.
- Workers, WASM and external textures are allowed only when inlined as data
  URLs or bundled assets, and only if the size budget still holds.
- The earlier optional Google Fonts exception is removed. The rebuild must be
  fully usable offline with system fonts or inlined font data.
- Source maps are not shipped inside the HTML.

## Alternatives rejected

- **CDN import maps**: breaks offline portability and pins a remote version.
- **Multi-file static site**: simpler to author, but loses the single-file
  property that makes the reference durable.
- **Bundling the reference itself**: it is study material, not a dependency.
