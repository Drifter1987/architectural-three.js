import * as THREE from 'three';

const MATERIALS = () => ({
  frame: new THREE.MeshStandardMaterial({ color: 0x2c3230, roughness: 0.5, metalness: 0.35 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xd8cdb6, roughness: 0.92 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xbcd6de, transparent: true, opacity: 0.35, roughness: 0.06, metalness: 0
  })
});

/**
 * One window, in window-local coordinates: origin at sill centre, +y up,
 * +z out of the wall.  All dimensions in metres.
 */
export function buildWindow(options = {}) {
  const {
    width = 1.2,
    height = 1.5,
    reveal = 0.2,
    surround = 'flat',
    glazing = 'slide',
    head = 'cornice',
    grille = false,
    shutters = false
  } = options;

  const group = new THREE.Group();
  group.name = 'window';
  const parts = [];
  const mats = MATERIALS();

  const add = (geometry, x, y, z, material, kind) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.kind = kind;
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };
  const box = (w, h, d, x, y, z, material, kind) =>
    add(new THREE.BoxGeometry(w, h, d), x, y, z, material, kind);

  const zGlass = 0.06 - reveal;
  const zFrame = zGlass + 0.022;

  // 1. reveal: four stone linings around a 0.20 m recess
  box(0.04, height, reveal, -width / 2 - 0.02, height / 2, -reveal / 2, mats.stone, 'reveal');
  box(0.04, height, reveal, width / 2 + 0.02, height / 2, -reveal / 2, mats.stone, 'reveal');
  box(width + 0.08, 0.04, reveal, 0, height + 0.02, -reveal / 2, mats.stone, 'reveal');
  box(width + 0.08, 0.04, reveal, 0, -0.02, -reveal / 2, mats.stone, 'reveal');

  // 2. glass
  add(new THREE.PlaneGeometry(width, height), 0, height / 2, zGlass, mats.glass, 'glass');

  // 3. outer frame
  box(width, 0.06, 0.05, 0, height - 0.03, zFrame, mats.frame, 'frame');
  box(width, 0.06, 0.05, 0, 0.03, zFrame, mats.frame, 'frame');
  box(0.06, height, 0.05, -width / 2 + 0.03, height / 2, zFrame, mats.frame, 'frame');
  box(0.06, height, 0.05, width / 2 - 0.03, height / 2, zFrame, mats.frame, 'frame');

  // 4. mullions and transom
  const mullions = glazing === 'clear' ? 0
    : glazing === 'grid' ? Math.max(1, Math.round(width / 0.3))
    : glazing === 'french' ? 1
    : Math.max(0, Math.round(width / 0.8) - 1);
  for (let i = 1; i <= mullions; i++) {
    box(0.045, height, 0.045, -width / 2 + width * i / (mullions + 1), height / 2, zFrame, mats.frame, 'mullion');
  }
  const transom = height > 1.25 ? height * 0.74 : 0;
  if (transom) box(width, 0.05, 0.05, 0, transom, zFrame, mats.frame, 'transom');
  if (glazing === 'grid') {
    for (let i = 1; i < 3; i++) box(width, 0.022, 0.026, 0, height * i / 3, zFrame + 0.012, mats.frame, 'bar');
  }

  // 5. sill
  box(width + 0.2, 0.09, 0.16, 0, -0.045, 0.08, mats.stone, 'sill');
  box(width + 0.14, 0.03, 0.12, 0, -0.105, 0.06, mats.stone, 'sill');

  // 6. stone surround, five profiles
  const jamb = (dx, w) => box(w, height + 0.2, 0.04, dx, (height + 0.2) / 2, 0.02, mats.stone, 'surround');
  if (surround === 'flat') {
    jamb(-width / 2 - 0.06, 0.12); jamb(width / 2 + 0.06, 0.12);
    box(width + 0.24, 0.12, 0.04, 0, height + 0.1, 0.02, mats.stone, 'surround');
    box(width + 0.24, 0.08, 0.1, 0, -0.04, 0.05, mats.stone, 'surround');
  } else if (surround === 'stepped') {
    [-1, 1].forEach((s) => {
      jamb(s * (width / 2 + 0.06), 0.12);
      jamb(s * (width / 2 + 0.16), 0.05);
    });
    box(width + 0.32, 0.12, 0.04, 0, height + 0.1, 0.02, mats.stone, 'surround');
    box(width + 0.44, 0.06, 0.05, 0, height + 0.19, 0.015, mats.stone, 'surround');
    box(width + 0.3, 0.08, 0.1, 0, -0.04, 0.05, mats.stone, 'surround');
  } else if (surround === 'eared') {
    jamb(-width / 2 - 0.06, 0.12); jamb(width / 2 + 0.06, 0.12);
    box(width + 0.32, 0.12, 0.04, 0, height + 0.1, 0.02, mats.stone, 'surround');
    box(0.1, 0.18, 0.05, -width / 2 - 0.16, height + 0.15, 0.02, mats.stone, 'surround');
    box(0.1, 0.18, 0.05, width / 2 + 0.16, height + 0.15, 0.02, mats.stone, 'surround');
    box(width + 0.24, 0.08, 0.1, 0, -0.04, 0.05, mats.stone, 'surround');
  } else if (surround === 'blocks') {
    [-1, 1].forEach((s) => {
      for (let i = 0; i < 3; i++) {
        box(i % 2 ? 0.19 : 0.31, 0.27, 0.05, s * (width / 2 + (i % 2 ? 0.1 : 0.16)), 0.15 + i * 0.28, 0.02, mats.stone, 'surround');
      }
    });
    box(width + 0.62, 0.28, 0.05, 0, height + 0.14, 0.02, mats.stone, 'surround');
    box(width + 0.24, 0.08, 0.1, 0, -0.04, 0.05, mats.stone, 'surround');
  } else if (surround === 'thin') {
    jamb(-width / 2 - 0.05, 0.1); jamb(width / 2 + 0.05, 0.1);
    box(width + 0.2, 0.1, 0.03, 0, height + 0.05, 0.015, mats.stone, 'surround');
  } else {
    throw new Error(`unknown surround: ${surround}`);
  }

  // 7. head
  if (head === 'cornice') {
    box(width + 0.2, 0.16, 0.035, 0, height + 0.28, 0.0175, mats.stone, 'head');
    box(width + 0.32, 0.05, 0.11, 0, height + 0.385, 0.055, mats.stone, 'head');
    box(width + 0.38, 0.035, 0.15, 0, height + 0.4275, 0.075, mats.stone, 'head');
  } else if (head === 'lintel') {
    box(width + 0.2, 0.11, 0.09, 0, height + 0.26, 0.045, mats.stone, 'head');
  } else if (head === 'key') {
    box(width + 0.2, 0.11, 0.09, 0, height + 0.26, 0.045, mats.stone, 'head');
    add(new THREE.ConeGeometry(0.14, 0.32, 4), 0, height + 0.44, 0.05, mats.stone, 'key');
  }

  // 8. shading
  if (shutters) {
    [-1, 1].forEach((s) => {
      box(Math.min(width / 2, 0.85), height + 0.04, 0.035, s * (width / 2 + 0.13), height / 2, 0.065, mats.frame, 'shutter');
    });
  }
  if (grille) {
    const bars = Math.max(2, Math.round(width / 0.12));
    for (let i = 1; i < bars; i++) {
      box(0.016, height - 0.02, 0.016, -width / 2 + width * i / bars, height / 2, -0.05, mats.frame, 'grille');
    }
    [0.1, height - 0.1].forEach((y) => box(width, 0.035, 0.008, 0, y, -0.038, mats.frame, 'grille'));
  }

  group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(group);
  const materials = [...new Set(parts.map((p) => p.material))];

  return { group, parts, materials, bbox, options: { width, height, reveal, surround, glazing, head } };
}

export function partCounts(parts) {
  return parts.reduce((acc, p) => {
    const k = p.userData.kind || 'other';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}
