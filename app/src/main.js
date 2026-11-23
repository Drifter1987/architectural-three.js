import './styles.css';
import { MODEL_SCHEMA_VERSION, validateModel } from './schema.js';

const fixture = {
  version: MODEL_SCHEMA_VERSION,
  name: 'Phase 4 shell fixture',
  floors: [
    {
      key: 'L0',
      name: 'Shell storey',
      z0: 0,
      h: 3.2,
      edges: [
        {
          a: [0, 0],
          b: [4, 0],
          kind: 'stone',
          name: 'Shell wall',
          openings: [0]
        }
      ]
    }
  ],
  openings: [
    {
      floor: 'L0',
      edge: 0,
      axis: 'y',
      face: 0,
      out: 1,
      s0: 1,
      s1: 2.2,
      sill: 0.9,
      kind: 'W',
      w: 1.2,
      h: 1.5,
      name: 'Shell opening'
    }
  ],
  balconies: [],
  steps: [],
  planters: [],
  columns: [],
  check: []
};

const result = validateModel(fixture);
const status = document.querySelector('#schema-status');
const detail = document.querySelector('#schema-detail');

if (result.ok) {
  status.textContent = `schema v${result.version} ok`;
  status.classList.add('ok');
  detail.textContent =
    `${result.summary.walls} wall and ${result.summary.openings} opening validated before geometry.`;
} else {
  status.textContent = 'validator failed';
  status.classList.add('bad');
  detail.textContent = result.errors
    .map((error) => `${error.path}: ${error.message}`)
    .join(' · ');
}

document.documentElement.dataset.phase = '4';
document.documentElement.dataset.schema = result.ok ? 'ok' : 'failed';
