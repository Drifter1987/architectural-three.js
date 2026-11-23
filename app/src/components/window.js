import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  TorusGeometry
} from 'three';

export const SURROUNDS = ['flat', 'stepped', 'eared', 'thin', 'blocks'];
export const GLAZING = ['slide', 'french', 'grid', 'clear'];
export const SHUTTERS = ['none', 'green', 'wood'];
export const GRILLES = ['none', 'bars', 'deco'];
export const HEADS = ['none', 'cornice', 'lintel'];
export const SILLS = ['none', 'plain', 'corbel'];

export const WINDOW_DEFAULTS = Object.freeze({
  width: 1.2,
  height: 1.5,
  frame: 0.06,
  stone: 0.2,
  reveal: 0.2,
  surround: 'flat',
  glazing: 'slide',
  shutters: 'none',
  grille: 'none',
  head: 'cornice',
  sill: 'plain',
  kind: 'window'
});

export function createWindowMaterials() {
  return {
    stone: new MeshStandardMaterial({
      color: 0xd9d1bf,
      roughness: 0.86,
      metalness: 0
    }),
    frame: new MeshStandardMaterial({
      color: 0x1d2627,
      roughness: 0.45,
      metalness: 0.35
    }),
    glass: new MeshPhysicalMaterial({
      color: 0xbfd9de,
      transparent: true,
      opacity: 0.36,
      roughness: 0.12,
      metalness: 0,
      side: DoubleSide,
      depthWrite: false
    }),
    iron: new MeshStandardMaterial({
      color: 0x202526,
      roughness: 0.55,
      metalness: 0.25
    }),
    shutterGreen: new MeshStandardMaterial({
      color: 0x3f5a45,
      roughness: 0.82,
      metalness: 0
    }),
    shutterWood: new MeshStandardMaterial({
      color: 0x6b4a2f,
      roughness: 0.78,
      metalness: 0
    })
  };
}

function assertEnum(name, value, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.join(', ')}; received ${String(value)}`
    );
  }
}

/**
 * One window or door assembly in opening-local coordinates.
 *
 * Origin: bottom-centre of the opening at the wall face, +z outward.
 * Returns `{ group, parts, materials, info }`; no global state, no DOM.
 */
export function buildWindow(options = {}) {
  const config = { ...WINDOW_DEFAULTS, ...options };
  const { width, height } = config;

  if (!Number.isFinite(width) || width <= 0.1) {
    throw new Error('window width must be a finite number greater than 0.1');
  }
  if (!Number.isFinite(height) || height <= 0.1) {
    throw new Error('window height must be a finite number greater than 0.1');
  }
  assertEnum('surround', config.surround, SURROUNDS);
  assertEnum('glazing', config.glazing, GLAZING);
  assertEnum('shutters', config.shutters, SHUTTERS);
  assertEnum('grille', config.grille, GRILLES);
  assertEnum('head', config.head, HEADS);
  assertEnum('sill', config.sill, SILLS);
  assertEnum('kind', config.kind, ['window', 'door']);

  const materials = options.materials ?? createWindowMaterials();
  const group = new Group();
  group.name = 'window';

  const parts = [];
  const add = (name, geometry, material, x, y, z) => {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.userData.part = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = material.transparent !== true;
    mesh.receiveShadow = material.transparent !== true;
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };
  const box = (name, material, sx, sy, sz, x, y, z) =>
    add(name, new BoxGeometry(sx, sy, sz), material, x, y, z);
  const pane = (name, material, pw, ph, x, y, z) =>
    add(name, new PlaneGeometry(pw, ph), material, x, y, z);

  const stone = materials.stone;
  const frame = materials.frame;
  const glass = materials.glass;
  const iron = materials.iron;
  const isDoor = config.kind === 'door';
  const frameZ = 0.06 - config.reveal + 0.022;
  const glassZ = 0.06 - config.reveal;
  const innerBottom = 0.06;
  const innerTop = height - 0.06;
  const innerHeight = innerTop - innerBottom;
  const sashRail = 0.045;

  // The reveal lines the hole through the full wall thickness.
  box('reveal-left', stone, 0.02, height, config.reveal, -width / 2 - 0.01, height / 2, -config.reveal / 2);
  box('reveal-right', stone, 0.02, height, config.reveal, width / 2 + 0.01, height / 2, -config.reveal / 2);
  box('reveal-top', stone, width + 0.04, 0.02, config.reveal, 0, height + 0.01, -config.reveal / 2);
  box('reveal-bottom', stone, width + 0.04, 0.02, config.reveal, 0, -0.01, -config.reveal / 2);

  // Outer frame.
  box('frame-top', frame, width, config.frame, 0.05, 0, height - config.frame / 2, frameZ);
  box('frame-bottom', frame, width, config.frame, 0.05, 0, config.frame / 2, frameZ);
  box('frame-left', frame, config.frame, height, 0.05, -width / 2 + config.frame / 2, height / 2, frameZ);
  box('frame-right', frame, config.frame, height, 0.05, width / 2 - config.frame / 2, height / 2, frameZ);

  function buildSlide() {
    const sashWidth = width / 2 + 0.02;
    [-1, 1].forEach((side) => {
      const tag = side < 0 ? 'left' : 'right';
      const cx = side * (width / 4 - 0.01);
      const z = frameZ + side * 0.012;

      box(`sash-${tag}-top`, frame, sashWidth, sashRail, 0.04, cx, innerTop - sashRail / 2, z);
      box(`sash-${tag}-bottom`, frame, sashWidth, sashRail, 0.04, cx, innerBottom + sashRail / 2, z);
      box(`sash-${tag}-left`, frame, sashRail, innerHeight - sashRail, 0.04, cx - sashWidth / 2 + sashRail / 2, height / 2, z);
      box(`sash-${tag}-right`, frame, sashRail, innerHeight - sashRail, 0.04, cx + sashWidth / 2 - sashRail / 2, height / 2, z);
      pane(`glass-${tag}`, glass, sashWidth - 0.09, innerHeight - 0.09, cx, height / 2, z + 0.011);
      box(`sash-${tag}-pull`, frame, 0.02, 0.12, 0.02, cx - side * (sashWidth / 2 - 0.06), height / 2, z + 0.03);
    });
    box('meeting-stile', frame, 0.05, innerHeight - 0.02, 0.05, 0, height / 2, frameZ);
  }

  function buildFrench() {
    const sashWidth = width / 2;
    [-1, 1].forEach((side) => {
      const tag = side < 0 ? 'left' : 'right';
      const cx = side * width / 4;
      const z = frameZ;

      box(`sash-${tag}-top`, frame, sashWidth, sashRail, 0.04, cx, innerTop - sashRail / 2, z);
      box(`sash-${tag}-bottom`, frame, sashWidth, sashRail, 0.04, cx, innerBottom + sashRail / 2, z);
      box(`sash-${tag}-left`, frame, sashRail, innerHeight - sashRail, 0.04, cx - sashWidth / 2 + sashRail / 2, height / 2, z);
      box(`sash-${tag}-right`, frame, sashRail, innerHeight - sashRail, 0.04, cx + sashWidth / 2 - sashRail / 2, height / 2, z);
      pane(`glass-${tag}`, glass, sashWidth - 0.09, innerHeight - 0.09, cx, height / 2, z + 0.011);
    });
    [-1, 1].forEach((side) => {
      box('glazing-bar-v', frame, 0.04, innerHeight, 0.04, side * width / 6, height / 2, frameZ + 0.02);
    });
    box('transom', frame, width - 0.1, 0.05, 0.045, 0, height * 0.74, frameZ);
    box('glazing-bar-h', frame, width - 0.1, 0.04, 0.04, 0, height * 0.45, frameZ);
  }

  function buildGrid() {
    pane('glass', glass, width - 0.1, innerHeight - 0.03, 0, height / 2, glassZ);
    const columns = Math.max(3, Math.round(width / 0.3));
    const rows = Math.max(2, Math.round(height / 0.34));
    for (let i = 1; i < columns; i++) {
      box('muntin-v', frame, 0.022, innerHeight, 0.026, -width / 2 + (width * i) / columns, height / 2, frameZ + 0.012);
    }
    for (let i = 1; i < rows; i++) {
      box('muntin-h', frame, width - 0.08, 0.022, 0.026, 0, (height * i) / rows, frameZ + 0.012);
    }
    box('transom', frame, width - 0.1, 0.05, 0.045, 0, height * 0.74, frameZ);
  }

  function buildClear() {
    pane('glass', glass, width - 0.1, innerHeight - 0.03, 0, height / 2, glassZ);
    box('clear-stile-left', frame, 0.04, innerHeight, 0.04, -width / 2 + 0.05, height / 2, frameZ + 0.012);
    box('clear-stile-right', frame, 0.04, innerHeight, 0.04, width / 2 - 0.05, height / 2, frameZ + 0.012);
  }

  if (config.glazing === 'slide') buildSlide();
  else if (config.glazing === 'french') buildFrench();
  else if (config.glazing === 'grid') buildGrid();
  else buildClear();

  // Stone surround: five profiles, all derived from the same opening width.
  if (config.surround === 'flat' || config.surround === 'stepped' || config.surround === 'eared') {
    [-1, 1].forEach((side) => {
      box('surround-jamb', stone, config.stone, height + config.stone, 0.04, side * (width / 2 + config.stone / 2), (height + config.stone) / 2, 0.02);
      box('surround-bead', stone, 0.035, height + 0.035, 0.065, side * (width / 2 + 0.0175), (height + 0.035) / 2, 0.0325);
    });
    box('surround-head', stone, width + 2 * config.stone, config.stone, 0.04, 0, height + config.stone / 2, 0.02);
    box('surround-head-bead', stone, width + 0.07, 0.035, 0.065, 0, height + 0.0175, 0.0325);
  }

  if (config.surround === 'stepped') {
    [-1, 1].forEach((side) => {
      box('surround-step', stone, 0.12, height + 0.12, 0.03, side * (width / 2 + 0.06), (height + 0.12) / 2, 0.055);
      box('surround-step', stone, 0.05, height + 0.05, 0.03, side * (width / 2 + 0.025), (height + 0.05) / 2, 0.085);
    });
    box('surround-step', stone, width + 0.24, 0.12, 0.03, 0, height + 0.06, 0.055);
    box('surround-step', stone, width + 0.1, 0.05, 0.03, 0, height + 0.025, 0.085);
  }

  if (config.surround === 'eared') {
    [-1, 1].forEach((side) => {
      box('surround-ear', stone, 0.08, 0.13, 0.04, side * (width / 2 + config.stone + 0.04), height - 0.065, 0.02);
    });
    box('surround-head', stone, width + 2 * config.stone + 0.16, config.stone, 0.04, 0, height + config.stone / 2, 0.02);
  }

  if (config.surround === 'thin') {
    [-1, 1].forEach((side) => {
      box('surround-thin', stone, 0.1, height + 0.1, 0.03, side * (width / 2 + 0.05), (height + 0.1) / 2, 0.015);
    });
    box('surround-thin', stone, width + 0.2, 0.1, 0.03, 0, height + 0.05, 0.015);
    box('surround-thin', stone, width + 0.06, 0.03, 0.05, 0, height + 0.015, 0.025);
  }

  if (config.surround === 'blocks') {
    const count = Math.max(2, Math.round(height / 0.27));
    const blockHeight = height / count;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < count; i++) {
        const blockWidth = i % 2 ? 0.19 : 0.31;
        box('surround-block', stone, blockWidth, blockHeight - 0.008, 0.04, side * (width / 2 + blockWidth / 2), (i + 0.5) * blockHeight, 0.02);
      }
    });
    box('surround-block', stone, width + 2 * config.stone + 0.22, 0.28, 0.045, 0, height + 0.14, 0.02);
  }

  if (!isDoor && config.sill !== 'none') {
    const sillWidth = width + 2 * config.stone + 0.1;
    box('sill', stone, sillWidth, 0.09, 0.16, 0, -0.045, 0.08);
    box('sill-drip', stone, sillWidth - 0.06, 0.03, 0.12, 0, -0.105, 0.06);
    if (config.sill === 'corbel') {
      [-1, 1].forEach((side) => {
        box('sill-corbel', stone, 0.1, 0.18, 0.12, side * (width / 2 + config.stone / 2), -0.12, 0.06);
      });
    }
  }

  if (isDoor) {
    box('threshold', stone, width + 0.16, 0.04, 0.2, 0, -0.02, 0.1);
  }

  if (config.head === 'cornice') {
    box('head-band', stone, width + 2 * config.stone, 0.16, 0.035, 0, height + config.stone + 0.08, 0.0175);
    box('head-cap', stone, width + 2 * config.stone + 0.12, 0.05, 0.11, 0, height + config.stone + 0.185, 0.055);
    box('head-drip', stone, width + 2 * config.stone + 0.18, 0.035, 0.15, 0, height + config.stone + 0.2275, 0.075);
  } else if (config.head === 'lintel') {
    box('head-lintel', stone, width + 2 * config.stone + 0.1, 0.11, 0.09, 0, height + config.stone + 0.055, 0.045);
  }

  if (!isDoor && config.shutters !== 'none') {
    const shutter = config.shutters === 'wood' ? materials.shutterWood : materials.shutterGreen;
    const leafWidth = Math.min(width / 2, 0.85);
    [-1, 1].forEach((side) => {
      const cx = side * (width / 2 + config.stone + leafWidth / 2 + 0.04);
      box('shutter-panel', shutter, leafWidth, height + 0.04, 0.035, cx, height / 2, 0.065);
      [0.22, 0.4, 0.58, 0.76].forEach((fraction) => {
        box('shutter-slat', shutter, leafWidth - 0.08, 0.03, 0.02, cx, height * fraction, 0.09);
      });
    });
  }

  if (!isDoor && config.grille !== 'none') {
    const count = Math.max(3, Math.round(width / 0.12));
    for (let i = 1; i < count; i++) {
      box('grille-bar', iron, 0.016, height - 0.02, 0.016, -width / 2 + (width * i) / count, height / 2, -0.05);
    }
    [0.1, height - 0.1].forEach((y) => {
      box('grille-rail', iron, width, 0.035, 0.008, 0, y, -0.038);
    });
    if (config.grille === 'deco') {
      const bays = Math.min(6, count);
      for (let bay = 0; bay < bays; bay++) {
        [0.3, 0.5, 0.7].forEach((fraction) => {
          add('grille-ring', new TorusGeometry(0.043, 0.006, 4, 12), iron, -width / 2 + (width * (bay + 0.5)) / count, height * fraction, -0.05);
        });
      }
    }
  }

  if (isDoor) {
    box('door-handle', iron, 0.035, 0.7, 0.035, width * 0.28, height * 0.45, 0.015);
    box('door-lock', iron, 0.06, 0.1, 0.02, width * 0.28, height * 0.45, 0.03);
  }

  const info = {
    kind: config.kind,
    width,
    height,
    surround: config.surround,
    glazing: config.glazing,
    shutters: config.shutters,
    grille: config.grille,
    head: config.head,
    sill: config.sill,
    partCount: parts.length,
    usedMaterials: new Set(parts.map((part) => part.material)).size
  };

  return { group, parts, materials, info };
}
