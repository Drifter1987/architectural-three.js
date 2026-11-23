# 07 — Scale and performance

## Read

| Path | What to learn |
| --- | --- |
| `manual/pages/optimize-lots-of-objects.html` | merge geometry, instancing |
| `manual/pages/optimize-lots-of-objects-animated.html` | matrix updates |
| `src/objects/InstancedMesh.js` | per-instance matrices and colours |
| `examples/jsm/utils/BufferGeometryUtils.js` | attribute-compatible merging |
| `src/renderers/WebGLRenderer.js` | `info.render.calls`, `info.memory` |
| `manual/pages/rendering-on-demand.html` | stop drawing when nothing changes |

## The technique

The reference keeps 57 window assemblies cheap by merging:

- small parts accumulate in `BAT[key|floor]` (`batAdd`), then one
  `mergeGeos` + one mesh per group (`batFlush`);
- repeated railings and balusters become `InstancedMesh` matrices;
- vegetation uses merged geometry and billboard cards;
- textures are cached and pruned;
- the interactive loop does no geometry work — rebuild happens on change.

## Build — `labs/07-perf`

Take lab 03's window, clone it 57 times onto a façade, and compare:

1. naive: one mesh per part;
2. merged per material;
3. instanced for repeated bars.

## Prove

- draw calls and frame time for all three variants at 1440×900
- target: ≤ 250 calls for the full villa, 60 fps
- merge preserves bounding boxes and materials
- memory: `renderer.info.memory.geometries/textures` before/after disposal

## Notes

- Draw calls, not triangles, are usually the limit at this scale.
- Merging across materials breaks batching; group by material first.
- Instancing is for identical geometry; a window with variants is not one
  instance.
- The reference has **no** `THREE.LOD`. Add it only if measurement says distant
  vegetation costs frames.
- Measure on the target machine, at the target viewport, with the real model.
