# Targets

Numbers, not adjectives. Every target is either measured from the reference or
chosen as a hard budget for the rebuild. Update this file only with a measured
result.

## 1. Fidelity — model parity

| Target | Value | Why |
| --- | --- | --- |
| Storeys | 3 (BF / GF / FF) | reference model |
| Wall edges | 74, each with a name | reference model |
| Openings | 57 (43 W / 14 D), each placed by `axis/face/s0/s1` | reference model |
| Parts per opening | ≥ 30 placed solids on the default path | measured: 53 conditional placements |
| Surround profiles | 5 (flat, stepped, eared, thin, blocks) | reference `kader` |
| Corner models | 6 | reference `corner` |
| Glazing patterns | 4 (slide, french, grid, clear) | reference `wglass` |
| Stone finishes | 10 | reference `STYLE_IX` |
| Stone texture | 2048² desktop / 1024² mobile, mipmapped, aniso 8 | reference `sgInit` |
| Balconies | 8 with real polygons + parapet segments | reference model |
| Roof | 12-vertex polygon, hipped tile + flat variants | reference model |

**Definition of parity:** the rebuilt app can load the reference `model-data`
unchanged and produce the same storey levels, wall lengths, opening positions
and balcony polygons. No conversion loss.

## 2. Fidelity — appearance

| Target | Value |
| --- | --- |
| Stone joint depth / arris | physical units, per finish, visible at 1.5 m viewing distance |
| Window reveal | 0.20 m recess, frame set back |
| Shadow quality | no visible acne; contact shadow under sills and cornices |
| Still quality | 24 accumulated samples, AO + bloom + grade, JPEG export |
| Site | plateau levels 0 / 1.6 / 3.05 m; terrain never clips the basement |

## 3. Performance

| Target | Budget |
| --- | --- |
| Interactive frame | 60 fps at 1440 × 900 on the reference machine |
| Draw calls, full villa | ≤ 250 |
| First interactive paint | ≤ 2 s local, warm cache |
| Full build (74 walls, 57 openings) | ≤ 400 ms |
| Still export (24 samples) | ≤ 3 s |
| Shipped single file | ≤ 1.2 MB (reference: 0.96 MB) |
| Runtime dependencies | 0 (Three.js is bundled, no CDN) |
| Mobile | 1024 stone, 12 samples, ≥ 30 fps |

Any claim of a speed-up must include before/after numbers captured with
`renderer.info` and `performance.now()`, on the same machine and viewport.

## 4. Engineering

| Target | Value |
| --- | --- |
| Reference integrity | SHA-256 test must pass on every run |
| Schema validation | invalid wall/opening rejected before build |
| Money math | every total derived from geometry, unit-tested |
| Licence | no commercial use; third-party notices preserved |
| Build | single HTML output; no runtime network of any kind |

## 5. The “definition of realistic” protocol

To compare two renders honestly:

1. Same camera position, target and FOV (store them in the harness).
2. Same sun azimuth/elevation, same time-of-day preset.
3. Same canvas size and pixel ratio; hide UI chrome.
4. Same crop: façade, entrance, one window close-up, roof edge.
5. Capture both, save under `docs/assets/ab/<preset>/`, and diff at 50 % blend.
6. Record the numbers in this file before claiming improvement.

Screenshots are evidence, not decoration. A change that cannot be seen in the
protocol is not a fidelity improvement.

## 6. Gates

| Gate | Requirement |
| --- | --- |
| A — foundation | `npm test` green; reference hash verified; licence + README in place |
| B — teardown | every claim traceable; evidence JSON regenerated |
| C — targets | this file accepted; baseline screenshots captured |
| D — mastery | labs 01–03 pass before app scaffolding |
| E — architecture | ADR 0002 accepted before app code |

## 7. Measured — M3 32-part windows

Reference villa, 60 openings, 1440 × 900, local Chromium, 60 frames after a
warm-up frame. `renderer.info.render.calls` includes the shadow pass;
`performance.now()` brackets the render loop and a `readPixels` sync. Both
cases submit 41,662 triangles.

| Case | Draw calls | Frame time | Effective render rate |
| --- | --- | --- | --- |
| Windows unbatched (32 parts each) | 3,697 | 23.58 ms | 42.4 fps |
| Windows batched per material (5 meshes) | 227 | 2.03 ms | 492.6 fps |

The unbatched path misses the 250-call budget by 14.8×; batching meets it. The
measured change is 16.3× fewer draw calls and 11.6× lower frame time. The
"effective render rate" is `1000 / msPerFrame` from the uncapped render loop,
not a vsync-capped display rate. The app uses batching by default;
`?batch=0` selects the unbatched path for comparison.
