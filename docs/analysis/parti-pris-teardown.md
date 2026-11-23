# Parti Pris — deep teardown

How `parti-pris-three.js.html` is actually built, why it looks real, whether AI
was involved, and what it would take to reach the same level.

All claims below are tied to a line in the frozen reference or to a generated
artifact in [`evidence/`](evidence/). The reference hash is enforced by
`npm test`.

> **One-sentence answer:** it looks real because the house is a *surveyed model*
> (74 named walls, 57 placed openings) rendered by a *component library* (53
> conditional part placements per opening), with *GPU-generated stone* and a
> *multi-frame ambient-occlusion still pipeline* — not because it uses better
> assets. There are no assets.

---

## 0. Evidence base

| Claim | Source |
| --- | --- |
| 960,097 bytes, 4,064 lines, LF | `reference/SHA256SUMS`, `tests/reference-integrity.test.mjs` |
| 3 floors / 74 walls / 57 openings / 8 balconies | `docs/analysis/evidence/model-schema.json` |
| 246 functions in 2,479 app-script lines | `docs/analysis/evidence/inventory.json` |
| 53 part placements in the opening builder | `inventory.json → openingPartCalls` |
| 37 priced items / 8 stones / 4 sections | `model-schema.json → estimate` |
| Zero embedded media or model files | `tests/reference-model.test.mjs` |
| Three.js r128, OrbitControls | lines 1988, 1990–3035; `const e="128"` |

Reproduce the extraction:

```bash
npm test
node -e "console.log(require('./docs/analysis/evidence/inventory.json'))"
```

---

## 1. Bundle anatomy

The file is a complete application in one document, in four layers:

| Lines | Layer | What it does |
| --- | --- | --- |
| 1–520 | HTML + CSS | RTL Arabic UI, dark/light tokens, viewer, tabs, dialogs |
| 521–1577 | UI / i18n script | copy switching, tabs, summary text |
| 1578–1581 | **data islands** | `__SEED_STATE`, `estimate-data`, `model-data`, `ideas-data` |
| 1582–4061 | application script | state, cost model, geometry, materials, renderer, stills |
| 1988–3035 | vendored engine | minified Three.js r128 + OrbitControls |

The data islands are `<script type="application/json">`, parsed directly — no
fetch, no loader, no build step. The whole app boots from `file://` except for
the reference's optional Google Fonts and the “save still” path.

**Why this matters:** the geometry is not inferred at runtime. It is embedded
data, and the script is a *renderer for that data*.

---

## 2. The data model — a surveyed villa, not a generator

`model-data` contains 3 floors, 74 wall edges, 57 openings, 8 balconies, a
12-vertex roof polygon, a stair room, a terrace, 8 step blocks, 2 columns and a
reconciliation table.

### Floor

```json
{ "key": "BF", "name": "الطابق السفلي", "z0": 0, "h": 3.1,
  "edges": [ … ], "corners": 7, "area_sign": 1 }
```

`z0` is the absolute storey level (0 / 3.1 / 6.4). `area_sign` handles polygon
winding for area computation.

### Wall edge

```json
{ "a": [0, 0], "b": [6.898, 0], "len": 6.898, "kind": "stone",
  "name": "غرفة النوم 2 والحمام - الجدار العلوي",
  "openings": [34, 35] }
```

This is the single most important difference from a footprint generator: a wall
knows **which room it belongs to**, and it indexes the openings cut into it.

### Opening

```json
{ "floor": "BF", "x0": 1.311, "y0": -0.006, "x1": 3.546, "y1": 0.309,
  "o": "H", "kind": "W", "w": 2.23, "h": 1.5, "sill": 0.7,
  "name": "نافذة غرفة النوم الرئيسية",
  "edge": 0, "axis": "y", "face": 0, "out": -1, "s0": 1.311, "s1": 3.546 }
```

`axis`/`face`/`out` encode the wall plane and which side is outside; `s0`/`s1`
are the position along the edge. That is a CAD-grade placement record, not a
"put windows every 3.2 m" rule.

### Site pieces

- **Roof**: 12-vertex polygon, `z0 9.39 → z1 9.71`, perimeter 83.49 m.
- **Stair room**: 4-vertex polygon, height 2.8 m.
- **Terrace**: 4-vertex polygon at `z 3.1`.
- **Balconies**: 8, each with a polygon, parapet segment list, parapet length and
  a `slab` flag — including the notched plan shape of the side balcony.
- **Steps**: 8 blocks, each with a top level and two plan polygons.
- **Columns**: 2, at the entrance canopy, radius 0.22, from 3.1 to 9.39.

### The proof that it is measured

`model.check` compares computed geometry with a workbook:

| Floor | net (m²) | wb_net | minor |
| --- | --- | --- | --- |
| BF | 115.1 | 116.17 | 0 |
| GF | 220.8 | 220.63 | 1.17 |
| FF | 199.7 | 198.62 | 1.17 |

Three floors, wall lengths and opening areas reconciled to within 2 m². An AI
can invent room names; it cannot invent a workbook reconciliation that lands
inside 1.17 m² without the data being real.

**Consequence:** there is no UI to change the plan shape. The reference is a
digital twin of *one* villa. That is a product decision, and the source of most
of its realism.

---

## 3. Build pipeline

```
boot
 ├─ connect()                 state from Claude artifact DB or localStorage
 ├─ initScene / renderer      WebGL2, ACES, sRGB, PCFSoft shadows
 ├─ buildStones / buildRates  price UI
 └─ buildHouse
     ├─ per floor, per edge    quad or holedWall  (74 walls)
     ├─ per opening            buildOpening      (57 assemblies)
     ├─ balconies, parapets, railings, balustrades
     ├─ stair room, roof, chimney, roof rail
     ├─ corners, bands, strips  (quoins / string courses)
     ├─ entrance, canopy, columns, pergola, arches
     ├─ buildTerrain, buildGarden, buildRoads
     ├─ applyAtlas              per-block stone atlases
     └─ batFlush                merge parts per floor/option
```

`buildHouse` (line 2563) is 40 lines of orchestration. Everything it calls is a
single-purpose builder. There is no generic “wall system”; there are walls,
cornices, bands, quoins, sills, jambs, arches, balusters and rails.

After a rebuild, `initRefine`/`refineStep`/`refineOut` (3414–3460) run the AO
accumulation for a still-quality frame; the interactive frame is the cheap one.

---

## 4. The component library

The opening builder (3541) is the heart of the realism. It is one function with
**53 conditional part placements** (`inventory.json`), assembled per opening:

| Group | What is built |
| --- | --- |
| Reveal | 4 trim boxes lining a 0.2 m recess (`REV = 0.2`, line 2547) |
| Glass | curved `glassGeo` pane, no shadow casting |
| Frame | top/bottom/left/right profiles |
| Mullions | `round(w / 0.8) − 1` vertical bars |
| Transom | at 74 % of window height, or 80 % for doors |
| Glazing bars | french / grid patterns, plus a horizontal bar above the transom |
| Roller shutter | procedural `drawRollo` texture in a reveal box |
| Shutters | side leaves, green or wood |
| Grille | vertical iron bars plus decorative `TorusGeometry` rings |
| Stone surround | **5 profiles**: flat, stepped, eared, thin, blocks |
| Arch | circular-segment lintel computed from width and rise, plus key stone |
| Sill | plain or corbelled (`ExtrudeGeometry` bracket) |
| Hood | cornice or lintel over the opening |
| Entrance | extra surround, wider head, three-layer cap |

Corners alone have **6 models** (pilaster, straight, rustic, alt, altDraft,
altRock), selected by `S.decor.corner`. The pack also contains:

- string courses (`buildBands`, `buildBands2`), sill strips (`buildStrips`)
- cornice in layers (`buildKorn`), parapet, coping
- chimney, roof rail, roof terrace, pergola, exterior stair
- balconies with three railing systems: stone balustrade (lathe-turned
  balusters), black iron, or glass with a steel cap
- hipped tile roof (`buildQRoof`) and a flat roof with tile terrace
- arches around selected openings (`buildArches`, `ARCH_OPS`)
- entrance canopy that **moves on columns** (`setRise`, 1734)

This is why “every detail is in place”: a window is not a textured rectangle. It
is 30–60 solids placed in wall coordinates, with the reveal, frame, glazing,
shading and stone surround all derived from one record.

---

## 5. Materials — the stone is generated on the GPU

There is exactly one place in the reference where a stone texture comes from,
and it is not a canvas: `sgInit` (2284) builds a tiny offscreen pipeline with
`ShaderMaterial` passes and `WebGLRenderTarget`s.

```
height shader  →  normal-from-height shader  →  albedo shader  →  preview
 (course, block, joint, margin, arris, relief)   (color, mortar, variation, warm)
```

- Resolution: **2048²** desktop, **1024²** on narrow screens; 256² previews.
- 10 finishes (`STYLE_IX`): rock, pick, sesame, barley, smooth, split, comb,
  rubble, bush, chisel.
- Per-finish physical parameters in metres: course and block size, joint width
  and depth, margin, arris, relief, cavity.
- Albedo is tinted from a small palette (white, sand, honey, pink, mixed) with
  mortar and per-block variation.
- Textures are mipmapped, anisotropic (up to 8×), cached by
  `type|joint|size|color`, and pruned to what is in use (`sgPrune`).
- `chamBlock` gives each cut stone a chamfer and maps its faces into one tile of
  a block atlas, so tooling and margins land on the block, not across it.

Compare with a canvas-drawn stone texture: canvas gives you colour; the SG chain
gives you a **normal map that responds to the sun**, per course, with the joint
depth and arris of the chosen finish. That is the difference between “stone
pattern” and “stone”.

---

## 6. Rendering — the “photograph” pipeline

`setLight` (3366) and `buildSky` (3326) set a physically plausible sun, sky,
fog and shadow camera. The still quality comes from `initRefine` (3414):

1. Render the scene into an RGBA target with a **depth texture**.
2. Composite a **16-tap hemisphere AO** kernel into an accumulation target
   (half-float when available), using the depth to reconstruct position/normal.
3. Jitter the camera with a Halton sequence and orbit the sun slightly, then
   accumulate **4–24 frames** (12 on mobile) with `1/(n+1)` weight — soft
   shadows and clean edges without a heavy shadow setup.
4. Bilateral blur the AO, add a 4-tap bloom at quarter resolution, then a grade
   shader with film grain.
5. `captureStill` (3720) drives the accumulation and exports a JPEG.

The interactive render is ordinary `WebGLRenderer`; the “realistic” frame is a
progressive still. That is a deliberate architectural choice: quality where the
user stops, speed where they move.

---

## 7. The site — topography authored around the building

`landH(x, z)` (2961) is analytic, not a heightmap:

- site plateaus at 0 m (basement), **1.6 m** (forecourt) and **3.05 m** (garden),
  matching the villa's actual levels;
- a smooth valley/mountain term far away;
- fbm hills at two scales, plus fine noise;
- `groundAt` raises the terrain to any plateau block it falls inside.

`buildTerrain` (2876) creates the three plateau blocks; `buildRoads` (3035)
drapes the drive; `buildGarden` (3239) plants olives, cypresses, shrubs, tufts
and vines with seeded placement and collision tests; `buildMountains` (3335)
adds the Bekaa backdrop.

This is why the house “sits” in the land instead of floating on a plane: the
ground was authored to the building's levels, not generated independently.

---

## 8. Performance architecture

- **Batching**: `batAdd`/`batFlush` merge all small parts per `key|floor` into a
  single mesh (`BAT`), so 57 windows do not become thousands of draw calls.
- **Instancing**: 3 `InstancedMesh` groups (railings, balusters, pergola) and
  matrix lists for repeated bars.
- **Merging**: 5 `mergeGeos` calls for vegetation and repeated geometry.
- **Billboards / far geometry**: `farTreeGeo`, `Cards`, far grove.
- **Texture discipline**: cached render targets, pruned by use, mobile caps.
- **Progressive rendering**: interactive frames are cheap; stills accumulate.
- **Build once, not per frame**: geometry is rebuilt on state change, never in
  the animation loop.

What it does **not** use: `THREE.LOD`, GLTF, compressed textures, workers. The
performance comes from batching and from not over-drawing.

---

## 9. Cost coupled to geometry

The estimate is not a separate spreadsheet pasted into the page:

- 37 items, 8 stone rates, 4 sections, 7 groups.
- `setDecor` (1700) changes **what is priced**: choosing a solid parapet turns
  off balusters and turns on coping; choosing fluted columns turns off square
  column pricing; choosing a window head changes hood quantities.
- `setRise` (1734) raises the entrance roof and recomputes cornice and column
  quantities from the new height (`kornQ`, `colQ`).
- `S.qty` starts from measured values (e.g. 774.2 m² of scaffolding, 115.1 m² of
  BF stone) and can be overridden.
- `model.check` reconciles the model against the workbook.

That coupling is why the app feels like a quantity surveyor's tool rather than a
configurator with a price label.

---

## 10. Was AI involved?

**Yes — with high confidence for the authoring environment, and medium-high for
much of the code. No for the design data.**

Evidence:

1. `connect()` (2053) calls `window.claude.use("db")`, opens
   `db.doc("estimate/main")`, subscribes with `onSnapshot`, and checks
   `u.can("data.write")`. That is the **Claude artifacts runtime API**, not a
   normal web API. A file written for a generic host would not contain it.
2. `window.claude.use("downloads")` (3718) is used to save the still.
3. `__SEED_STATE` (1578) is a serialized session state — the author's last
   working state, shipped as the default. It contains 20 décor options, 35
   included cost lines, measured quantities and rates.
4. Code style: 246 small functions in 2,479 lines, terse helpers (`bx`, `put`,
   `hd`, `kv`), descriptive English CSS comments, very few dead branches,
   consistent naming. This is the shape of an LLM-assisted iteration loop.
5. But the **data** is not AI-invented: Arabic room names, 3-decimal coordinates,
   a workbook reconciliation, 37 priced items with measured quantities, and a
   decade-specific Lebanese stone vocabulary. That is human project data.

**Most likely history:** the author supplied the villa data and reviewed renders;
Claude (in artifacts) wrote or co-wrote the geometry, materials and UI across
many iterations. The “magic” is not a prompt — it is 74 walls, 57 opening
records, 53 part placements per opening, and a shader pipeline, all tuned by
looking at screenshots.

---

## 11. How to reach this level

1. **Author the building, don't infer it.** A footprint plus a window rhythm can
   never place the guest-room window 1.311 m from the corner because the room
   needs it there.
2. **One component, many variants.** Build a window once; expose head, surround,
   glazing, shutter, grille and sill as data. Then 57 openings are cheap.
3. **Cut real holes.** `Shape` + `Path` holes with continuous UVs; recess the
   frame so the reveal casts a shadow.
4. **Generate materials physically.** Height → normal → albedo, in metres, with
   per-finish joint depth and arris.
5. **Light like a photographer.** Low sun, soft shadows, AO, fog, and a
   progressive still for the hero image.
6. **Author the ground to the building's levels.** Plateaus + analytic terrain,
   not a flat plane with a texture.
7. **Batch and refine.** Merge small parts; keep the interactive path cheap and
   the still path expensive.
8. **Couple money to geometry.** If changing a parapet changes the bill, the
   model is real.
9. **Stay single-file.** No build step is a feature; it makes the app portable
   and auditable.
10. **Iterate visually.** Screenshot, compare, adjust — the reference clearly
    evolved that way.

### Replication roadmap

| Milestone | Deliverable | Acceptance |
| --- | --- | --- |
| M1 | Wall-graph schema + validator | 74 walls / 57 openings round-trip; invalid edges rejected |
| M2 | CAD → wall graph importer | DXF walls become named edges; openings placed on edges |
| M3 | Component library v1 | window ≥30 parts, 5 surrounds, 4 glazing patterns |
| M4 | Stone generator | 10 finishes, 2K targets, A/B against reference swatches |
| M5 | Lighting + still pipeline | 24-sample AO still, 4 time-of-day presets |
| M6 | Site | levels match model, terrain never clips the basement |
| M7 | Performance | 60 fps @1440×900, draw-call budget, mobile caps |
| M8 | Cost | 37 items derived from geometry, reconciled to a workbook |

---

## 12. Gap matrix — reference vs `villa_abdo`

| Dimension | `villa_abdo/villa-studio.html` | Reference |
| --- | --- | --- |
| Building source | footprint polygon + presets | authored 74-wall graph with room names |
| Openings | one `buildOpening`, 4 types, rhythm-distributed | 57 placed records, 53 conditional placements each |
| Walls | quad segmentation around openings | `ShapeGeometry` with real holes, continuous UVs |
| Stone | canvas albedo + bump (`drawStone`, `macroize`) | height→normal→albedo GPU chain, per-block atlas |
| Corners / bands / sills | limited | 6 corner models, bands, strips, corbels |
| Render | standard lights + shadow map | AO accumulation + camera/sun jitter + bloom/grade |
| Site | generic terrain + garden | plateaus authored to the villa's levels + roads |
| Performance | rebuilds building **and site** every dirty frame | batched build on change; cheap interactive frame |
| Cost | stone-only estimate, 8 items-ish | 37 items, decor-coupled, workbook-reconciled |
| Tests | 8 CAD-parser tests | none in the file (its own risk) |
| Size | 9,104 lines / 1.1 MB | 4,064 lines / 0.96 MB |

Fairness note: `villa_abdo` has an importer and a test suite; the reference has
neither. The reference wins on fidelity, not on engineering hygiene.

---

## Appendix — line index

| Line | Symbol |
| --- | --- |
| 1578 | `__SEED_STATE` |
| 1579–1581 | `estimate-data`, `model-data`, `ideas-data` |
| 1582 | application script start |
| 1700 | `setDecor` |
| 1718 | `applyPreset` |
| 1734 | `setRise` |
| 1754 | `buildStones` (price UI) |
| 2053 | `connect` — `window.claude.use("db")` |
| 2284 | `sgInit` — stone generator |
| 2547 | `FW`, `REV` |
| 2549 | `holedWall` |
| 2563 | `buildHouse` |
| 2603 | `buildBalconies` |
| 2660 | `buildBands2` |
| 2678 | `buildKorn` |
| 2704 | `buildChimney` |
| 2735 | `buildBands` |
| 2758 | `buildStrips` |
| 2769 | `buildEntrance` |
| 2786 | `buildColumns` |
| 2860 | `buildCanopy` |
| 2876 | `buildTerrain` |
| 2883 | `buildPergola` |
| 2890 | `buildTiles` |
| 2906 | `buildArches` |
| 2961 | `landH` |
| 3035 | `buildRoads` |
| 3239 | `buildGarden` |
| 3326 | `buildSky` |
| 3335 | `buildMountains` |
| 3366 | `setLight` |
| 3414 | `initRefine` |
| 3436 | `refineStep` |
| 3450 | `refineOut` |
| 3500 | `buildCorners` |
| 3541 | `buildOpening` |
| 3660 | `applyAtlas` |
| 3718 | `window.claude.use("downloads")` |
| 3720 | `captureStill` |
| 3862 | `buildQRoof` |
