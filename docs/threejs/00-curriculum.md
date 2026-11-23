# Three.js mastery — curriculum

Goal: know Three.js well enough to rebuild the reference from first principles,
not to collect tutorials. Every module is **Read → Build → Prove**.

## Study corpus

The primary source is the library itself, shallow-cloned and sparsely checked out:

```bash
mkdir -p reference/three && cd reference/three
git init -b main
git remote add origin https://github.com/mrdoob/three.js
git -c core.longpaths=true fetch --depth=1 --filter=blob:none origin dev
git sparse-checkout init --cone
git sparse-checkout set src docs examples/jsm manual/pages
git -c core.longpaths=true checkout -b dev FETCH_HEAD
```

`init` + `fetch` is used instead of `git clone --no-checkout` because Git for
Windows still tried to write an over-long `manual/examples/...` path during
clone. Fetching first never touches the worktree. The checkout used for these
notes is `dev` at `b2dce982` (2026-11-23), `three@0.187.0`.

| Source | Use |
| --- | --- |
| `reference/three/src` | the actual implementation of every class used |
| `reference/three/docs` | API reference |
| `reference/three/manual/pages` | conceptual chapters |
| `reference/three/examples/jsm` | addons: controls, loaders, post-processing, utils |
| <https://threejs.org/examples/> | runnable behaviour to compare against |
| [Migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) | r128 → current API |

The reference bundles **r128** (2021). The study clone is `dev` (current). That
gap is itself a module: know what changed and why.

## Rules

1. **Read the source, not just the docs.** Every module names the files to open.
2. **Build a lab under `labs/<module>/`.** Small, runnable, no app code.
3. **Prove with a number.** Draw calls, part counts, frame times, UV ranges,
   sample convergence. “Looks better” is not proof.
4. **Write one page** in the module file: what surprised you, what the API
   actually does, what you would do differently.
5. Do not copy reference code. Reimplement the technique.

## Modules

| # | Module | Lab | Gate |
| --- | --- | --- | --- |
| 1 | Core & render loop | `labs/01-core` | scene graph + disposal report |
| 2 | Geometry authoring | `labs/02-wall-holes` | wall with real holes + continuous UVs |
| 3 | Parametric components | `labs/03-window` | ≥ 30-part window assembly |
| 4 | Materials & shaders | `labs/04-stone` | 10 generated stone swatches |
| 5 | Light, colour, sky | `labs/05-light` | 4 time-of-day stills |
| 6 | Post-processing & stills | `labs/06-still` | 24-sample AO export |
| 7 | Scale & performance | `labs/07-perf` | 60 fps @1440×900, draw-call budget |
| 8 | Modernisation | `labs/08-modern` | r128 → current migration note |

**Gate D:** modules 1–3 must pass before any app scaffolding.

Status: labs 01–03 are implemented and pass (`npm run labs`). Labs 04–08 are
specified above but not built yet — they need the render/still harness that
comes with the Phase 4 scaffold, so their proof artefacts (swatches, stills,
frame timings) are deliberately not faked here.

## Why this order

Geometry comes before materials because a bad wall cannot be saved by a good
shader. Materials come before lighting because a normal map only shows up when
the sun moves. Lighting comes before post because AO amplifies real geometry,
not fake detail. Performance comes last because optimising an unbuilt scene is
guesswork.
