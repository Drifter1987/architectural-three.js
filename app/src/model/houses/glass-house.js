/**
 * Philip Johnson Glass House (New Canaan, Connecticut, 1949) — simplified.
 *
 * The pavilion is 55 ft × 33 ft (16.8 × 10.1 m), one storey, with a glass
 * door centred on each facade. The app builds stone walls, so this spec keeps
 * the footprint, storey height and four centred doors, and fills the walls
 * with tall glazing bays.
 *
 * Sources:
 * - National Park Service, 32 ft × 56 ft and 10 ft 6 in roof height:
 *   https://npgallery.nps.gov/NRHP/GetAsset/NHLS/97000341_text
 * - The Glass House, 55 ft × 33 ft, 1,815 sq ft:
 *   https://theglasshouse.org/explore/the-glass-house/overview
 *
 * Original interpretation, not a measured survey or a copy of the drawings.
 */
export const GLASS_HOUSE = {
  name: 'Glass House — 16.8 × 10.1 m',
  units: 'm',
  outline: [
    [0, 0],
    [16.8, 0],
    [16.8, 10.1],
    [0, 10.1]
  ],
  storeys: [{ key: 'GF', name: 'Glass pavilion', height: 3.2 }],
  openings: [
    // South elevation, door centred between two glazing bays
    {
      floor: 'GF',
      edge: 0,
      offset: 0.9,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'South glazing A'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 4.5,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'South glazing B'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 7.8,
      width: 1.2,
      height: 2.8,
      sill: 0,
      kind: 'D',
      name: 'South glass door'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 9.3,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'South glazing C'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 12.9,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'South glazing D'
    },

    // East elevation
    {
      floor: 'GF',
      edge: 1,
      offset: 1.0,
      width: 2.4,
      height: 2.8,
      sill: 0.05,
      name: 'East glazing A'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 4.45,
      width: 1.2,
      height: 2.8,
      sill: 0,
      kind: 'D',
      name: 'East glass door'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 6.7,
      width: 2.4,
      height: 2.8,
      sill: 0.05,
      name: 'East glazing B'
    },

    // North elevation, mirrored around the centred door
    {
      floor: 'GF',
      edge: 2,
      offset: 0.9,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'North glazing A'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 4.5,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'North glazing B'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 7.8,
      width: 1.2,
      height: 2.8,
      sill: 0,
      kind: 'D',
      name: 'North glass door'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 9.3,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'North glazing C'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 12.9,
      width: 3.0,
      height: 2.8,
      sill: 0.05,
      name: 'North glazing D'
    },

    // West elevation
    {
      floor: 'GF',
      edge: 3,
      offset: 1.0,
      width: 2.4,
      height: 2.8,
      sill: 0.05,
      name: 'West glazing A'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 4.45,
      width: 1.2,
      height: 2.8,
      sill: 0,
      kind: 'D',
      name: 'West glass door'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 6.7,
      width: 2.4,
      height: 2.8,
      sill: 0.05,
      name: 'West glazing B'
    }
  ],
  roof: { thickness: 0.25 }
};
