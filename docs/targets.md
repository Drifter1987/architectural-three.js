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

## 8. Measured — M4 material studio

Reference villa, 60 openings, 1440 × 900, local Chromium, 120 frames after a
warm-up frame and a `readPixels` sync. Procedural stone, trim, roof, slab and
ground maps are active; the main and stair roofs each use a tiled top material
and a plain side material.

| Case | Draw calls | Frame time | Effective render rate |
| --- | --- | --- | --- |
| Textured materials, batched windows, split roofs | 231 | 1.99 ms | 502.9 fps |

The textured case stays within the 250-call budget and renders 41,662
triangles. Changing finish, tone, joint, frame or roof swaps maps/colours on
the existing material objects: the geometry and draw-call count are reused, and
the viewer is invalidated without rebuilding the villa.

## 9. Measured — first click / texture generation

Reference villa, 1440 × 900, local Chromium, 2048² desktop stone. Each row is a
fresh, uncached 2K pair: `performance.now()` brackets the real button click and
a synchronous `viewer.info()` render, so it includes procedural drawing and the
first texture upload. The rows were run in an order that kept every key cold;
the default `msamsam` / `white` pair was evicted by cycling the other values.
`tiles` is the boot roof and cannot be made cold without changing the boot
state, so its row is a warm hit. These are not the 1.99 ms steady-state frame.
These totals are click-to-render-submission, not click-to-paint: they end when
`viewer.info()` returns, before the compositor has presented a frame. §10
measures the painted frame instead.

| Group | Option | Total ms |
| --- | --- | ---: |
| Finish | Mbewwaz | 137.6 |
| Finish | Jabal | 25.8 |
| Finish | Mlattash | 75.1 |
| Finish | Beek | 777.9 |
| Finish | Msamsam | 896.2 |
| Finish | Mtabbeh | 1029.9 |
| Finish | Shaairi | 500.1 |
| Finish | Smooth | 30.8 |
| Finish | Combed | 27.9 |
| Finish | Rubble | 89.2 |
| Tone | Sand | 1132.2 |
| Tone | Honey | 832.2 |
| Tone | Pink | 882.4 |
| Tone | Mixed | 757.8 |
| Tone | White | 586.4 |
| Roof | Aged clay | 3.7 |
| Roof | Flat concrete | 19.3 |
| Roof | Terracotta (warm) | 1.6 |
| Warm cache | Finish / tone / roof | 1.1 / 1.3 / 1.1 |

The studio previously prewarmed the four heavy styles (`pick`, `sesame`,
`bush`, `barley`) on pointer/focus intent after 160 ms. That path was removed:
hovering Mtabbeh blocked the main thread for 1818.0 ms, and the following
click-plus-forced-render measured 2.7 ms, so the intent path cost more than the
1029.9 ms cold click it was meant to hide. That 2.7 ms was render submission,
not paint; §10 measures the painted frame. A click before the prewarm completed
also paid the cold cost. The stone LRU stays at 4 entries so memory stays bounded. No prewarm runs
on hover or focus now; a future prewarm must run off the main thread before it
is re-added.

## 10. Measured — click-to-paint (requestAnimationFrame)

Reference villa, 1440 × 900, DPR 1, local headless Chromium, 144 Hz
compositor; the measured rAF interval was 6.9–7.0 ms. The studio was open. For each click, a
probe rAF was scheduled before the click; the app's render loop had already
registered its rAF, so it rendered the new material before the probe ran. The
probe's first timestamp is the next animation frame; a second rAF runs after
that frame has been painted. This is a presentation bound, not a GPU-completion
timestamp or a display-photon measurement.

| Case | Click handler | Next rAF | After first paint |
| --- | ---: | ---: | ---: |
| Mtabbeh, warm cache, Canvas2D build | 0.2–0.3 ms | 6.8–7.0 ms | 13.8–14.0 ms |
| Mtabbeh, after prewarm, `058af05` | 0.1–0.3 ms | 6.7–7.2 ms | 13.6–14.1 ms |
| Mtabbeh, cold cache, Canvas2D build | 347 ms | — | 448.8 ms |

The cold row's next-rAF timestamp is unreliable because the click handler
blocks the main thread; the second rAF is the usable bound. Its handler time is
environment-specific and is not comparable to the headed-browser rows in §9;
compare only rows within this run. The old click-plus-`viewer.info()` metric on
the prewarmed build was 1.0–1.7 ms in this run, versus the reported 2.7 ms;
either way it returns before the next frame exists. `058af05` prewarm itself
took 975 ms in this run; the earlier headed run measured 1818.0 ms.

The 2.7 ms figure came from a click followed by a forced `viewer.info()` render;
the normal handler only invalidates and lets the animation loop render. It is
therefore not a visible-paint latency. A prewarmed or cache-warm click finishes
its JavaScript at 0.1–0.3 ms; in this probe the next frame started at
6.7–7.2 ms and was past at 13.6–14.1 ms on this 144 Hz compositor. The update is
visible in the next frame, not at 2.7 ms. A central
420 × 360 `readPixels` diff confirmed the next rendered frame changed after the
material click (150,162 of 151,200 sampled pixels changed). The current build
replaces this Canvas2D stone path with the GPU generator in §11; these rows
remain the baseline control.

## 11. Measured — GPU stone generator

Reference villa, 1440 × 900, DPR 1, local headless Chromium, 144 Hz; 2048² maps.
The wall now uses the reference's three-pass generator: height (RGBA16),
normal-from-height, then colour. The height target is nearest-filtered because
its 16-bit value is packed across two 8-bit channels; the normal and colour
outputs become mipmapped DataTextures and are held in the existing 4-entry
stone LRU. No hover/focus prewarm exists. If GPU generation fails, the
Canvas2D fallback is capped at 512² so it cannot reintroduce the 2K freeze;
that failure branch was not exercised in the timed run.

The first new finish after boot, Mtabbeh, measured **51.5 ms** in the click
handler and **58.0 ms** to first paint. The same-environment Canvas2D control
(§10) was **347.0 ms** / **448.8 ms**, so the GPU path is **6.7×** faster to the
handler and **7.7×** faster to paint. Against the §9 headed baseline of
**1029.9 ms** for click-plus-forced-render, the GPU handler is **20×** lower.

All ten finishes were then clicked once with a cold key in the 4-entry cache:

| Finish | Handler ms | After first paint ms |
| --- | ---: | ---: |
| Mbewwaz | 58.0 | 72.2 |
| Jabal | 72.9 | 83.2 |
| Mlattash | 71.7 | 90.1 |
| Beek | 52.7 | 55.3 |
| Shaairi | 39.7 | 41.4 |
| Smooth | 16.8 | 20.6 |
| Combed | 14.4 | 20.7 |
| Rubble | 14.8 | 20.7 |
| Mtabbeh | 15.3 | 20.7 |
| Msamsam | 14.5 | 20.6 |

The later Mtabbeh row is a cold cache key after nine generations; the generator
has warmed up. The first Mtabbeh after boot was 51.5 / 58.0 ms. No finish
exceeded **72.9 ms** in the handler or **90.1 ms** to paint.

Five cold tone changes on Mtabbeh:

| Tone | Handler ms | After first paint ms |
| --- | ---: | ---: |
| Sand | 56.1 | 64.0 |
| Honey | 84.5 | 103.4 |
| Pink | 70.3 | 85.5 |
| Mixed | 18.3 | 27.5 |
| White | 16.0 | 27.6 |

The slowest measured change in this section was Honey at **103.4 ms** to paint,
versus the §9 baseline range of 586–1132 ms for tones. The generator still runs
on the click task (14–85 ms); it is the reference GPU path, not a worker, but it
no longer moves a 1–2 s freeze to hover. Warm cache hits remain **0.3 ms** in
the handler and **13.8 ms** to paint.
