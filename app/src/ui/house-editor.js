import { createHouseModel } from '../model/house.js';

const clone = (value) => structuredClone(value);
const round = (value) => Math.round(value * 10) / 10;

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    area += x0 * z1 - x1 * z0;
  }
  return area / 2;
}

function edgeLength(outline, index) {
  const a = outline[index];
  const b = outline[(index + 1) % outline.length];
  if (!a || !b) return 0;
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function perimeter(outline) {
  return outline.reduce((total, _, index) => total + edgeLength(outline, index), 0);
}

/**
 * createHouseModel starts the ring at its lexicographically smallest point and
 * reverses clockwise outlines. Keep the editor in its written order, then
 * translate edge indices at the model boundary.
 */
function normalizedRing(outline) {
  const count = outline.length;
  let ring = outline.map((_, index) => index);
  if (signedArea(outline) < 0) ring.reverse();

  let start = 0;
  for (let i = 1; i < ring.length; i += 1) {
    const point = outline[ring[i]];
    const best = outline[ring[start]];
    if (
      point[0] < best[0] ||
      (point[0] === best[0] && point[1] < best[1])
    ) {
      start = i;
    }
  }

  ring = ring.slice(start).concat(ring.slice(0, start));
  return ring;
}

export function rawToNormalizedEdge(outline, rawIndex) {
  const count = outline.length;
  if (count < 2) return 0;
  const ring = normalizedRing(outline);
  const edge = ((rawIndex % count) + count) % count;

  for (let index = 0; index < count; index += 1) {
    const a = ring[index];
    const b = ring[(index + 1) % count];
    if (
      (a === edge && b === (edge + 1) % count) ||
      (a === (edge + 1) % count && b === edge)
    ) {
      return index;
    }
  }

  return edge;
}

export function normalizedToRawEdge(outline, normalizedIndex) {
  const count = outline.length;
  if (count < 2) return 0;
  const ring = normalizedRing(outline);
  const index = ((normalizedIndex % count) + count) % count;
  const a = ring[index];
  const b = ring[(index + 1) % count];
  if ((a + 1) % count === b) return a;
  if ((b + 1) % count === a) return b;
  return a;
}

function canonicalSpec(spec) {
  const next = clone(spec);
  next.openings = (next.openings ?? []).map((opening) => ({
    ...opening,
    edge: rawToNormalizedEdge(next.outline, opening.edge)
  }));
  return next;
}

function openingIssue(spec) {
  const storeys = new Map(
    (spec.storeys ?? []).map((storey) => [storey.key, storey])
  );
  const walls = new Map();

  for (const [index, opening] of (spec.openings ?? []).entries()) {
    const storey = storeys.get(opening.floor);
    if (!storey) continue;

    if (
      Number.isFinite(opening.sill) &&
      Number.isFinite(opening.height) &&
      opening.sill + opening.height > storey.height + 1e-6
    ) {
      return `Opening ${index + 1} reaches above storey ${storey.key}.`;
    }

    if (!Number.isFinite(opening.offset) || !Number.isFinite(opening.width)) {
      continue;
    }
    const key = `${opening.floor}|${opening.edge}`;
    if (!walls.has(key)) walls.set(key, []);
    walls.get(key).push({
      index,
      start: opening.offset,
      end: opening.offset + opening.width
    });
  }

  for (const list of walls.values()) {
    list.sort((a, b) => a.start - b.start);
    for (let index = 1; index < list.length; index += 1) {
      if (list[index].start < list[index - 1].end - 1e-6) {
        return `Openings ${list[index - 1].index + 1} and ${
          list[index].index + 1
        } overlap on the same wall.`;
      }
    }
  }

  return null;
}

function freeOffset(outline, openings, edge, width) {
  const end = edgeLength(outline, edge);
  const intervals = openings
    .filter((opening) => opening.edge === edge)
    .filter(
      (opening) =>
        Number.isFinite(opening.offset) && Number.isFinite(opening.width)
    )
    .map((opening) => [opening.offset, opening.offset + opening.width])
    .sort((a, b) => a[0] - b[0]);

  const margin = 0.2;
  let cursor = 0;
  for (const [start, stop] of intervals) {
    if (start - cursor >= width + margin * 2) return round(cursor + margin);
    cursor = Math.max(cursor, stop);
  }
  if (end - cursor >= width + margin * 2) return round(cursor + margin);
  return round(Math.max(0, Math.min(end - width, cursor + margin)));
}

function normalizeSpec(spec = {}) {
  const next = clone(spec);
  next.name = next.name ?? 'Editable house';
  next.outline = (Array.isArray(next.outline) ? next.outline : []).map(
    (point) => [Number(point?.[0]), Number(point?.[1])]
  );
  if (next.outline.length > 1) {
    const first = next.outline[0];
    const last = next.outline[next.outline.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) {
      next.outline.pop();
    }
  }

  const storeys =
    Array.isArray(next.storeys) && next.storeys.length
      ? next.storeys
      : [
          {
            key: 'GF',
            name: 'Ground floor',
            height: next.height ?? 3.2
          }
        ];

  next.storeys = storeys.map((storey, index) => ({
    key: storey.key ?? `L${index}`,
    name: storey.name ?? `Storey ${index + 1}`,
    height: storey.height ?? storey.h ?? 3.2,
    ...(Number.isFinite(storey.z0) ? { z0: storey.z0 } : {})
  }));

  next.openings = (Array.isArray(next.openings) ? next.openings : []).map(
    (opening, index) => ({
      floor:
        typeof opening.floor === 'number'
          ? next.storeys[opening.floor]?.key ?? next.storeys[0]?.key
          : opening.floor ?? next.storeys[0]?.key,
      edge: normalizedToRawEdge(next.outline, opening.edge ?? 0),
      offset: opening.offset ?? 0,
      width: opening.width ?? opening.w ?? 1.2,
      height: opening.height ?? opening.h ?? 1.4,
      sill: opening.sill ?? 0,
      kind: opening.kind ?? 'W',
      name: opening.name ?? `Opening ${index + 1}`
    })
  );

  return next;
}

function field(labelText, input, { wide = false } = {}) {
  const label = document.createElement('label');
  label.className = wide ? 'editor-field editor-field-wide' : 'editor-field';
  const span = document.createElement('span');
  span.textContent = labelText;
  label.append(span, input);
  return label;
}

function numberInput(value, onInput, { step = '0.1', min } = {}) {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = step;
  input.inputMode = 'decimal';
  if (min !== undefined) input.min = String(min);
  input.value = Number.isFinite(Number(value)) ? String(value) : '';
  input.addEventListener('input', () => onInput(input.valueAsNumber));
  return input;
}

function textInput(value, onInput) {
  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.value = value ?? '';
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function selectInput(labelText, options, value, onChange) {
  const select = document.createElement('select');
  const entries = [...options];

  if (!entries.some(([optionValue]) => optionValue === value)) {
    entries.push([value, `${value ?? '—'} (missing)`]);
  }

  for (const [optionValue, label] of entries) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = label;
    select.append(option);
  }

  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return field(labelText, select);
}

function badge(text) {
  const node = document.createElement('span');
  node.className = 'row-badge';
  node.textContent = String(text);
  return node;
}

function removeButton(label, onClick, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'row-remove';
  button.textContent = '×';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function addButton(label, id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = 'editor-add';
  button.textContent = label;
  return button;
}

export function createHouseEditor({ onApply, onRequestClose } = {}) {
  const root = document.querySelector('#editor');
  if (!root) throw new Error('house editor is missing its root element');

  const nameInput = document.querySelector('#editor-name');
  const context = document.querySelector('#editor-context');
  const outlineRows = document.querySelector('#outline-rows');
  const storeyRows = document.querySelector('#storey-rows');
  const openingRows = document.querySelector('#opening-rows');
  const outlineSummary = document.querySelector('#outline-summary');
  const openingSummary = document.querySelector('#opening-summary');
  const errorBox = document.querySelector('#editor-error');
  const applyButton = document.querySelector('#apply-editor');
  const closeButton = document.querySelector('#close-editor');
  const cancelButton = document.querySelector('#cancel-editor');
  const resetButton = document.querySelector('#reset-editor');
  const addPointButton = addButton('Add point', 'add-point');
  const addStoreyButton = addButton('Add storey', 'add-storey');
  const addOpeningButton = addButton('Add opening', 'add-opening');

  document.querySelector('#add-point-slot')?.append(addPointButton);
  document.querySelector('#add-storey-slot')?.append(addStoreyButton);
  document.querySelector('#add-opening-slot')?.append(addOpeningButton);

  let baseSpec = null;
  let draft = null;

  function setError(message, state = 'idle') {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.toggle('is-error', state === 'error');
      errorBox.classList.toggle('is-ready', state === 'ready');
    }
    if (applyButton) applyButton.disabled = state === 'error';
  }

  function validate() {
    if (!draft) return false;
    try {
      const model = createHouseModel(canonicalSpec(draft));
      const issue = openingIssue(draft);
      if (issue) throw new Error(issue);
      setError(
        `Ready · ${model.floors.length} storeys · ${model.openings.length} openings`,
        'ready'
      );
      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : String(error),
        'error'
      );
      return false;
    }
  }

  function updateOutlineSummary() {
    if (!outlineSummary) return;
    const count = draft?.outline?.length ?? 0;
    const total = draft?.outline?.length ? perimeter(draft.outline) : 0;
    outlineSummary.textContent = count
      ? `${count} points · ${total.toFixed(1)} m perimeter`
      : 'No points';
  }

  function updateOpeningSummary() {
    if (!openingSummary) return;
    const openings = draft?.openings ?? [];
    const doors = openings.filter((opening) => opening.kind === 'D').length;
    openingSummary.textContent = `${openings.length} openings · ${
      openings.length - doors
    } windows · ${doors} doors`;
  }

  function renderOutline() {
    if (!outlineRows || !draft) return;
    outlineRows.replaceChildren();

    draft.outline.forEach((point, index) => {
      const row = document.createElement('div');
      row.className = 'editor-row outline-row';

      const x = numberInput(point[0], (value) => {
        draft.outline[index][0] = value;
        updateOutlineSummary();
        validate();
      });
      x.addEventListener('change', () => renderOpenings());

      const z = numberInput(point[1], (value) => {
        draft.outline[index][1] = value;
        updateOutlineSummary();
        validate();
      });
      z.addEventListener('change', () => renderOpenings());

      row.append(
        badge(index + 1),
        field('X', x),
        field('Z', z),
        removeButton(
          `Remove point ${index + 1}`,
          () => {
            if (draft.outline.length <= 3) return;
            const count = draft.outline.length;
            const incoming = (index - 1 + count) % count;
            const incomingLength = edgeLength(draft.outline, incoming);
            const merged = index === 0 ? count - 2 : index - 1;

            for (const opening of draft.openings) {
              if (opening.edge === index) {
                opening.edge = merged;
                opening.offset = round(opening.offset + incomingLength);
              } else if (opening.edge === incoming) {
                opening.edge = merged;
              } else if (opening.edge > index) {
                opening.edge -= 1;
              }
            }

            draft.outline.splice(index, 1);
            renderOutline();
            renderOpenings();
            validate();
          },
          draft.outline.length <= 3
        )
      );
      outlineRows.append(row);
    });

    updateOutlineSummary();
  }

  function renderStoreys() {
    if (!storeyRows || !draft) return;
    storeyRows.replaceChildren();

    draft.storeys.forEach((storey, index) => {
      const row = document.createElement('div');
      row.className = 'editor-row storey-row';

      const key = textInput(storey.key, (value) => {
        const oldKey = storey.key;
        storey.key = value;
        for (const opening of draft.openings) {
          if (opening.floor === oldKey) opening.floor = value;
        }
        renderOpenings();
        validate();
      });

      const name = textInput(storey.name, (value) => {
        storey.name = value;
        validate();
      });

      const height = numberInput(
        storey.height,
        (value) => {
          storey.height = value;
          validate();
        },
        { min: 0.1 }
      );

      const fields = document.createElement('div');
      fields.className = 'editor-row-fields';
      fields.append(field('Key', key), field('Name', name), field('Height', height));

      row.append(
        badge(index + 1),
        fields,
        removeButton(
          `Remove storey ${index + 1}`,
          () => {
            if (draft.storeys.length <= 1) return;
            const [removed] = draft.storeys.splice(index, 1);
            draft.openings = draft.openings.filter(
              (opening) => opening.floor !== removed.key
            );
            renderStoreys();
            renderOpenings();
            validate();
          },
          draft.storeys.length <= 1
        )
      );
      storeyRows.append(row);
    });
  }

  function edgeOptions() {
    return draft.outline.map((point, index) => {
      const length = edgeLength(draft.outline, index);
      const next = draft.outline[(index + 1) % draft.outline.length];
      const diagonal =
        next &&
        Math.abs(next[0] - point[0]) > 1e-6 &&
        Math.abs(next[1] - point[1]) > 1e-6;
      return [
        String(index),
        `Edge ${index + 1} · ${length.toFixed(1)} m${diagonal ? ' · diagonal' : ''}`
      ];
    });
  }

  function renderOpenings() {
    if (!openingRows || !draft) return;
    openingRows.replaceChildren();

    const floorOptions = draft.storeys.map((storey) => [
      storey.key,
      `${storey.key} — ${storey.name}`
    ]);

    draft.openings.forEach((opening, index) => {
      const row = document.createElement('div');
      row.className = 'editor-row opening-row';

      const title = document.createElement('span');
      title.className = 'opening-title';
      const updateTitle = () => {
        title.textContent = `${opening.kind === 'D' ? 'Door' : 'Window'} · ${
          opening.name || 'Unnamed'
        }`;
      };

      const head = document.createElement('div');
      head.className = 'opening-head';
      head.append(
        badge(index + 1),
        title,
        removeButton(`Remove opening ${index + 1}`, () => {
          draft.openings.splice(index, 1);
          renderOpenings();
          validate();
        })
      );

      const grid = document.createElement('div');
      grid.className = 'opening-grid';

      const sill = numberInput(opening.sill, (value) => {
        opening.sill = value;
        validate();
      });

      const kind = selectInput(
        'Type',
        [
          ['W', 'Window'],
          ['D', 'Door']
        ],
        opening.kind,
        (value) => {
          opening.kind = value;
          if (value === 'D') {
            opening.sill = 0;
            sill.value = '0';
          }
          updateTitle();
          updateOpeningSummary();
          validate();
        }
      );

      const name = textInput(opening.name, (value) => {
        opening.name = value;
        updateTitle();
        validate();
      });

      grid.append(
        selectInput('Storey', floorOptions, opening.floor, (value) => {
          opening.floor = value;
          validate();
        }),
        selectInput('Edge', edgeOptions(), String(opening.edge), (value) => {
          opening.edge = Number(value);
          validate();
        }),
        kind,
        field(
          'Offset',
          numberInput(opening.offset, (value) => {
            opening.offset = value;
            validate();
          })
        ),
        field(
          'Width',
          numberInput(opening.width, (value) => {
            opening.width = value;
            validate();
          })
        ),
        field(
          'Height',
          numberInput(opening.height, (value) => {
            opening.height = value;
            validate();
          })
        ),
        field('Sill', sill),
        field('Name', name, { wide: true })
      );

      updateTitle();
      row.append(head, grid);
      openingRows.append(row);
    });

    updateOpeningSummary();
  }

  function renderAll() {
    if (!draft) return;
    if (nameInput) nameInput.value = draft.name ?? '';
    renderOutline();
    renderStoreys();
    renderOpenings();
    validate();
  }

  function addPoint() {
    if (!draft?.outline) return;
    const outline = draft.outline;
    if (outline.length >= 3) {
      const first = outline[0];
      const last = outline[outline.length - 1];
      const midX = (first[0] + last[0]) / 2;
      const midZ = (first[1] + last[1]) / 2;
      const dx = first[0] - last[0];
      const dz = first[1] - last[1];
      const length = Math.hypot(dx, dz) || 1;
      let nx = dz / length;
      let nz = -dx / length;
      if (signedArea(outline) < 0) {
        nx = -nx;
        nz = -nz;
      }
      outline.push([round(midX + nx * 1.2), round(midZ + nz * 1.2)]);
    } else {
      outline.push([round((outline.at(-1)?.[0] ?? 0) + 2), outline.at(-1)?.[1] ?? 0]);
    }
    renderOutline();
    renderOpenings();
    validate();
  }

  function addStorey() {
    if (!draft) return;
    const used = new Set(draft.storeys.map((storey) => storey.key));
    let suffix = draft.storeys.length + 1;
    while (used.has(`L${suffix}`)) suffix += 1;
    draft.storeys.push({
      key: `L${suffix}`,
      name: `Storey ${draft.storeys.length + 1}`,
      height: 3
    });
    renderStoreys();
    renderOpenings();
    validate();
  }

  function addOpening() {
    if (!draft) return;
    const storey = draft.storeys[0] ?? { key: 'GF', height: 3.2 };
    const edges = draft.outline.map((_, index) => index);
    const edge =
      edges.find((index) => edgeLength(draft.outline, index) >= 0.8) ?? 0;
    const length = edgeLength(draft.outline, edge);
    const width = Math.max(0.4, Math.min(1.4, length - 0.2));
    const offset = freeOffset(draft.outline, draft.openings, edge, width);
    const windows = draft.openings.filter(
      (opening) => opening.kind === 'W'
    ).length;
    draft.openings.push({
      floor: storey.key,
      edge,
      offset: round(offset),
      width: round(width),
      height: 1.5,
      sill: 0.9,
      kind: 'W',
      name: `Window ${windows + 1}`
    });
    renderOpenings();
    validate();
  }

  addPointButton.addEventListener('click', addPoint);
  addStoreyButton.addEventListener('click', addStorey);
  addOpeningButton.addEventListener('click', addOpening);

  nameInput?.addEventListener('input', () => {
    if (!draft) return;
    draft.name = nameInput.value;
    validate();
  });

  applyButton?.addEventListener('click', () => {
    if (!draft || !validate()) return;
    try {
      const spec = canonicalSpec(draft);
      const model = createHouseModel(spec);
      onApply?.(spec, model);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : String(error),
        'error'
      );
    }
  });

  closeButton?.addEventListener('click', () => onRequestClose?.());
  cancelButton?.addEventListener('click', () => onRequestClose?.());
  resetButton?.addEventListener('click', () => {
    if (!baseSpec) return;
    draft = clone(baseSpec);
    renderAll();
  });

  return {
    open(spec, note = '') {
      baseSpec = normalizeSpec(spec);
      draft = clone(baseSpec);
      if (context) {
        context.textContent = note;
        context.hidden = !note;
      }
      root.hidden = false;
      root.querySelector('.editor-scroll')?.scrollTo(0, 0);
      renderAll();
      closeButton?.focus();
    },
    close() {
      root.hidden = true;
    },
    isOpen() {
      return !root.hidden;
    }
  };
}
