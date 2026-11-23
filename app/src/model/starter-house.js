/**
 * Starting point for the in-app house editor. A valid two-storey, six-edge
 * generated house; the reference villa remains the app's read-only default.
 */
export const STARTER_HOUSE = {
  name: 'Editable villa',
  units: 'm',
  outline: [
    [0, 0],
    [14, 0],
    [14, 9],
    [8, 9],
    [8, 5],
    [0, 5]
  ],
  storeys: [
    { key: 'GF', name: 'Ground floor', height: 3.2 },
    { key: 'FF', name: 'First floor', height: 3.0 }
  ],
  openings: [
    {
      floor: 'GF',
      edge: 0,
      offset: 1.5,
      width: 2.2,
      height: 1.7,
      sill: 0.9,
      kind: 'W',
      name: 'Living room'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 9.6,
      width: 1.6,
      height: 2.4,
      sill: 0,
      kind: 'D',
      name: 'Entrance'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 2.4,
      width: 1.6,
      height: 1.5,
      sill: 0.9,
      kind: 'W',
      name: 'Kitchen'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 2.0,
      width: 1.8,
      height: 1.5,
      sill: 0.9,
      kind: 'W',
      name: 'Bedroom 1'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 9.6,
      width: 1.8,
      height: 1.5,
      sill: 0.9,
      kind: 'W',
      name: 'Bedroom 2'
    },
    {
      floor: 'FF',
      edge: 4,
      offset: 2.8,
      width: 1.4,
      height: 1.5,
      sill: 0.9,
      kind: 'W',
      name: 'Landing'
    }
  ],
  roof: { thickness: 0.32 }
};
