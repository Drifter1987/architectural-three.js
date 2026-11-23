# House spec

The app builds a house from a **spec object**, not from a finished v2 model.
`app/src/model/house.js` exports the one function that turns a spec into the
canonical wall-graph model the viewer uses:

```js
import { createHouseModel } from './app/src/model/house.js';

const model = createHouseModel(spec);
```

`createHouseModel` validates the generated model before returning it, so an
invalid outline, storey or opening throws with the failing path in the message.

The UI accepts the same object as JSON: click **Load house JSON** in the HUD and
pick a `.json` file containing the spec. **Example villa** loads the worked
example in `app/src/model/example-house.js`; **Reference** returns to the
built-in villa.

## Exact shape

```js
{
  name: 'My house',                    // optional
  units: 'm',                          // optional, default 'm'

  outline: [[x, z], ...],              // required, >= 3 points

  height: 3.2,                         // fallback storey height when storeys is omitted

  storeys: [
    {
      key: 'GF',                       // optional; default L0, L1, ...
      name: 'Ground floor',            // optional
      height: 3.2,                     // required (> 0); `h` also accepted
      z0: 0,                           // optional absolute base elevation
      edgeNames: ['South', 'East'],    // optional, one name per outline edge
      edgeKinds: ['stone', 'soil']     // optional, one kind per outline edge
    }
  ],

  openings: [
    {
      floor: 'GF',                     // required: storey key or zero-based index
      edge: 0,                         // required: outline edge index
      offset: 1.2,                     // required: metres from the edge's first point
      width: 1.8,                      // required (> 0); `w` also accepted
      height: 1.5,                     // required (> 0); `h` also accepted
      sill: 0.9,                       // optional, default 0
      kind: 'W',                       // optional: 'W' window, 'D' door
      name: 'Living room'              // optional
    }
  ],

  roof: {                              // optional; `false` removes the roof
    thickness: 0.32,                   // default 0.32
    z0: 6.4,                           // default: top of the last storey
    z1: 6.72,                          // default: z0 + thickness
    poly: [[0, 0], [12, 0], ...]       // default: the outline
  },

  topography: {                        // optional; copied to model.site
    plateau: 0.4,
    levels: [0.4, 2.0]
  },

  // Optional pass-through fields, copied into the model:
  balconies: [],
  steps: [],
  planters: [],
  columns: [],
  stair: undefined,
  terrace: undefined
}
```

## Rules that matter

- **Coordinates are `[x, z]` in metres**, with `y` up. The outline may be open
  or closed; it is normalised to a counter-clockwise ring starting at its
  lexicographically smallest point, so edge indices refer to that normalised
  ring. For a simple outline written counter-clockwise from the minimum corner,
  the indices are the order you wrote them.
- **Edge `i` runs from `outline[i]` to `outline[(i + 1) % outline.length]`.**
  `offset` is measured from the first point of that edge, not from the origin.
- **Openings must be on axis-aligned edges.** Diagonal walls are allowed, but a
  diagonal edge cannot carry an opening yet.
- **`offset + width` must fit inside the edge.** The model rejects an opening
  that runs outside its wall.
- **The sill and head must fit inside the storey.** `sill + height` should be
  less than the storey height. Give doors `sill: 0`.
- **Do not overlap openings on the same wall.** The wall cutter creates one hole
  per opening; overlapping holes can produce invalid geometry.
- **`kind: 'soil'`** uses the darker soil material for that wall; everything else
  is stone.
- Only `balconies` and `stair` are currently drawn by `buildVilla`. The other
  pass-through fields are retained in the model for later stages.

## Complete minimal spec

This is a valid one-storey, two-opening house:

```js
{
  name: 'Courtyard house',
  outline: [[0, 0], [12, 0], [12, 8], [0, 8]],
  storeys: [{ key: 'GF', name: 'Ground floor', height: 3.2 }],
  openings: [
    {
      floor: 'GF',
      edge: 0,
      offset: 1.2,
      width: 1.8,
      height: 1.5,
      sill: 0.9,
      name: 'Living room'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 4.4,
      width: 1.2,
      height: 2.4,
      kind: 'D',
      name: 'Entrance'
    }
  ],
  roof: { thickness: 0.3 }
}
```

Save that object as `house.json` and use **Load house JSON**.

## Worked example used in the app

`app/src/model/example-house.js` contains the 20-opening, two-storey
Mediterranean courtyard villa loaded by **Example villa**. It is a six-edge
L-shaped outline within the 16.3 × 8.3 m overall plan, with a ground floor at
3.1 m and a first floor at 3.0 m.
