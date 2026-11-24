import './styles.css';

import referenceModel from './model/reference-model.json';
import { EXAMPLE_HOUSE } from './model/example-house.js';
import { createHouseModel } from './model/house.js';
import {
  HOUSE_SAMPLES,
  SAMPLE_HOUSES_BY_KEY
} from './model/houses/index.js';
import { importReferenceModel } from './model/import.js';
import { STARTER_HOUSE } from './model/starter-house.js';
import { validateModel } from './schema.js';
import {
  DEFAULT_MATERIAL_STATE,
  FRAME_STYLES,
  JOINT_STYLES,
  LOOK_PRESETS,
  ROOF_STYLES,
  STONE_FINISHES,
  STONE_TONES,
  applyMaterialState,
  resolveMaterialState
} from './scene/materials.js';
import { buildVilla } from './scene/villa.js';
import { createViewer } from './scene/viewer.js';
import { createHouseEditor } from './ui/house-editor.js';

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');
let batchOpenings = params.get('batch') !== '0';

const stage = document.querySelector('#stage');
const loading = document.querySelector('#loading');
const status = document.querySelector('#status');
const houseName = document.querySelector('#house-name');
const fileInput = document.querySelector('#house-file');
const sampleSelect = document.querySelector('#house-sample');
const exampleButton = document.querySelector('#load-example');
const referenceButton = document.querySelector('#load-reference');
const openEditorButton = document.querySelector('#open-editor');

const studio = document.querySelector('#studio');
const openStudioButton = document.querySelector('#open-studio');
const closeStudioButton = document.querySelector('#close-studio');
const resetViewButton = document.querySelector('#reset-view');
const autoRotateButton = document.querySelector('#auto-rotate');
const finishName = document.querySelector('#finish-name');

const finishOptions = document.querySelector('#finish-options');
const toneOptions = document.querySelector('#tone-options');
const jointOptions = document.querySelector('#joint-options');
const frameOptions = document.querySelector('#frame-options');
const roofOptions = document.querySelector('#roof-options');
const lookOptions = document.querySelector('#look-options');
const viewOptions = document.querySelector('#view-options');
const lightOptions = document.querySelector('#light-options');

const REFERENCE_LABEL = 'Reference villa';
const REFERENCE = importReferenceModel(referenceModel);

const VIEW_LABELS = {
  iso: 'Iso',
  front: 'Front',
  side: 'Side',
  back: 'Back',
  street: 'Street',
  top: 'Top'
};

const LIGHT_LABELS = {
  morning: 'Morning',
  noon: 'Noon',
  afternoon: 'Afternoon',
  sunset: 'Sunset'
};

let viewer = null;
let model = null;
let built = null;
let lastSpec = null;
let activeSample = null;

let materialState = { ...DEFAULT_MATERIAL_STATE };
let viewState = 'iso';
let lightState = 'afternoon';
let autoRotate = false;

const materialButtons = {
  finish: [],
  tone: [],
  joint: [],
  frame: [],
  roof: []
};
const finishThumbs = [];
const lookButtons = [];
const viewButtons = [];
const lightButtons = [];

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

function rgb(color) {
  return `rgb(${color.join(', ')})`;
}

function optionButton(label, value, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.value = value;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function buildMaterialChips(container, options, group) {
  for (const option of options) {
    const button = optionButton(option.name, option.key, () =>
      updateMaterial({ [group]: option.key })
    );
    materialButtons[group].push(button);
    container.append(button);
  }
}

function buildStudio() {
  for (const preset of LOOK_PRESETS) {
    const button = optionButton(preset.name, preset.key, () =>
      applyLook(preset.key)
    );
    lookButtons.push({ button, preset });
    lookOptions.append(button);
  }

  for (const finish of STONE_FINISHES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'finish-option';
    button.dataset.value = finish.key;
    button.setAttribute('aria-label', `${finish.name} — ${finish.note}`);
    button.addEventListener('click', () =>
      updateMaterial({ finish: finish.key })
    );

    const thumb = document.createElement('span');
    thumb.className = 'finish-thumb';
    thumb.dataset.style = finish.style;
    thumb.setAttribute('aria-hidden', 'true');
    finishThumbs.push(thumb);

    const copy = document.createElement('span');
    copy.className = 'finish-copy';
    const name = document.createElement('b');
    name.textContent = finish.name;
    const note = document.createElement('small');
    note.textContent = finish.note;
    copy.append(name, note);

    button.append(thumb, copy);
    materialButtons.finish.push(button);
    finishOptions.append(button);
  }

  for (const tone of STONE_TONES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tone-option';
    button.dataset.value = tone.key;
    button.addEventListener('click', () => updateMaterial({ tone: tone.key }));

    const dot = document.createElement('span');
    dot.className = 'tone-dot';
    dot.style.background = tone.alt
      ? `linear-gradient(135deg, ${rgb(tone.base)} 50%, ${rgb(tone.alt)} 50%)`
      : rgb(tone.base);
    dot.setAttribute('aria-hidden', 'true');
    button.append(dot, document.createTextNode(tone.name));
    materialButtons.tone.push(button);
    toneOptions.append(button);
  }

  buildMaterialChips(jointOptions, JOINT_STYLES, 'joint');
  buildMaterialChips(frameOptions, FRAME_STYLES, 'frame');
  buildMaterialChips(roofOptions, ROOF_STYLES, 'roof');

  for (const [key, label] of Object.entries(VIEW_LABELS)) {
    const button = optionButton(label, key, () => selectView(key));
    viewButtons.push({ button, key });
    viewOptions.append(button);
  }

  for (const [key, label] of Object.entries(LIGHT_LABELS)) {
    const button = optionButton(label, key, () => selectLight(key));
    lightButtons.push({ button, key });
    lightOptions.append(button);
  }
}

function refreshThumbs(tone) {
  for (const thumb of finishThumbs) {
    thumb.style.setProperty('--stone-tone', rgb(tone.base));
  }
}

function syncControls() {
  const resolved = resolveMaterialState(materialState);

  for (const [group, buttons] of Object.entries(materialButtons)) {
    for (const button of buttons) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.value === materialState[group])
      );
    }
  }

  for (const { button, preset } of lookButtons) {
    const active = Object.entries(preset.state).every(
      ([key, value]) => materialState[key] === value
    );
    button.setAttribute('aria-pressed', String(active));
  }

  for (const { button, key } of viewButtons) {
    button.setAttribute('aria-pressed', String(key === viewState));
  }

  for (const { button, key } of lightButtons) {
    button.setAttribute('aria-pressed', String(key === lightState));
  }

  if (finishName) finishName.textContent = resolved.finish.name;
  refreshThumbs(resolved.tone);
  autoRotateButton?.setAttribute('aria-checked', String(autoRotate));
}

function applyCurrentMaterial() {
  if (!built) return;
  applyMaterialState(built.materials, materialState);
  viewer?.invalidate();
}

function materialStatus() {
  const { finish, tone, joint } = resolveMaterialState(materialState);
  return `Stone · ${finish.name} · ${tone.name} · ${joint.name}`;
}

function updateMaterial(patch) {
  materialState = resolveMaterialState({
    ...materialState,
    ...patch
  }).state;
  applyCurrentMaterial();
  syncControls();
  setStatus(materialStatus());
}

function applyLook(key) {
  const preset = LOOK_PRESETS.find((entry) => entry.key === key);
  if (!preset) return;
  materialState = { ...preset.state };
  applyCurrentMaterial();
  syncControls();
  setStatus(`Look · ${preset.name}`);
}

function selectView(key) {
  if (!VIEW_LABELS[key]) key = 'iso';
  viewState = key;
  viewer?.setView(key);
  syncControls();
  setStatus(`View · ${VIEW_LABELS[key]}`);
}

function selectLight(key) {
  if (!LIGHT_LABELS[key]) key = 'afternoon';
  lightState = key;
  viewer?.setLight(key);
  syncControls();
  setStatus(`Sun · ${LIGHT_LABELS[key]}`);
}

function toggleAutoRotate() {
  autoRotate = !autoRotate;
  viewer?.setAutoRotate(autoRotate);
  syncControls();
  setStatus(autoRotate ? 'Auto-orbit on' : 'Auto-orbit off');
}

function buildSamplePicker() {
  if (!sampleSelect) return;
  for (const sample of HOUSE_SAMPLES) {
    const option = document.createElement('option');
    option.value = sample.key;
    option.textContent = sample.label;
    sampleSelect.append(option);
  }
}

function syncSamplePicker() {
  if (sampleSelect) sampleSelect.value = activeSample ?? '';
}

function setStudioOpen(open, { focus = true } = {}) {
  if (!studio || !openStudioButton) return;
  studio.hidden = !open;
  openStudioButton.setAttribute('aria-expanded', String(open));
  if (!focus) return;
  if (open) {
    closeStudioButton?.focus();
  } else {
    openStudioButton.focus();
  }
}

function editorNote() {
  if (model === REFERENCE) {
    return lastSpec
      ? 'Reference villa is read-only. This continues your last generated house spec.'
      : 'Reference villa is read-only. This form builds a generated house; Apply switches the view.';
  }
  return `Editing ${model?.name ?? 'house spec'}. Apply rebuilds the house.`;
}

const houseEditor = createHouseEditor({
  onApply(spec, next) {
    activeSample = null;
    render(next);
    lastSpec = spec;
    openEditorButton?.focus();
  },
  onRequestClose() {
    setEditorOpen(false);
  }
});

function setEditorOpen(open, { focus = true } = {}) {
  if (!houseEditor || !openEditorButton) return;
  if (open) {
    setStudioOpen(false, { focus: false });
    openEditorButton.setAttribute('aria-expanded', 'true');
    houseEditor.open(lastSpec ?? STARTER_HOUSE, editorNote());
    return;
  }
  openEditorButton.setAttribute('aria-expanded', 'false');
  houseEditor.close();
  if (focus) openEditorButton.focus();
}

function render(nextModel) {
  const validation = validateModel(nextModel);
  if (!validation.ok) {
    const first = validation.errors[0];
    throw new Error(
      `House model is invalid: ${first?.path ?? '$'} ${first?.message ?? 'unknown error'}`
    );
  }

  const nextBuilt = buildVilla(nextModel, {
    batchOpenings,
    materialState
  });
  const nextViewer = createViewer(stage, nextBuilt.group);

  viewer?.dispose();
  viewer = nextViewer;
  built = nextBuilt;
  model = nextModel;
  loading?.remove();

  if (houseEditor?.isOpen()) setEditorOpen(false, { focus: false });

  viewer.setView(viewState, { animate: false });
  viewer.setLight(lightState);
  viewer.setAutoRotate(autoRotate);
  syncControls();

  const label = nextModel === REFERENCE ? REFERENCE_LABEL : nextModel.name;
  if (houseName) houseName.textContent = label;
  document.title =
    nextModel === REFERENCE
      ? 'Parti Pris Villa Builder'
      : `${label} — Parti Pris Villa Builder`;

  setStat('floors', validation.summary.floors);
  setStat('walls', validation.summary.walls);
  setStat('openings', validation.summary.openings);
  syncSamplePicker();

  const batchNote =
    debug && batchOpenings ? ` · ${nextBuilt.windowBatches} window batches` : '';
  setStatus(
    `Rendered · ${nextBuilt.stats.openings} openings · ${nextBuilt.stats.slabs} slabs${batchNote}`
  );
}

function loadSpec(spec, sampleKey = null) {
  try {
    const next = createHouseModel(spec);
    activeSample = sampleKey;
    lastSpec = spec;
    render(next);
    return true;
  } catch (error) {
    fail(error);
    syncSamplePicker();
    return false;
  }
}

function loadHouseSample(key) {
  const sample = SAMPLE_HOUSES_BY_KEY.get(key);
  if (!sample) {
    syncSamplePicker();
    return null;
  }
  return loadSpec(sample.spec, sample.key) ? sample.spec.name : null;
}

buildStudio();
buildSamplePicker();
syncControls();
syncSamplePicker();

fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    const spec = JSON.parse(await file.text());
    loadSpec(spec);
  } catch (error) {
    fail(error);
  } finally {
    fileInput.value = '';
  }
});

sampleSelect?.addEventListener('change', () => {
  if (sampleSelect.value) loadHouseSample(sampleSelect.value);
});

exampleButton?.addEventListener('click', () => loadSpec(EXAMPLE_HOUSE));
referenceButton?.addEventListener('click', () => {
  try {
    activeSample = null;
    render(REFERENCE);
  } catch (error) {
    fail(error);
  }
});

openStudioButton?.addEventListener('click', () => {
  const open = studio?.hidden ?? true;
  if (open) setEditorOpen(false, { focus: false });
  setStudioOpen(open);
});
openEditorButton?.addEventListener('click', () => {
  setEditorOpen(!houseEditor.isOpen());
});
closeStudioButton?.addEventListener('click', () => setStudioOpen(false));
resetViewButton?.addEventListener('click', () => selectView('iso'));
autoRotateButton?.addEventListener('click', toggleAutoRotate);

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (houseEditor.isOpen()) {
    setEditorOpen(false);
    return;
  }
  if (studio && !studio.hidden) setStudioOpen(false);
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
    get material() {
      return { ...materialState };
    },
    get stoneInfo() {
      const wall = built?.materials?.wall;
      return {
        map: wall?.map?.constructor?.name ?? null,
        normal: wall?.normalMap?.constructor?.name ?? null,
        bump: wall?.bumpMap?.constructor?.name ?? null,
        mapSize: wall?.map?.image?.width ?? null,
        normalScale: wall?.normalScale?.toArray() ?? null
      };
    },
    get view() {
      return viewState;
    },
    get light() {
      return lightState;
    },
    get autoRotate() {
      return autoRotate;
    },
    get editorOpen() {
      return houseEditor.isOpen();
    },
    get lastSpec() {
      return lastSpec ? structuredClone(lastSpec) : null;
    },
    get camera() {
      return viewer?.camera ?? null;
    },
    info: () => viewer?.info() ?? null,
    benchmark: (frames = 60) => viewer?.benchmark(frames) ?? Promise.resolve(null),
    get samples() {
      return HOUSE_SAMPLES.map(({ key, label }) => ({ key, label }));
    },
    get sampleKey() {
      return activeSample;
    },
    loadHouse(spec) {
      const next = createHouseModel(spec);
      activeSample = null;
      lastSpec = structuredClone(spec);
      render(next);
      return next.name;
    },
    loadSample(key) {
      return loadHouseSample(key);
    },
    loadExample() {
      activeSample = null;
      lastSpec = structuredClone(EXAMPLE_HOUSE);
      render(createHouseModel(EXAMPLE_HOUSE));
      return EXAMPLE_HOUSE.name;
    },
    openEditor(value = true) {
      setEditorOpen(Boolean(value));
      return houseEditor.isOpen();
    },
    applyEditor(spec) {
      const next = createHouseModel(spec);
      activeSample = null;
      lastSpec = structuredClone(spec);
      render(next);
      return next.name;
    },
    loadReference() {
      activeSample = null;
      render(REFERENCE);
      return REFERENCE_LABEL;
    },
    setBatch(value) {
      batchOpenings = Boolean(value);
      if (model) render(model);
      return batchOpenings;
    },
    setMaterial(patch) {
      updateMaterial(patch);
      return { ...materialState };
    },
    applyLook(key) {
      applyLook(key);
      return { ...materialState };
    },
    setView(key) {
      selectView(key);
      return viewState;
    },
    setLight(key) {
      selectLight(key);
      return lightState;
    },
    setAutoRotate(value) {
      autoRotate = Boolean(value);
      viewer?.setAutoRotate(autoRotate);
      syncControls();
      return autoRotate;
    },
    openStudio(value = true) {
      setStudioOpen(Boolean(value));
      return Boolean(studio && !studio.hidden);
    }
  };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    viewer?.dispose();
    viewer = null;
  });
}
