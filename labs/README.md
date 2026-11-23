# Labs

Small, runnable proofs for the three.js mastery track. Each lab is a piece of
the future app, isolated and asserted — not a tutorial and not app code.

## Run

```bash
npm install   # once: installs three as a devDependency
npm run labs
```

Each `labs/NN-name/check.mjs` prints one `OK` line with its measurements and
throws on failure. `labs/run-all.mjs` discovers and runs every numbered folder
in order, so adding `labs/04-stone/check.mjs` is enough to include it.

## Current labs

| Lab | What it proves |
| --- | --- |
| `01-core` | scene graph with shared geometry/material; one disposal per resource; 36 triangles for 3 walls |
| `02-wall-holes` | a wall is one surface with real `Shape` holes; no triangle spans an opening; UVs follow metres |
| `03-window` | a window is 30+ placed solids with shared materials; five surround profiles; shutters widen the box |

## Rules

- No WebGL context required. Geometry, materials and scene graphs run headless
  in Node; renderer labs (05–06) will add a browser harness.
- Assert behaviour, not implementation: part counts, bounding boxes, UV ranges,
  disposal events, topology.
- Use `three` from `node_modules`; never import from the frozen reference.
- Keep each lab under ~200 lines. If it needs more, it belongs in the app.
