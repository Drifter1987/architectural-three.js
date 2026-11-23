# 06 — Post-processing and stills

## Read

| Path | What to learn |
| --- | --- |
| `src/renderers/WebGLRenderTarget.js` | size, type, depth texture, mipmaps |
| `src/textures/DepthTexture.js` | depth sampling |
| `examples/jsm/postprocessing/EffectComposer.js` | pass orchestration |
| `examples/jsm/postprocessing/SSAOPass.js` | screen-space AO reference |
| `manual/pages/post-processing.html` | composer vs manual passes |
| `manual/pages/rendertargets.html` | ping-pong targets |

## The technique

The reference does **not** use `EffectComposer`. It runs explicit passes:

1. render scene → colour + depth texture;
2. reconstruct view position from depth, sample a 16-tap hemisphere kernel,
   composite AO into an accumulation target with `1/(n+1)` weight;
3. jitter the camera (Halton) and the sun slightly, repeat 4–24 times;
4. bilateral blur the AO, add a quarter-res bloom, apply a grade with grain;
5. read the canvas as JPEG.

That is temporal accumulation: cheap per frame, clean when the camera stops.
It is the architectural equivalent of a denoised path tracer, built from WebGL
render targets.

## Build — `labs/06-still`

Port the pipeline to a small scene: depth texture, 16-tap AO, 24-frame
accumulation, blur, bloom, grade. Export one still and one interactive frame.

## Prove

- AO on/off: contact shadows under sill and cornice become visible
- 1 vs 8 vs 24 samples: noise metric drops monotonically
- frame time per sample measured; 24 samples under 3 s at 1440×900
- no depth texture support → graceful fallback to direct render

## Notes

- Half-float accumulation needs `EXT_color_buffer_half_float`; otherwise use
  `UnsignedByteType` and accept banding.
- Reset accumulation on camera movement or the image smears.
- `readRenderTargetPixels` is synchronous and slow; use it only for export.
- In r128, `WebGLMultisampleRenderTarget` exists; current Three.js uses
  `WebGLRenderTarget` with `samples`.
