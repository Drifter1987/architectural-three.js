/**
 * Rietveld Schröder House (Utrecht, 1924) — simplified.
 *
 * UNESCO records the house as about 7 m × 9 m with two floors. This spec uses
 * a 9 m × 7 m envelope, two 3 m storeys, the corner-window rhythm and a small
 * upper balcony on the street elevation.
 *
 * Sources:
 * - UNESCO nomination, "about 7m x 9m", two floors:
 *   https://whc.unesco.org/document/154710
 * - Rietveld Schröder House, official house history:
 *   https://www.rietveldschroderhuis.nl/en
 *
 * Original interpretation, not a measured survey or a copy of the drawings.
 */
export const RIETVELD_SCHRODER_HOUSE = {
  name: 'Rietveld Schröder House — 9.0 × 7.0 m',
  units: 'm',
  outline: [
    [0, 0],
    [9, 0],
    [9, 7],
    [0, 7]
  ],
  storeys: [
    { key: 'GF', name: 'Ground floor', height: 3.0 },
    { key: 'FF', name: 'Upper living floor', height: 3.0 }
  ],
  openings: [
    // Ground floor: front door and street windows
    {
      floor: 'GF',
      edge: 0,
      offset: 0.6,
      width: 1.0,
      height: 2.3,
      sill: 0,
      kind: 'D',
      name: 'Front door'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 2.2,
      width: 2.2,
      height: 1.6,
      sill: 1.0,
      name: 'Ground south A'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 5.2,
      width: 2.4,
      height: 1.6,
      sill: 1.0,
      name: 'Ground south B'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 0.8,
      width: 1.4,
      height: 1.6,
      sill: 1.0,
      name: 'Ground east A'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 3.6,
      width: 2.2,
      height: 1.6,
      sill: 1.0,
      name: 'Ground east B'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 1.0,
      width: 2.2,
      height: 1.6,
      sill: 1.0,
      name: 'Ground north A'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 3.8,
      width: 1.0,
      height: 2.3,
      sill: 0,
      kind: 'D',
      name: 'Garden door'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 5.6,
      width: 2.2,
      height: 1.6,
      sill: 1.0,
      name: 'Ground north B'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 1.0,
      width: 1.6,
      height: 1.6,
      sill: 1.0,
      name: 'Ground west A'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 4.0,
      width: 2.0,
      height: 1.6,
      sill: 1.0,
      name: 'Ground west B'
    },

    // Upper floor: flexible open living room with a balcony door
    {
      floor: 'FF',
      edge: 0,
      offset: 0.6,
      width: 2.2,
      height: 1.4,
      sill: 1.0,
      name: 'Upper south A'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 3.2,
      width: 2.2,
      height: 1.4,
      sill: 1.0,
      name: 'Upper south B'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 6.0,
      width: 2.4,
      height: 1.4,
      sill: 1.0,
      name: 'Upper south C'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 0.8,
      width: 1.0,
      height: 2.2,
      sill: 0,
      kind: 'D',
      name: 'Balcony door'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 3.0,
      width: 1.6,
      height: 1.4,
      sill: 1.0,
      name: 'Upper east A'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 5.2,
      width: 1.4,
      height: 1.4,
      sill: 1.0,
      name: 'Upper east B'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 1.0,
      width: 2.4,
      height: 1.4,
      sill: 1.0,
      name: 'Upper north A'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 4.4,
      width: 2.4,
      height: 1.4,
      sill: 1.0,
      name: 'Upper north B'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 7.2,
      width: 1.4,
      height: 1.4,
      sill: 1.0,
      name: 'Upper north C'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 1.0,
      width: 1.6,
      height: 1.4,
      sill: 1.0,
      name: 'Upper west A'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 4.0,
      width: 2.2,
      height: 1.4,
      sill: 1.0,
      name: 'Upper west B'
    }
  ],
  balconies: [
    {
      floor: 'FF',
      name: 'Street balcony',
      z: 3.0,
      slab: true,
      poly: [
        [9, 0.9],
        [10.1, 0.9],
        [10.1, 2.9],
        [9, 2.9]
      ],
      par: [
        [10.1, 0.9, 10.1, 2.9],
        [10.1, 2.9, 9, 2.9],
        [9, 0.9, 10.1, 0.9]
      ]
    }
  ],
  roof: { thickness: 0.25 }
};
