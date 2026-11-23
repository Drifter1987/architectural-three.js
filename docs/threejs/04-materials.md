# 04 — Materials and the stone generator

## Read

| Path | What to learn |
| --- | --- |
| `src/materials/MeshStandardMaterial.js` | metalness/roughness, normal map, AO map |
| `src/materials/ShaderMaterial.js` | uniforms, vertex/fragment shaders |
| `src/renderers/WebGLRenderTarget.js` | offscreen passes, format/type, mipmaps |
| `src/renderers/shaders/ShaderChunk/` | how normals and lighting are assembled |
| `manual/pages/textures.html` | wrapping, filtering, anisotropy, colour space |
| `manual/pages/rendertargets.html` | render-to-texture workflows |

## The technique

Stone is not an image. It is a chain of three passes:

```
height(type, joint, course, block, arris, relief)
      → normal(height, texel size, cavity)
      → albedo(height, normal, colour, mortar, variation)
```

Each pass renders a full-screen quad into a `WebGLRenderTarget`. The height pass
encodes the joint depth and the tooling of the finish; the normal pass converts
the height gradient to a tangent-space normal; the albedo pass adds per-block
colour variation and mortar.

Physical parameters (metres, not pixels) from the reference:

| Finish | course | block | joint | relief |
| --- | --- | --- | --- | --- |
| mbawwaz (rock) | 0.24 × 0.36 | 0.35 × 0.70 | 0.010 | 0.055 |
| smooth | fine | regular | 0.006 | 0.010 |

10 finishes share the same code path; only parameters change.

## Build — `labs/04-stone`

A height→normal→albedo pipeline with 2K targets, 10 finishes and a preview
swatch. Start with 2 finishes and one colour, then parameterise.

## Prove

- 10 swatches at 256², rendered from the generated maps
- normal map responds to a moving light (two angles, visible difference)
- texture cache: repeat requests return the same target; pruning frees memory
- 2K generation time measured; 60 fps interactive unaffected after caching

## Notes

- Albedo textures must be `SRGBColorSpace`; normal/height maps are linear.
- Generating on the GPU needs no external assets and keeps the single-file rule.
- Half-float targets need `EXT_color_buffer_half_float` (WebGL2 usually has it).
- In r128 the property is `texture.encoding = THREE.sRGBEncoding`; current is
  `texture.colorSpace = THREE.SRGBColorSpace`.
- Anisotropy up to 8× is enough for oblique façade views; more costs memory.
