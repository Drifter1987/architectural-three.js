import './styles.css';

import referenceModel from './model/reference-model.json';
import { importReferenceModel } from './model/import.js';
import { validateModel } from './schema.js';
import { buildVilla } from './scene/villa.js';
import { createViewer } from './scene/viewer.js';

const stage = document.querySelector('#stage');
const loading = document.querySelector('#loading');
const status = document.querySelector('#status');

function setStat(name, value) {
  const node = document.querySelector(`[data-stat="${name}"]`);
  if (node) node.textContent = String(value);
}

function fail(message) {
  loading?.remove();
  if (status) {
    status.textContent = message;
    status.classList.add('is-error');
  }
  console.error(message);
}

let disposeViewer = null;

try {
  const model = importReferenceModel(referenceModel);
  const validation = validateModel(model);
  if (!validation.ok) {
    throw new Error(
      `Reference model is invalid: ${validation.errors[0]?.path} ${validation.errors[0]?.message}`
    );
  }

  const { group, stats } = buildVilla(model);
  disposeViewer = createViewer(stage, group);
  loading?.remove();

  setStat('floors', validation.summary.floors);
  setStat('walls', validation.summary.walls);
  setStat('openings', validation.summary.openings);
  if (status) {
    status.textContent = `Rendered · ${stats.openings} openings · ${stats.slabs} slabs`;
    status.classList.add('is-ready');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeViewer?.();
    disposeViewer = null;
  });
}
