# 08 — Modernisation: r128 → current

## Read

| Path | What to learn |
| --- | --- |
| [Migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) | every breaking change, by release |
| `src/Three.Core.js` | the modern export surface |
| `src/renderers/WebGLRenderer.js` | output colour space, shadow types |
| `src/nodes/` | node materials / TSL (WebGPU-ready) |
| `package.json` exports | `three`, `three/addons/*`, `three/webgpu` |

## The mapping that matters for this app

| r128 (reference) | Current |
| --- | --- |
| `renderer.outputEncoding = sRGBEncoding` | `renderer.outputColorSpace = SRGBColorSpace` |
| `texture.encoding = sRGBEncoding` | `texture.colorSpace = SRGBColorSpace` |
| `THREE.Geometry` | removed long ago — `BufferGeometry` only |
| `examples/js/controls/OrbitControls.js` | `examples/jsm/controls/OrbitControls.js` |
| `mergeBufferGeometries` | `mergeGeometries` |
| legacy light intensity | physically correct lighting by default |
| `WebGLMultisampleRenderTarget` | `WebGLRenderTarget({ samples })` |
| `renderer.useLegacyLights` | removed (r165) |
| `renderer.physicallyCorrectLights` | removed |
| `Geometry.vertices` | `BufferAttribute` arrays |

## Build — `labs/08-modern`

Port one lab (02 or 03) to the current `three` package and document every diff.
Then build a smoke scene with a wall, a window and a render target.

## Prove

- the ported lab passes the same assertions
- the visual diff against the r128 render is explainable (colour/lighting)
- bundle size measured with tree-shaking: only used modules included
- `npm ls three` shows a pinned version; no CDN

## Notes

- Do **not** migrate the frozen reference. It is a 2021 artefact and must stay
  byte-identical. Migrate the rebuild only.
- Newer is not automatically better for this project: verify shadow quality,
  tone mapping and texture memory after each upgrade.
- WebGPU/TSL is a research branch, not a requirement. Keep WebGL2 as the
  shipping target until parity is proven.
- Pin the version and record it in `package.json` + this note.
