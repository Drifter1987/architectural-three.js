/**
 * Eames House / Case Study House No. 8 (Los Angeles, 1949) — simplified.
 *
 * The residence is an eight-bay, two-storey steel frame. HABS gives the
 * overall house envelope as 59 ft × 20 ft 10 in (18.0 × 6.35 m); the enclosed
 * residence is 51 ft long, with a roofed exterior bay at the south end. This
 * spec keeps the overall envelope, two storeys and the regular glazing grid.
 *
 * Sources:
 * - HABS CA-2903, written data and overall dimensions:
 *   https://tile.loc.gov/storage-services/master/pnp/habshaer/ca/ca4100/ca4169/data/ca4169data.pdf
 * - Library of Congress, measured drawings:
 *   https://www.loc.gov/resource/hhh.ca4169.sheet/?sp=2
 *
 * Original interpretation, not a measured survey or a copy of the drawings.
 */
export const EAMES_HOUSE = {
  name: 'Eames House — 18.0 × 6.35 m',
  units: 'm',
  outline: [
    [0, 0],
    [18, 0],
    [18, 6.35],
    [0, 6.35]
  ],
  storeys: [
    { key: 'GF', name: 'Ground floor', height: 2.8 },
    { key: 'FF', name: 'Upper floor', height: 2.8 }
  ],
  openings: [
    // South elevation: entry door and the regular living-room grid
    {
      floor: 'GF',
      edge: 0,
      offset: 0.8,
      width: 1.6,
      height: 2.4,
      sill: 0,
      kind: 'D',
      name: 'Entry door'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 3.2,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 1'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 5.4,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 2'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 7.6,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 3'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 9.8,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 4'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 12.0,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 5'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 14.2,
      width: 1.6,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 6'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 16.4,
      width: 1.2,
      height: 2.0,
      sill: 0.5,
      name: 'South bay 7'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 0.8,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 1'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 3.2,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 2'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 5.4,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 3'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 7.6,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 4'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 9.8,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 5'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 12.0,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 6'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 14.2,
      width: 1.6,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 7'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 16.4,
      width: 1.2,
      height: 1.6,
      sill: 0.9,
      name: 'Upper south bay 8'
    },

    // Short east and west ends
    {
      floor: 'GF',
      edge: 1,
      offset: 0.8,
      width: 1.8,
      height: 2.0,
      sill: 0.5,
      name: 'East bay A'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 3.5,
      width: 2.0,
      height: 2.0,
      sill: 0.5,
      name: 'East bay B'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 0.8,
      width: 1.8,
      height: 1.6,
      sill: 0.9,
      name: 'Upper east bay A'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 3.5,
      width: 2.0,
      height: 1.6,
      sill: 0.9,
      name: 'Upper east bay B'
    },

    // North elevation, facing the hillside
    {
      floor: 'GF',
      edge: 2,
      offset: 0.8,
      width: 2.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay A'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 3.8,
      width: 2.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay B'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 6.8,
      width: 2.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay C'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 9.8,
      width: 2.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay D'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 12.8,
      width: 2.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay E'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 15.2,
      width: 1.4,
      height: 2.0,
      sill: 0.5,
      name: 'North bay F'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 0.8,
      width: 2.4,
      height: 1.6,
      sill: 0.9,
      name: 'Upper north bay A'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 4.0,
      width: 2.4,
      height: 1.6,
      sill: 0.9,
      name: 'Upper north bay B'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 7.2,
      width: 2.4,
      height: 1.6,
      sill: 0.9,
      name: 'Upper north bay C'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 10.4,
      width: 2.4,
      height: 1.6,
      sill: 0.9,
      name: 'Upper north bay D'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 13.6,
      width: 2.4,
      height: 1.6,
      sill: 0.9,
      name: 'Upper north bay E'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 0.8,
      width: 1.8,
      height: 2.0,
      sill: 0.5,
      name: 'West bay A'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 3.5,
      width: 2.0,
      height: 2.0,
      sill: 0.5,
      name: 'West bay B'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 0.8,
      width: 1.8,
      height: 1.6,
      sill: 0.9,
      name: 'Upper west bay A'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 3.5,
      width: 2.0,
      height: 1.6,
      sill: 0.9,
      name: 'Upper west bay B'
    }
  ],
  roof: { thickness: 0.22 }
};
