import './styles.css';

import referenceModel from './model/reference-model.json';
import { EXAMPLE_HOUSE } from './model/example-house.js';
import { createHouseModel } from './model/house.js';
import { importReferenceModel } from './model/import.js';
import { validateModel } from './schema.js';
import { buildVilla } from './scene/villa.js';
import { createViewer } from './scene/viewer.js';

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');
let batchOpenings = params.get('batch') !== '0';

const stage = document.querySelector('#stage');
const loading = document.querySelector('#loading');
const status = document.querySelector('#status');
const houseName = document.querySelector('#house-name');
const fileInput = document.querySelector('#house-file');
const exampleButton = document.querySelector('#load-example');
const referenceButton = document.querySelector('#load-reference');

const REFERENCE_LABEL = 'Reference villa';
const REFERENCE = importReferenceModel(referenceModel);

let viewer = null;
let model = null;
let built = null;

function setStat(name, value) {
  const node = document.querySelector(`[data-stat="${name}"]`);
  if (node) node.textContent = String(value);
}

function setStatus(message, tone = 'ready') {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-ready', tone === 'ready');
  status.classList.toggle('is-error', tone === 'error');
}

function fail(error) {
  loading?.remove();
  const message = error instanceof Error ? error.message : String(error);
  setStatus(message, 'error');
  console.error(error);
}

function render(nextModel) {
  const validation = validateModel(nextModel);
  if (!validation.ok) {
    const first = validation.errors[0];
    throw new Error(
      `House model is invalid: ${first?.path ?? '$'} ${first?.message ?? 'unknown error'}`
    );
  }

  const nextBuilt = buildVilla(nextModel, { batchOpenings });
  const nextViewer = createViewer(stage, nextBuilt.group);

  viewer?.dispose();
  viewer = nextViewer;
  built = nextBuilt;
  model = nextModel;
  loading?.remove();

  const label = nextModel === REFERENCE ? REFERENCE_LABEL : nextModel.name;
  if (houseName) houseName.textContent = label;
  document.title =
    nextModel === REFERENCE
      ? 'Parti Pris Villa Builder'
      : `${label} — Parti Pris Villa Builder`;

  setStat('floors', validation.summary.floors);
  setStat('walls', validation.summary.walls);
  setStat('openings', validation.summary.openings);

  const batchNote =
    debug && batchOpenings ? ` · ${nextBuilt.windowBatches} window batches` : '';
  setStatus(
    `Rendered · ${nextBuilt.stats.openings} openings · ${nextBuilt.stats.slabs} slabs${batchNote}`
  );
}

function loadSpec(spec) {
  try {
    render(createHouseModel(spec));
  } catch (error) {
    fail(error);
  }
}

fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    const spec = JSON.parse(await file.text());
    render(createHouseModel(spec));
  } catch (error) {
    fail(error);
  } finally {
    fileInput.value = '';
  }
});

exampleButton?.addEventListener('click', () => loadSpec(EXAMPLE_HOUSE));
referenceButton?.addEventListener('click', () => {
  try {
    render(REFERENCE);
  } catch (error) {
    fail(error);
  }
});

try {
  render(REFERENCE);
} catch (error) {
  fail(error);
}

if (debug) {
  window.__PARTI_PRIS__ = {
    get model() {
      return model;
    },
    get stats() {
      return built?.stats ?? null;
    },
    get batch() {
      return batchOpenings;
    },
    info: () => viewer?.info() ?? null,
    benchmark: (frames = 60) => viewer?.benchmark(frames) ?? Promise.resolve(null),
    loadHouse(spec) {
      const next = createHouseModel(spec);
      render(next);
      return next.name;
    },
    loadExample() {
      render(createHouseModel(EXAMPLE_HOUSE));
      return EXAMPLE_HOUSE.name;
    },
    loadReference() {
      render(REFERENCE);
      return REFERENCE_LABEL;
    },
    setBatch(value) {
      batchOpenings = Boolean(value);
      if (model) render(model);
      return batchOpenings;
    }
  };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    viewer?.dispose();
    viewer = null;
  });
}
