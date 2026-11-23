# Component library

Every builder follows the ADR 0002 contract:

- pure function, local coordinates, options passed in;
- no global state, no reads from the UI or app store;
- returns `{ group, parts, materials, info }` so the caller can batch, price and
  inspect it;
- no external asset loading; textures are generated or inlined;
- geometry stays in the wall-graph coordinate system, not screen space.

## Implemented

### `window.js`

One window or door assembly in opening-local coordinates: origin at the
bottom-centre of the opening on the wall face, `+z` outward.

| Option | Values |
| --- | --- |
| `surround` | `flat`, `stepped`, `eared`, `thin`, `blocks` |
| `glazing` | `slide`, `french`, `grid`, `clear` |
| `shutters` | `none`, `green`, `wood` |
| `grille` | `none`, `bars`, `deco` |
| `head` | `none`, `cornice`, `lintel` |
| `sill` | `none`, `plain`, `corbel` |
| `kind` | `window`, `door` |

The default window is a 32-part assembly: four-part reveal, outer frame, two
sliding sashes, meeting stile, flat stone surround, sill and cornice. The reveal
is 0.20 m deep and the glass sits inside it, so the opening reads as a hole in a
stone wall rather than a pane pasted on the façade.

## Planned

`door`, `balcony`, `railing`, `cornice`, `band`, `quoin`, `roof`, `stair`,
`pergola`, `chimney`, `canopy`.
