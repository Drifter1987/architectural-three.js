import { EAMES_HOUSE } from './eames-house.js';
import { FARNSWORTH_HOUSE } from './farnsworth-house.js';
import { GLASS_HOUSE } from './glass-house.js';
import { RIETVELD_SCHRODER_HOUSE } from './rietveld-schroder-house.js';
import { VILLA_SAVOYE } from './villa-savoye.js';

/**
 * Five documented houses converted to the app's outline/storey/opening spec.
 * Dimensions come from the sources in each file; the facade arrangements are
 * original interpretations rather than reproductions of the drawings.
 */
export const HOUSE_SAMPLES = [
  {
    key: 'farnsworth',
    label: 'Farnsworth House · 1951 · Mies',
    spec: FARNSWORTH_HOUSE
  },
  {
    key: 'glass-house',
    label: 'Glass House · 1949 · Johnson',
    spec: GLASS_HOUSE
  },
  {
    key: 'eames',
    label: 'Eames House · 1949 · Eames',
    spec: EAMES_HOUSE
  },
  {
    key: 'savoye',
    label: 'Villa Savoye · 1931 · Le Corbusier',
    spec: VILLA_SAVOYE
  },
  {
    key: 'schroder',
    label: 'Rietveld Schröder House · 1924 · Rietveld',
    spec: RIETVELD_SCHRODER_HOUSE
  }
];

export const SAMPLE_HOUSES_BY_KEY = new Map(
  HOUSE_SAMPLES.map((sample) => [sample.key, sample])
);
