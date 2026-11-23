/**
 * Farnsworth House (Plano, Illinois, 1951) — simplified for this builder.
 *
 * The enclosed plan is about 55 ft 8 in × 29 ft 4 in (17.0 × 8.9 m), raised
 * 1.6 m above the Fox River floodplain. The real house is a single glazed room;
 * this spec keeps the raised floor and wraps the envelope in tall glazing.
 *
 * Sources:
 * - HABS IL-1105, overall dimensions and floor height:
 *   https://tile.loc.gov/storage-services/master/pnp/habshaer/il/il0300/il0323/data/il0323data.pdf
 * - Columbia University, 77 ft × 29 ft upper slab on a 1.6 m raised plane:
 *   http://www.columbia.edu/cu/gsapp/BT/GATEWAY/FARNSWTH/gen.html
 *
 * Original interpretation, not a measured survey or a copy of the drawings.
 */
export const FARNSWORTH_HOUSE = {
  name: 'Farnsworth House — 17.0 × 8.9 m',
  units: 'm',
  outline: [
    [0, 0],
    [17, 0],
    [17, 8.9],
    [0, 8.9]
  ],
  storeys: [
    { key: 'GF', name: 'Raised living floor', height: 3.2, z0: 1.6 }
  ],
  openings: [
    // South glazing, with the stair door centred on the terrace
    {
      floor: 'GF',
      edge: 0,
      offset: 0.8,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'South glazing A'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 4.2,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'South glazing B'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 7.6,
      width: 2.2,
      height: 2.9,
      sill: 0,
      kind: 'D',
      name: 'Terrace door'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 10.6,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'South glazing C'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 14.0,
      width: 2.4,
      height: 2.85,
      sill: 0.05,
      name: 'South glazing D'
    },

    // Short east and west ends
    {
      floor: 'GF',
      edge: 1,
      offset: 0.8,
      width: 3.2,
      height: 2.85,
      sill: 0.05,
      name: 'East glazing A'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 4.8,
      width: 3.2,
      height: 2.85,
      sill: 0.05,
      name: 'East glazing B'
    },

    // North glazing, offsets run from the east corner back to the west
    {
      floor: 'GF',
      edge: 2,
      offset: 0.8,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'North glazing A'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 4.2,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'North glazing B'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 7.8,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'North glazing C'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 11.4,
      width: 2.8,
      height: 2.85,
      sill: 0.05,
      name: 'North glazing D'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 14.4,
      width: 2.0,
      height: 2.85,
      sill: 0.05,
      name: 'North glazing E'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 0.8,
      width: 3.2,
      height: 2.85,
      sill: 0.05,
      name: 'West glazing A'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 4.8,
      width: 3.2,
      height: 2.85,
      sill: 0.05,
      name: 'West glazing B'
    }
  ],
  roof: { thickness: 0.3 }
};
