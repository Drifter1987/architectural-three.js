# 01 — Core and the render loop

## Read

| Path | What to learn |
| --- | --- |
| `src/core/Object3D.js` | parent/child, matrices, `updateMatrixWorld`, traverse |
| `src/core/Scene.js` | scene graph root, background/environment |
| `src/core/BufferGeometry.js` | attributes, index, groups, bounding volumes, dispose |
| `src/renderers/WebGLRenderer.js` | render lists, state sorting, `setAnimationLoop`, `info` |
| `manual/pages/fundamentals.html` | the render loop and “render on demand” |
| `manual/pages/scenegraph.html` | scene graph parenting |
| `manual/pages/rendering-on-demand.html` | why not to redraw every frame |

## Build — `labs/01-core`

A scenegraph with shared geometry/material, a camera, one light, and an explicit
disposal audit. The lab must prove that three meshes can share one geometry and
that disposal happens exactly once per resource.

## Prove

- object/mesh/light counts from `traverse`
- triangle count from index or position attributes
- `dispose` events: 1 per shared geometry, 1 per shared material
- no allocation inside an idle frame (render-on-demand flag is the design)

## Notes

- `renderer.setAnimationLoop(fn)` is the modern loop; `requestAnimationFrame` is
  fine for on-demand rendering.
- `renderer.info.render.calls/triangles` is the only honest draw-call source.
- In r128 `outputEncoding`/`sRGBEncoding` exist. Current Three.js uses
  `outputColorSpace`/`SRGBColorSpace` and defaults to sRGB output.
- Disposing a geometry does not dispose its materials, textures, or the renderer.
