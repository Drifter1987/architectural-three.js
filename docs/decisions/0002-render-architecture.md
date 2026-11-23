# ADR 0002 — Render architecture for the rebuild

- Status: accepted (Phase 4 shell and schema validator started)
- Date: 2026-11-23

## Context

The reference gets its realism from four things, in order of impact:

1. an authored building model (walls with names, openings with absolute
   placement);
2. a component library with variants (5 surrounds, 6 corners, 4 glazing
   patterns, 3 railings);
3. a physical stone material generated on the GPU;
4. a progressive AO still pipeline.

The existing `villa_abdo` app generates a footprint and distributes windows by
rhythm. No amount of material work rescues that: the details are in the wrong
places because the model does not know where the rooms are.

## Decision

### 1. Data is the app

A versioned `model` object is the single source of truth:

```json
{
  "version": 2,
  "name": "Villa Abdo",
  "floors": [{ "key": "GF", "z0": 3.1, "h": 3.3,
    "edges": [{ "a": [0,0], "b": [6.898,0], "name": "…",
                "kind": "stone", "openings": [0,1] }] }],
  "openings": [{ "floor": "GF", "edge": 0, "axis": "y", "face": 0, "out": -1,
                 "s0": 1.311, "s1": 3.546, "sill": 0.7, "kind": "W",
                 "w": 2.23, "h": 1.5, "name": "…" }],
  "balconies": [], "roof": {}, "stair": {}, "terrace": {}, "steps": [],
  "planters": [], "columns": [], "check": []
}
```

Rules:

- Every wall carries its room/façade name.
- Every opening is placed on an edge by `axis/face/s0/s1`; no rhythm rule.
- Areas are derived, never stored as truth; `check` stores reconciliation only.
- A schema validator runs before any geometry is built. The version 2 validator lives in `app/src/schema.js`; the reference `model-data` is accepted as a legacy v1 fixture via `allowLegacy` and imported into v2 in `app/src/model/import.js`. Round-trip acceptance is `npm run verify:model`.

### 2. Component library

`src/components/` exports pure builders that return groups/meshes in local
coordinates:

- `window.js`: reveal, frame, mullion, transom, glazing, rollo, shutters,
  grille, sill, surround, hood; variants as options.
- `door.js`, `balcony.js`, `railing.js`, `cornice.js`, `band.js`, `quoin.js`,
  `roof.js`, `stair.js`, `pergola.js`, `chimney.js`, `canopy.js`.
- Each builder returns `{ group, parts, materials, info }` so the caller can
  batch, price and inspect.

No builder reads global state. Options are passed in.

### 3. Walls

`ShapeGeometry` with real holes and continuous UVs over the wall length, recessed
0.20 m. Box-segmentation around openings is rejected: it breaks the stone course
continuity and the reveal shadow.

### 4. Materials

`stone.js` implements the height → normal → albedo pipeline with
`WebGLRenderTarget` and `ShaderMaterial`:

- 2048/1024 targets, 10 finishes, physical course/block/joint parameters;
- albedo in sRGB, normal map tangent-space, mipmaps + anisotropy;
- cache keyed by finish/joint/colour, pruned to what is in use;
- per-block atlas for chamfered stones.

### 5. Rendering

- Interactive: ACES tone mapping, PCFSoft shadows, sky/fog, render on demand.
- Still: depth texture → 16-tap AO accumulation → camera/sun jitter over 4–24
  frames → bilateral blur → bloom → grade, exported as JPEG.
- No external post-processing framework required; passes are explicit.

### 6. Performance

- Merge parts per `floor|variant` (`batAdd`/`batFlush` equivalent).
- Instance repeated railings/balusters.
- Rebuild on state change only; never in the animation loop.
- Budget: ≤ 250 draw calls, 60 fps at 1440×900.

### 7. Import

The importer in `app/src/model/dxf.js` reads DXF `LINE` and straight
`LWPOLYLINE` entities and maps them to named edges. Curved bulges and unknown
formats are explicit errors, not silent approximations. Openings are attached
only from an explicit sidecar array with floor, edge and `s0`/`s1` offsets —
never inferred by rhythm. The reference `model-data` is the first fixture: if
the rebuild cannot load it, parity has failed.

## Consequences

- The generic footprint generator in `villa_abdo` is **not** ported.
- Existing CAD parsers can be reused as an importer, but their output must be
  converted to the wall-graph schema, not to a single footprint.
- The estimate is rebuilt on the same model; money math gets tests.
- This is a larger build than the reference (which has no tests or importer), so
  milestones are gated by measured parity, not by feature count.
