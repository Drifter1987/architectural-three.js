/**
 * Worked example: a two-storey Mediterranean courtyard villa.
 *
 * Reference plan: SpacePlanner "Mediterranean Villa"
 * (16.3 × 8.3 m overall, two floors, five bedrooms, courtyard pool).
 * The outline below keeps that overall envelope and notches the north-west
 * corner to leave a walled courtyard, so the example also exercises six edges.
 */
export const EXAMPLE_HOUSE = {
  name: 'Mediterranean Courtyard Villa — 16.3 × 8.3 m',
  units: 'm',
  outline: [
    [0, 0],
    [16.3, 0],
    [16.3, 8.3],
    [9.3, 8.3],
    [9.3, 4.6],
    [0, 4.6]
  ],
  storeys: [
    { key: 'GF', name: 'Ground floor', height: 3.1 },
    { key: 'FF', name: 'First floor', height: 3.0 }
  ],
  openings: [
    // South elevation
    {
      floor: 'GF',
      edge: 0,
      offset: 1.5,
      width: 2.0,
      height: 1.8,
      sill: 0.9,
      name: 'Living room'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 4.4,
      width: 1.3,
      height: 2.4,
      sill: 0,
      kind: 'D',
      name: 'Entrance'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 6.6,
      width: 2.0,
      height: 1.8,
      sill: 0.9,
      name: 'Dining room'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 12.8,
      width: 2.6,
      height: 1.7,
      sill: 0.8,
      name: 'Kitchen'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 2.0,
      width: 1.6,
      height: 1.5,
      sill: 0.9,
      name: 'Bedroom 2'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 7.6,
      width: 2.2,
      height: 1.8,
      sill: 0.9,
      name: 'Master bedroom'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 13.6,
      width: 1.8,
      height: 1.5,
      sill: 0.9,
      name: 'Office'
    },

    // East elevation
    {
      floor: 'GF',
      edge: 1,
      offset: 2.0,
      width: 1.4,
      height: 1.5,
      sill: 0.9,
      name: 'Study'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 5.2,
      width: 1.4,
      height: 1.5,
      sill: 0.9,
      name: 'Guest room'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 2.4,
      width: 1.4,
      height: 1.5,
      sill: 0.9,
      name: 'Bedroom 5'
    },

    // North elevation, beside the courtyard
    {
      floor: 'GF',
      edge: 2,
      offset: 1.6,
      width: 1.2,
      height: 2.3,
      sill: 0,
      kind: 'D',
      name: 'Courtyard door'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 3.8,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Courtyard window'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 4.4,
      width: 1.8,
      height: 1.5,
      sill: 0.9,
      name: 'Bedroom 3'
    },

    // Courtyard-facing west wall of the north wing
    {
      floor: 'GF',
      edge: 3,
      offset: 1.1,
      width: 1.2,
      height: 1.5,
      sill: 0.9,
      name: 'Hall window'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 1.1,
      width: 1.2,
      height: 1.5,
      sill: 0.9,
      name: 'Landing window'
    },

    // South-facing courtyard wall
    {
      floor: 'GF',
      edge: 4,
      offset: 2.0,
      width: 2.4,
      height: 1.8,
      sill: 0.9,
      name: 'Courtyard glazing A'
    },
    {
      floor: 'GF',
      edge: 4,
      offset: 5.2,
      width: 2.4,
      height: 1.8,
      sill: 0.9,
      name: 'Courtyard glazing B'
    },
    {
      floor: 'FF',
      edge: 4,
      offset: 2.4,
      width: 1.6,
      height: 1.5,
      sill: 0.9,
      name: 'Bedroom 4'
    },

    // West elevation
    {
      floor: 'GF',
      edge: 5,
      offset: 1.3,
      width: 1.2,
      height: 1.5,
      sill: 0.9,
      name: 'Kitchen side'
    },
    {
      floor: 'FF',
      edge: 5,
      offset: 1.3,
      width: 1.0,
      height: 1.4,
      sill: 0.9,
      name: 'Bathroom'
    }
  ],
  roof: { thickness: 0.32 },
  topography: {
    plateau: 0.4,
    levels: [0.4, 2.0],
    note: 'Courtyard terrace at the west notch'
  }
};
