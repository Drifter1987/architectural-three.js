# Component library — intentionally empty

Phase 4 reserves this boundary; it deliberately contains no villa builders yet.

When component work starts, every builder follows the ADR 0002 contract:

- pure function, local coordinates, options passed in;
- no global state, no reads from the UI or app store;
- returns `{ group, parts, materials, info }` so the caller can batch, price and
  inspect it;
- no external asset loading; textures are generated or inlined;
- geometry stays in the wall-graph coordinate system, not screen space.

Planned families (not implemented): `window`, `door`, `balcony`, `railing`,
`cornice`, `band`, `quoin`, `roof`, `stair`, `pergola`, `chimney`, `canopy`.

The empty folder is not imported by the shell. Adding a builder should be a
deliberate, separately reviewed step, not part of the scaffold.
