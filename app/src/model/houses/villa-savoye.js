/**
 * Villa Savoye (Poissy, France, 1931) — simplified three-storey massing.
 *
 * Published overall dimensions are 21.5 m long × 19 m wide × 9.4 m high, with
 * three levels and horizontal ribbon windows. The real villa floats on pilotis
 * and has a roof garden; this spec keeps the envelope, the three-level stack
 * and the long horizontal glazing bands, but not the pilots or curved walls.
 *
 * Sources:
 * - French Wikipedia, 21.5 m × 19 m × 9.4 m:
 *   https://fr.wikipedia.org/wiki/Villa_Savoye
 * - Archilio, three levels and 9.40 m height:
 *   https://archilio.fr/projet/villa-savoye
 *
 * Original interpretation, not a measured survey or a copy of the drawings.
 */
export const VILLA_SAVOYE = {
  name: 'Villa Savoye — 21.5 × 19.0 m',
  units: 'm',
  outline: [
    [0, 0],
    [21.5, 0],
    [21.5, 19],
    [0, 19]
  ],
  storeys: [
    { key: 'GF', name: 'Ground floor / services', height: 3.0 },
    { key: 'FF', name: 'Piano nobile', height: 3.2 },
    { key: 'SF', name: 'Roof terrace level', height: 3.2 }
  ],
  openings: [
    // Ground floor: ribbon windows and the entrance door
    {
      floor: 'GF',
      edge: 0,
      offset: 1.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground ribbon A'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 6.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground ribbon B'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 11.0,
      width: 1.8,
      height: 2.6,
      sill: 0,
      kind: 'D',
      name: 'Entrance'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 14.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground ribbon C'
    },
    {
      floor: 'GF',
      edge: 0,
      offset: 18.8,
      width: 1.8,
      height: 1.6,
      sill: 1.2,
      name: 'Ground ribbon D'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 1.0,
      width: 3.5,
      height: 1.6,
      sill: 1.2,
      name: 'Ground east A'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 5.5,
      width: 3.5,
      height: 1.6,
      sill: 1.2,
      name: 'Ground east B'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 10.0,
      width: 3.5,
      height: 1.6,
      sill: 1.2,
      name: 'Ground east C'
    },
    {
      floor: 'GF',
      edge: 1,
      offset: 14.5,
      width: 3.5,
      height: 1.6,
      sill: 1.2,
      name: 'Ground east D'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 2.0,
      width: 5.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground north A'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 8.0,
      width: 5.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground north B'
    },
    {
      floor: 'GF',
      edge: 2,
      offset: 14.0,
      width: 5.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground north C'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 2.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground west A'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 7.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground west B'
    },
    {
      floor: 'GF',
      edge: 3,
      offset: 12.0,
      width: 4.0,
      height: 1.6,
      sill: 1.2,
      name: 'Ground west C'
    },

    // Piano nobile: the long horizontal window bands
    {
      floor: 'FF',
      edge: 0,
      offset: 1.5,
      width: 6.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile south A'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 8.5,
      width: 6.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile south B'
    },
    {
      floor: 'FF',
      edge: 0,
      offset: 15.5,
      width: 5.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile south C'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 2.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile east A'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 7.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile east B'
    },
    {
      floor: 'FF',
      edge: 1,
      offset: 12.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile east C'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 2.0,
      width: 6.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile north A'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 9.0,
      width: 6.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile north B'
    },
    {
      floor: 'FF',
      edge: 2,
      offset: 16.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile north C'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 2.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile west A'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 7.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile west B'
    },
    {
      floor: 'FF',
      edge: 3,
      offset: 12.0,
      width: 4.0,
      height: 1.5,
      sill: 1.0,
      name: 'Piano nobile west C'
    },

    // Roof-terrace storey: smaller openings under the flat roof
    {
      floor: 'SF',
      edge: 0,
      offset: 3.0,
      width: 4.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level south A'
    },
    {
      floor: 'SF',
      edge: 0,
      offset: 9.0,
      width: 3.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level south B'
    },
    {
      floor: 'SF',
      edge: 0,
      offset: 14.0,
      width: 3.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level south C'
    },
    {
      floor: 'SF',
      edge: 1,
      offset: 6.0,
      width: 2.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level east A'
    },
    {
      floor: 'SF',
      edge: 1,
      offset: 10.0,
      width: 2.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level east B'
    },
    {
      floor: 'SF',
      edge: 2,
      offset: 3.0,
      width: 4.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level north A'
    },
    {
      floor: 'SF',
      edge: 2,
      offset: 12.0,
      width: 4.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level north B'
    },
    {
      floor: 'SF',
      edge: 3,
      offset: 6.0,
      width: 2.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level west A'
    },
    {
      floor: 'SF',
      edge: 3,
      offset: 11.0,
      width: 2.0,
      height: 1.4,
      sill: 1.0,
      name: 'Roof level west B'
    }
  ],
  roof: { thickness: 0.3 }
};
