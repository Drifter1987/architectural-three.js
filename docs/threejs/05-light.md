# 05 — Light, colour, sky, shadows

## Read

| Path | What to learn |
| --- | --- |
| `src/lights/DirectionalLight.js` | sun direction, intensity, target |
| `src/lights/HemisphereLight.js` | sky/ground bounce |
| `src/renderers/WebGLRenderer.js` | `toneMapping`, `toneMappingExposure`, `outputColorSpace` |
| `src/extras/PMREMGenerator.js` | environment from a sky scene |
| `manual/pages/color-management.html` | linear vs sRGB, why colours look wrong |
| `manual/pages/shadows.html` | shadow camera, bias, map size |
| `manual/pages/fog.html` | depth cue and aerial perspective |

## The technique

The reference does not use an HDRI. It builds a sky sphere, renders it into a
PMREM environment, then lights the scene with:

- a low, warm directional sun (time-of-day presets),
- a hemisphere fill (sky above, stone/ground below),
- exponential fog matched to the sky colour,
- a shadow camera fitted to the building bounds, PCFSoft.

The realism is in the **ratio**: strong direct sun, cool sky fill, and shadows
that are soft but present under every sill and cornice.

## Build — `labs/05-light`

A façade fragment (wall + one window) under four sun positions: dawn, noon,
afternoon, dusk. Export a still for each.

## Prove

- four stills at identical camera, different sun azimuth/elevation
- shadow texel density: measure shadow map coverage of the façade; no acne
- colour check: a neutral stone sample stays neutral in daylight, warm at dusk
- no pure black shadows; hemisphere fill lifts them

## Notes

- In r128 lights use legacy intensity scaling; current Three.js is physically
  correct by default (`useLegacyLights` removed in r165). Re-tune intensities
  after migration, never copy them.
- `renderer.outputColorSpace = SRGBColorSpace` (current) replaces
  `outputEncoding = sRGBEncoding` (r128).
- Fit the shadow camera to the model, not to the world: every centimetre of
  unused shadow map is lost resolution.
- Fog colour must match the sky at the horizon or the building floats.
