# 03 — Parametric components

## Read

| Path | What to learn |
| --- | --- |
| `src/geometries/BoxGeometry.js` | cheap boxes, shared geometry |
| `src/geometries/ExtrudeGeometry.js` | profiles: sills, corbels, arches |
| `src/core/Object3D.js` | local transforms, group nesting |
| `examples/jsm/utils/BufferGeometryUtils.js` | `mergeGeometries` |
| `manual/pages/optimize-lots-of-objects.html` | why merging matters |

## The technique

One `buildWindow(options)` returns a group of 30–60 solids:

| Option | Variants |
| --- | --- |
| `surround` | flat, stepped, eared, thin, blocks |
| `head` | none, cornice, lintel, key |
| `glazing` | slide, french, grid, clear |
| `shutters` | none, green, wood, rollo |
| `grille` | none, bars, decorative |
| `sill` | plain, corbel |
| `arch` | none, segmental |

Everything is positioned in **window-local coordinates**, so the caller only
supplies `width`, `height`, `reveal` and the options. The builder never reads
global state.

## Build — `labs/03-window`

A window assembly with reveal, frame, mullions, transom, glazing, sill,
five surrounds and optional shutters/grille.

## Prove

- ≥ 30 parts on the full path, with a part-type breakdown
- bounding box grows by the shutters and the surround, not by the glass
- 5 surrounds produce 5 distinct part counts/geometries
- ≤ 3 shared materials regardless of part count
- merging parts reduces draw calls without changing the bounding box

## Notes

- Reuse one `BoxGeometry` scaled per part if the material is unlit; for normals
  and UVs, per-part geometry is safer.
- `mergeGeometries` requires matching attributes; do not merge across materials.
- In r128 the helper is `mergeBufferGeometries`; current is `mergeGeometries`.
- Keep the reveal depth in metres (reference: 0.20 m). It is what makes the
  frame read as set back rather than pasted on.
