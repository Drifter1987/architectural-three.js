import {
  CanvasTexture,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace
} from 'three';

const TEXTURE_METERS = 2;
const MAX_STONE_TEXTURES = 8;
const MAX_SMALL_TEXTURES = 8;

export const DEFAULT_MATERIAL_STATE = Object.freeze({
  finish: 'msamsam',
  tone: 'white',
  joint: 'thin',
  frame: 'black',
  roof: 'tiles'
});

export const STONE_FINISHES = Object.freeze([
  {
    key: 'mbawwaz',
    name: 'Mbewwaz',
    note: 'Rough rockface',
    style: 'rock',
    course: [0.24, 0.36],
    block: [0.35, 0.7],
    joint: 0.01,
    margin: 0,
    relief: 0.055,
    roughness: 0.96,
    bumpScale: 0.045
  },
  {
    key: 'jabal',
    name: 'Jabal',
    note: 'Split face',
    style: 'split',
    course: [0.24, 0.32],
    block: [0.35, 0.65],
    joint: 0.008,
    margin: 0,
    relief: 0.018,
    roughness: 0.94,
    bumpScale: 0.035
  },
  {
    key: 'mlattash',
    name: 'Mlattash',
    note: 'Chiselled face',
    style: 'chisel',
    course: [0.28, 0.4],
    block: [0.45, 0.9],
    joint: 0.005,
    margin: 0.02,
    relief: 0.012,
    roughness: 0.9,
    bumpScale: 0.025
  },
  {
    key: 'beek',
    name: 'Beek',
    note: 'Pick-hammered',
    style: 'pick',
    course: [0.25, 0.25],
    block: [0.4, 0.75],
    joint: 0.006,
    margin: 0.022,
    relief: 0.008,
    roughness: 0.92,
    bumpScale: 0.022
  },
  {
    key: 'msamsam',
    name: 'Msamsam',
    note: 'Fine sesame grain',
    style: 'sesame',
    course: [0.25, 0.3],
    block: [0.45, 0.8],
    joint: 0.005,
    margin: 0.022,
    relief: 0.006,
    roughness: 0.88,
    bumpScale: 0.018
  },
  {
    key: 'mtabbeh',
    name: 'Mtabbeh',
    note: 'Bush-hammered',
    style: 'bush',
    course: [0.3, 0.4],
    block: [0.6, 1.1],
    joint: 0.004,
    margin: 0.02,
    relief: 0.01,
    roughness: 0.95,
    bumpScale: 0.028
  },
  {
    key: 'shaairi',
    name: 'Shaairi',
    note: 'Barley tooling',
    style: 'barley',
    course: [0.3, 0.3],
    block: [0.45, 0.85],
    joint: 0.006,
    margin: 0.022,
    relief: 0.01,
    roughness: 0.91,
    bumpScale: 0.024
  },
  {
    key: 'smooth',
    name: 'Smooth',
    note: 'Fine sawn stone',
    style: 'smooth',
    course: [0.25, 0.3],
    block: [0.6, 1.2],
    joint: 0.004,
    margin: 0,
    relief: 0.002,
    roughness: 0.82,
    bumpScale: 0.012
  }
]);

export const STONE_TONES = Object.freeze([
  {
    key: 'white',
    name: 'White',
    base: [234, 228, 213],
    mortar: [203, 197, 185],
    trim: [244, 240, 231],
    variation: 9,
    warm: 1.5
  },
  {
    key: 'sand',
    name: 'Sand',
    base: [228, 214, 184],
    mortar: [201, 191, 168],
    trim: [243, 238, 225],
    variation: 9,
    warm: 2
  },
  {
    key: 'honey',
    name: 'Honey',
    base: [216, 196, 156],
    mortar: [188, 174, 147],
    trim: [242, 234, 216],
    variation: 14,
    warm: 3
  },
  {
    key: 'pink',
    name: 'Pink',
    base: [226, 209, 196],
    mortar: [205, 191, 178],
    trim: [241, 232, 225],
    variation: 8,
    warm: 1
  },
  {
    key: 'mixed',
    name: 'Mixed',
    base: [231, 223, 205],
    alt: [214, 190, 148],
    altP: 0.42,
    mortar: [202, 192, 174],
    trim: [243, 236, 222],
    variation: 8,
    warm: 2
  }
]);

export const JOINT_STYLES = Object.freeze([
  { key: 'thin', name: 'Thin', width: 1, margin: 0 },
  { key: 'margin', name: 'Drafted', width: 1.25, margin: 0.022 },
  { key: 'rebate', name: 'Rebated', width: 1.4, margin: 0.016, rebate: 0.022 }
]);

export const FRAME_STYLES = Object.freeze([
  {
    key: 'black',
    name: 'Black',
    color: 0x1d2627,
    roughness: 0.42,
    metalness: 0.42
  },
  {
    key: 'grey',
    name: 'Charcoal',
    color: 0x4b5153,
    roughness: 0.5,
    metalness: 0.32
  },
  {
    key: 'bronze',
    name: 'Bronze',
    color: 0x765031,
    roughness: 0.42,
    metalness: 0.52
  },
  {
    key: 'white',
    name: 'White',
    color: 0xe7e4db,
    roughness: 0.56,
    metalness: 0.08
  },
  {
    key: 'wood',
    name: 'Oak',
    color: 0x6a4a2f,
    roughness: 0.72,
    metalness: 0.02
  }
]);

export const ROOF_STYLES = Object.freeze([
  {
    key: 'tiles',
    name: 'Terracotta',
    base: [166, 91, 63],
    edge: [106, 51, 36],
    mortar: [78, 40, 31],
    sideColor: 0x8e4932,
    roughness: 0.84
  },
  {
    key: 'aged',
    name: 'Aged clay',
    base: [141, 91, 61],
    edge: [89, 56, 43],
    mortar: [66, 42, 34],
    sideColor: 0x79503c,
    roughness: 0.9
  },
  {
    key: 'flat',
    name: 'Flat concrete',
    flat: true,
    base: [189, 182, 168],
    edge: [157, 150, 136],
    mortar: [166, 160, 148],
    sideColor: 0xb9b2a3,
    roughness: 0.94
  }
]);

export const LOOK_PRESETS = Object.freeze([
  {
    key: 'modern',
    name: 'Modern',
    state: {
      finish: 'msamsam',
      tone: 'white',
      joint: 'thin',
      frame: 'black',
      roof: 'tiles'
    }
  },
  {
    key: 'traditional',
    name: 'Traditional',
    state: {
      finish: 'mtabbeh',
      tone: 'honey',
      joint: 'margin',
      frame: 'wood',
      roof: 'tiles'
    }
  },
  {
    key: 'minimal',
    name: 'Minimal',
    state: {
      finish: 'smooth',
      tone: 'white',
      joint: 'thin',
      frame: 'grey',
      roof: 'flat'
    }
  },
  {
    key: 'rock',
    name: 'Rockface',
    state: {
      finish: 'mbawwaz',
      tone: 'sand',
      joint: 'rebate',
      frame: 'bronze',
      roof: 'aged'
    }
  }
]);

const stoneCache = new Map();
const trimCache = new Map();
const roofCache = new Map();
const surfaceCache = new Map();
let cacheTick = 0;

function hasCanvas() {
  return (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  );
}

function canvasSize() {
  if (typeof window === 'undefined') return 1024;
  return (window.innerWidth || 1024) < 700 ? 512 : 1024;
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return canvas;
}

function seedOf(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgb(color) {
  return `rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(
    color[2]
  )})`;
}

function assignColor(material, color) {
  material.color.setStyle(rgb(color));
}

function setTexture(material, slot, texture) {
  const hadTexture = Boolean(material[slot]);
  material[slot] = texture ?? null;
  if (hadTexture !== Boolean(texture)) material.needsUpdate = true;
}

function blockColor(tone, rand) {
  let base = tone.base;
  if (tone.alt && rand() < (tone.altP || 0)) {
    base = base.map((value, index) => (value + tone.alt[index]) / 2);
  }
  const shift = (rand() - 0.5) * 2 * (tone.variation || 0);
  const warm = (rand() - 0.5) * 2 * (tone.warm || 0);
  return [
    base[0] + shift + warm,
    base[1] + shift,
    base[2] + shift - warm
  ];
}

function courseHeights(finish, rand) {
  const heights = [];
  let total = 0;
  while (total < TEXTURE_METERS - 0.02) {
    let height =
      finish.course[0] + rand() * (finish.course[1] - finish.course[0]);
    if (total + height > TEXTURE_METERS - 0.04) {
      height = TEXTURE_METERS - total;
    }
    heights.push(height);
    total += height;
  }
  return heights;
}

function paintMarks(g, h, finish, bx, by, bw, bh, rand, px) {
  const style = finish.style;
  const area = bw * bh;

  if (style === 'rock') {
    const cx = bx + bw * (0.3 + rand() * 0.4);
    const cy = by + bh * (0.3 + rand() * 0.4);
    const radius = Math.max(bw, bh) * 0.85;
    const light = g.createRadialGradient(cx, cy, 1, cx, cy, radius);
    light.addColorStop(0, 'rgba(255, 252, 240, 0.19)');
    light.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    light.addColorStop(1, 'rgba(58, 47, 31, 0.18)');
    g.fillStyle = light;
    g.fillRect(bx, by, bw, bh);

    const relief = h.createRadialGradient(cx, cy, 1, cx, cy, radius);
    relief.addColorStop(0, '#eeeeee');
    relief.addColorStop(0.55, '#a2a2a2');
    relief.addColorStop(1, '#5c5c5c');
    h.fillStyle = relief;
    h.fillRect(bx, by, bw, bh);

    const count = Math.max(18, Math.round(area / 360));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const rx = 1 + rand() * px * 0.05;
      const ry = rx * (0.45 + rand());
      const turn = rand() * Math.PI;
      g.fillStyle =
        rand() < 0.5 ? 'rgba(70, 60, 40, 0.1)' : 'rgba(255, 252, 240, 0.13)';
      g.beginPath();
      g.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2);
      g.fill();
      h.fillStyle = rand() < 0.5 ? '#737373' : '#d8d8d8';
      h.beginPath();
      h.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2);
      h.fill();
    }
    return;
  }

  if (style === 'split') {
    for (let i = 0; i < 13; i += 1) {
      const y = by + rand() * bh;
      const weight = 0.5 + rand() * 1.6;
      g.strokeStyle =
        rand() < 0.5 ? 'rgba(68, 56, 38, 0.18)' : 'rgba(255, 252, 240, 0.14)';
      g.lineWidth = weight;
      g.beginPath();
      g.moveTo(bx, y);
      g.bezierCurveTo(
        bx + bw * 0.3,
        y + (rand() - 0.5) * 8,
        bx + bw * 0.7,
        y + (rand() - 0.5) * 8,
        bx + bw,
        y + (rand() - 0.5) * 3
      );
      g.stroke();
      h.strokeStyle = rand() < 0.5 ? '#767676' : '#d0d0d0';
      h.lineWidth = weight;
      h.beginPath();
      h.moveTo(bx, y);
      h.lineTo(bx + bw, y + (rand() - 0.5) * 3);
      h.stroke();
    }
    return;
  }

  if (style === 'chisel') {
    const count = Math.max(28, Math.round(area / 220));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const length = 4 + rand() * 13;
      const angle = -0.7 + rand() * 0.18;
      const dx = Math.cos(angle) * length;
      const dy = Math.sin(angle) * length;
      g.strokeStyle =
        rand() < 0.5 ? 'rgba(70, 58, 40, 0.17)' : 'rgba(255, 252, 240, 0.1)';
      g.lineWidth = 0.6 + rand() * 1.1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + dx, y + dy);
      g.stroke();
      h.strokeStyle = rand() < 0.5 ? '#7f7f7f' : '#d2d2d2';
      h.lineWidth = 0.6 + rand() * 1.1;
      h.beginPath();
      h.moveTo(x, y);
      h.lineTo(x + dx, y + dy);
      h.stroke();
    }
    return;
  }

  if (style === 'pick') {
    const count = Math.max(80, Math.round(area / 42));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const radius = 0.5 + rand() * (px / 300);
      g.fillStyle = 'rgba(72, 60, 42, 0.22)';
      g.beginPath();
      g.arc(x, y, radius, 0, Math.PI * 2);
      g.fill();
      h.fillStyle = '#6a6a6a';
      h.beginPath();
      h.arc(x, y, radius + 0.5, 0, Math.PI * 2);
      h.fill();
    }
    return;
  }

  if (style === 'sesame') {
    const count = Math.max(120, Math.round(area / 18));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const size = 0.6 + rand() * 1.2;
      g.fillStyle =
        rand() < 0.6 ? 'rgba(112, 96, 70, 0.16)' : 'rgba(255, 253, 245, 0.18)';
      g.fillRect(x, y, size, size);
      h.fillStyle = rand() < 0.6 ? '#808080' : '#d0d0d0';
      h.fillRect(x, y, size, size);
    }
    return;
  }

  if (style === 'bush') {
    const count = Math.max(160, Math.round(area / 26));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const radius = 0.4 + rand() * (px / 240);
      g.fillStyle = 'rgba(76, 65, 47, 0.13)';
      g.beginPath();
      g.arc(x, y, radius, 0, Math.PI * 2);
      g.fill();
      h.fillStyle = rand() < 0.5 ? '#8a8a8a' : '#b8b8b8';
      h.beginPath();
      h.arc(x, y, radius, 0, Math.PI * 2);
      h.fill();
    }
    return;
  }

  if (style === 'barley') {
    const count = Math.max(50, Math.round(area / 75));
    for (let i = 0; i < count; i += 1) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const length = 4 + rand() * 8;
      const angle = 1.05 + (rand() - 0.5) * 0.3;
      const dx = Math.cos(angle) * length * 0.5;
      const dy = Math.sin(angle) * length * 0.5;
      g.strokeStyle = 'rgba(93, 78, 55, 0.17)';
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x - dx, y - dy);
      g.lineTo(x + dx, y + dy);
      g.stroke();
      h.strokeStyle = '#767676';
      h.lineWidth = 0.8;
      h.beginPath();
      h.moveTo(x - dx, y - dy);
      h.lineTo(x + dx, y + dy);
      h.stroke();
    }
    return;
  }

  const wash = g.createLinearGradient(bx, by, bx + bw, by + bh);
  wash.addColorStop(0, 'rgba(255, 253, 245, 0.12)');
  wash.addColorStop(1, 'rgba(90, 75, 50, 0.07)');
  g.fillStyle = wash;
  g.fillRect(bx, by, bw, bh);

  const count = Math.max(18, Math.round(area / 900));
  for (let i = 0; i < count; i += 1) {
    const x = bx + rand() * bw;
    const y = by + rand() * bh;
    const radius = 1 + rand() * 3;
    g.fillStyle = 'rgba(130, 115, 85, 0.06)';
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();
    h.fillStyle = 'rgba(255, 255, 255, 0.06)';
    h.beginPath();
    h.arc(x, y, radius, 0, Math.PI * 2);
    h.fill();
  }
}

function drawBlock(g, h, x, y, width, height, finish, tone, joint, rand, px) {
  const gap = Math.max(1, finish.joint * joint.width * px);
  const bx = x + gap / 2;
  const by = y + gap / 2;
  const bw = width - gap;
  const bh = height - gap;
  if (bw < 2 || bh < 2) return;

  const color = blockColor(tone, rand);
  g.save();
  g.beginPath();
  g.rect(bx, by, bw, bh);
  g.clip();
  g.fillStyle = rgb(color);
  g.fillRect(bx, by, bw, bh);

  h.save();
  h.beginPath();
  h.rect(bx, by, bw, bh);
  h.clip();
  h.fillStyle = '#a0a0a0';
  h.fillRect(bx, by, bw, bh);

  const margin = (joint.margin || finish.margin || 0) * px;
  if (margin > 1.5) {
    g.fillStyle = 'rgba(255, 253, 245, 0.07)';
    g.fillRect(bx + margin, by + margin, bw - margin * 2, bh - margin * 2);
    g.strokeStyle = 'rgba(70, 58, 40, 0.13)';
    g.lineWidth = 1;
    g.strokeRect(
      bx + margin + 0.5,
      by + margin + 0.5,
      bw - margin * 2 - 1,
      bh - margin * 2 - 1
    );
    h.strokeStyle = '#c4c4c4';
    h.lineWidth = 1;
    h.strokeRect(
      bx + margin + 0.5,
      by + margin + 0.5,
      bw - margin * 2 - 1,
      bh - margin * 2 - 1
    );
  }

  paintMarks(g, h, finish, bx, by, bw, bh, rand, px);

  if (joint.rebate) {
    const depth = Math.max(2, joint.rebate * px);
    g.fillStyle = 'rgba(58, 47, 31, 0.18)';
    g.fillRect(bx, by + bh - depth, bw, depth);
    h.fillStyle = '#5a5a5a';
    h.fillRect(bx, by + bh - depth, bw, depth);
  }

  g.fillStyle = 'rgba(255, 252, 240, 0.1)';
  g.fillRect(bx, by, bw, 1);
  g.fillStyle = 'rgba(54, 43, 29, 0.13)';
  g.fillRect(bx, by + bh - 1, bw, 1);
  h.fillStyle = '#d2d2d2';
  h.fillRect(bx, by, bw, 1);
  h.fillStyle = '#6a6a6a';
  h.fillRect(bx, by + bh - 1, bw, 1);

  g.restore();
  h.restore();

  g.fillStyle = 'rgba(42, 32, 22, 0.12)';
  g.fillRect(bx, by + bh - Math.max(1, gap / 2), bw, Math.max(1, gap / 2));
  h.fillStyle = '#3c3c3c';
  h.fillRect(bx, by + bh - Math.max(1, gap / 2), bw, Math.max(1, gap / 2));
}

function drawStone(finish, tone, joint, size) {
  const map = makeCanvas(size);
  const bump = makeCanvas(size);
  const g = map.getContext('2d');
  const h = bump.getContext('2d');
  const rand = rng(seedOf(`${finish.key}|${tone.key}|${joint.key}`));
  const px = size / TEXTURE_METERS;

  g.fillStyle = rgb(tone.mortar);
  g.fillRect(0, 0, size, size);
  h.fillStyle = '#484848';
  h.fillRect(0, 0, size, size);

  const heights = courseHeights(finish, rand);
  let y = 0;
  for (let course = 0; course < heights.length; course += 1) {
    const height = heights[course] * px;
    let x = -rand() * 0.6 * px;
    while (x < size) {
      const width =
        (finish.block[0] +
          rand() * (finish.block[1] - finish.block[0])) *
        px;
      drawBlock(g, h, x, y, width, height, finish, tone, joint, rand, px);
      if (x + width > size) {
        drawBlock(
          g,
          h,
          x - size,
          y,
          width,
          height,
          finish,
          tone,
          joint,
          rand,
          px
        );
      }
      if (x < 0) {
        drawBlock(
          g,
          h,
          x + size,
          y,
          width,
          height,
          finish,
          tone,
          joint,
          rand,
          px
        );
      }
      x += width;
    }
    y += height;
  }

  for (let i = 0; i < size * 1.4; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const alpha = 0.02 + rand() * 0.09;
    g.fillStyle = `rgba(68, 55, 36, ${alpha})`;
    g.fillRect(x, y, 1, 1);
    h.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    h.fillRect(x, y, 1, 1);
  }

  return { map, bump };
}

function drawTrim(tone, size) {
  const map = makeCanvas(size);
  const bump = makeCanvas(size);
  const g = map.getContext('2d');
  const h = bump.getContext('2d');
  const rand = rng(seedOf(`trim|${tone.key}`));

  g.fillStyle = rgb(tone.trim);
  g.fillRect(0, 0, size, size);
  h.fillStyle = '#a8a8a8';
  h.fillRect(0, 0, size, size);

  for (let i = 0; i < size * 6; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const alpha = 0.02 + rand() * 0.08;
    g.fillStyle =
      rand() < 0.55
        ? `rgba(98, 82, 57, ${alpha})`
        : `rgba(255, 253, 245, ${alpha})`;
    g.fillRect(x, y, 1, 1);
    h.fillStyle = rand() < 0.5 ? '#888888' : '#c8c8c8';
    h.fillRect(x, y, 1, 1);
  }

  return { map, bump };
}

function drawTiles(style, size) {
  const map = makeCanvas(size);
  const bump = makeCanvas(size);
  const g = map.getContext('2d');
  const h = bump.getContext('2d');
  const rand = rng(seedOf(`roof|${style.key}`));
  const px = size / TEXTURE_METERS;

  g.fillStyle = rgb(style.mortar);
  g.fillRect(0, 0, size, size);
  h.fillStyle = '#3d3d3d';
  h.fillRect(0, 0, size, size);

  const columns = style.flat ? 1 : 8;
  const rows = style.flat ? 1 : 6;
  const tileWidth = size / columns;
  const tileHeight = size / rows;

  if (style.flat) {
    g.fillStyle = rgb(style.base);
    g.fillRect(0, 0, size, size);
    h.fillStyle = '#a0a0a0';
    h.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const value = 0.03 + rand() * 0.12;
      g.fillStyle =
        rand() < 0.5
          ? `rgba(78, 70, 58, ${value})`
          : `rgba(255, 252, 240, ${value})`;
      g.fillRect(x, y, 1 + rand() * 2, 1 + rand() * 2);
      h.fillStyle = rand() < 0.5 ? '#7e7e7e' : '#c2c2c2';
      h.fillRect(x, y, 1, 1);
    }
  } else {
    for (let row = 0; row < rows; row += 1) {
      const y = row * tileHeight;
      const offset = row % 2 ? tileWidth / 2 : 0;
      for (let column = -1; column <= columns; column += 1) {
        const x = column * tileWidth + offset;
        const tint = (rand() - 0.5) * 20;
        const grad = g.createLinearGradient(x, y, x + tileWidth, y);
        grad.addColorStop(
          0,
          rgb(style.edge.map((value) => value + tint * 0.6))
        );
        grad.addColorStop(
          0.5,
          rgb(style.base.map((value) => value + tint))
        );
        grad.addColorStop(
          1,
          rgb(style.edge.map((value) => value + tint * 0.6))
        );
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(x + 1, y + tileHeight - 2);
        g.lineTo(x + 1, y + tileHeight * 0.3);
        g.quadraticCurveTo(
          x + tileWidth / 2,
          y - tileHeight * 0.12,
          x + tileWidth - 1,
          y + tileHeight * 0.3
        );
        g.lineTo(x + tileWidth - 1, y + tileHeight - 2);
        g.closePath();
        g.fill();

        g.strokeStyle = 'rgba(255, 226, 198, 0.16)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + 2, y + tileHeight * 0.33);
        g.quadraticCurveTo(
          x + tileWidth / 2,
          y - tileHeight * 0.08,
          x + tileWidth - 2,
          y + tileHeight * 0.33
        );
        g.stroke();

        h.fillStyle = '#c2c2c2';
        h.beginPath();
        h.moveTo(x + 1, y + tileHeight - 2);
        h.lineTo(x + 1, y + tileHeight * 0.3);
        h.quadraticCurveTo(
          x + tileWidth / 2,
          y - tileHeight * 0.12,
          x + tileWidth - 1,
          y + tileHeight * 0.3
        );
        h.lineTo(x + tileWidth - 1, y + tileHeight - 2);
        h.closePath();
        h.fill();
      }
      g.fillStyle = 'rgba(43, 20, 14, 0.32)';
      g.fillRect(0, y + tileHeight - 3, size, 3);
      h.fillStyle = '#303030';
      h.fillRect(0, y + tileHeight - 3, size, 3);
    }
  }

  for (let i = 0; i < 260; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const alpha = 0.03 + rand() * 0.11;
    g.fillStyle =
      rand() < 0.5
        ? `rgba(55, 40, 30, ${alpha})`
        : `rgba(85, 95, 60, ${alpha})`;
    g.beginPath();
    g.arc(x, y, 2 + rand() * 10, 0, Math.PI * 2);
    g.fill();
  }

  return { map, bump };
}

function drawConcrete(size) {
  const map = makeCanvas(size);
  const g = map.getContext('2d');
  const rand = rng(seedOf('concrete'));
  g.fillStyle = 'rgb(199, 193, 181)';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 8; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    g.fillStyle =
      rand() < 0.5
        ? `rgba(85, 78, 66, ${0.02 + rand() * 0.08})`
        : `rgba(255, 252, 242, ${0.02 + rand() * 0.1})`;
    g.fillRect(x, y, 1, 1);
  }
  return map;
}

function drawGrass(size) {
  const map = makeCanvas(size);
  const g = map.getContext('2d');
  const rand = rng(seedOf('grass'));
  g.fillStyle = 'rgb(84, 101, 57)';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * 0.34; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const tint = rand();
    g.fillStyle =
      tint < 0.3
        ? 'rgba(61, 82, 39, 0.6)'
        : tint < 0.62
          ? 'rgba(104, 124, 63, 0.55)'
          : tint < 0.86
            ? 'rgba(132, 139, 79, 0.48)'
            : 'rgba(99, 86, 58, 0.42)';
    g.fillRect(x, y, 1.2, 2 + rand() * 4);
  }
  return map;
}

function textureFromCanvas(canvas, { srgb = false, repeat = null } = {}) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = SRGBColorSpace;
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
  return texture;
}

function evict(cache, max) {
  if (cache.size <= max) return;
  const entries = [...cache.entries()].sort(
    (a, b) => a[1].used - b[1].used
  );
  while (cache.size > max) {
    const [key, entry] = entries.shift();
    entry.map?.dispose();
    entry.bump?.dispose();
    cache.delete(key);
  }
}

function stoneEntry(finish, tone, joint) {
  const size = canvasSize();
  const key = `${finish.key}|${tone.key}|${joint.key}|${size}`;
  const existing = stoneCache.get(key);
  if (existing) {
    existing.used = ++cacheTick;
    return existing;
  }

  const { map, bump } = drawStone(finish, tone, joint, size);
  const entry = {
    map: textureFromCanvas(map, { srgb: true, repeat: [0.5, 0.5] }),
    bump: textureFromCanvas(bump, { repeat: [0.5, 0.5] }),
    used: ++cacheTick
  };
  stoneCache.set(key, entry);
  evict(stoneCache, MAX_STONE_TEXTURES);
  return entry;
}

function trimEntry(tone) {
  const key = tone.key;
  const existing = trimCache.get(key);
  if (existing) {
    existing.used = ++cacheTick;
    return existing;
  }

  const { map, bump } = drawTrim(tone, 256);
  const entry = {
    map: textureFromCanvas(map, { srgb: true, repeat: [2, 2] }),
    bump: textureFromCanvas(bump, { repeat: [2, 2] }),
    used: ++cacheTick
  };
  trimCache.set(key, entry);
  evict(trimCache, MAX_SMALL_TEXTURES);
  return entry;
}

function roofEntry(style) {
  const key = style.key;
  const existing = roofCache.get(key);
  if (existing) {
    existing.used = ++cacheTick;
    return existing;
  }

  const { map, bump } = drawTiles(style, 512);
  const entry = {
    map: textureFromCanvas(map, { srgb: true, repeat: [0.5, 0.5] }),
    bump: textureFromCanvas(bump, { repeat: [0.5, 0.5] }),
    used: ++cacheTick
  };
  roofCache.set(key, entry);
  evict(roofCache, MAX_SMALL_TEXTURES);
  return entry;
}

function concreteEntry() {
  const existing = surfaceCache.get('concrete');
  if (existing) {
    existing.used = ++cacheTick;
    return existing;
  }
  const entry = {
    map: textureFromCanvas(drawConcrete(256), {
      srgb: true,
      repeat: [0.5, 0.5]
    }),
    used: ++cacheTick
  };
  surfaceCache.set('concrete', entry);
  evict(surfaceCache, MAX_SMALL_TEXTURES);
  return entry;
}

export function findOption(options, key, fallbackKey) {
  return (
    options.find((option) => option.key === key) ??
    options.find((option) => option.key === fallbackKey) ??
    options[0]
  );
}

export function resolveMaterialState(state = {}) {
  const next = { ...DEFAULT_MATERIAL_STATE, ...state };
  const finish = findOption(
    STONE_FINISHES,
    next.finish,
    DEFAULT_MATERIAL_STATE.finish
  );
  const tone = findOption(STONE_TONES, next.tone, DEFAULT_MATERIAL_STATE.tone);
  const joint = findOption(
    JOINT_STYLES,
    next.joint,
    DEFAULT_MATERIAL_STATE.joint
  );
  const frame = findOption(
    FRAME_STYLES,
    next.frame,
    DEFAULT_MATERIAL_STATE.frame
  );
  const roof = findOption(ROOF_STYLES, next.roof, DEFAULT_MATERIAL_STATE.roof);
  return {
    state: {
      finish: finish.key,
      tone: tone.key,
      joint: joint.key,
      frame: frame.key,
      roof: roof.key
    },
    finish,
    tone,
    joint,
    frame,
    roof
  };
}

export function createMaterials(
  state = DEFAULT_MATERIAL_STATE,
  { textures = hasCanvas() } = {}
) {
  const materials = {
    wall: new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0,
      side: DoubleSide
    }),
    soil: new MeshStandardMaterial({
      color: 0x81735f,
      roughness: 1,
      metalness: 0,
      side: DoubleSide
    }),
    slab: new MeshStandardMaterial({
      color: 0xcfc8b9,
      roughness: 0.9,
      metalness: 0
    }),
    trim: new MeshStandardMaterial({
      color: 0xd9d1bf,
      roughness: 0.86,
      metalness: 0
    }),
    roofTop: new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0
    }),
    roofSide: new MeshStandardMaterial({
      color: 0x8e4932,
      roughness: 0.86,
      metalness: 0
    }),
    frame: new MeshStandardMaterial({
      color: 0x1d2627,
      roughness: 0.42,
      metalness: 0.42
    }),
    iron: new MeshStandardMaterial({
      color: 0x202526,
      roughness: 0.55,
      metalness: 0.25
    }),
    glass: new MeshPhysicalMaterial({
      color: 0xbfd9de,
      transparent: true,
      opacity: 0.36,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      side: DoubleSide,
      depthWrite: false
    }),
    doorGlass: new MeshPhysicalMaterial({
      color: 0x78969b,
      transparent: true,
      opacity: 0.52,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.12,
      side: DoubleSide,
      depthWrite: false
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
  materials.roof = materials.roofSide;

  applyMaterialState(materials, state, { textures });
  return materials;
}

export function applyMaterialState(
  materials,
  state = DEFAULT_MATERIAL_STATE,
  { textures = hasCanvas() } = {}
) {
  const resolved = resolveMaterialState(state);
  const { finish, tone, joint, frame, roof } = resolved;

  if (textures) {
    const stone = stoneEntry(finish, tone, joint);
    setTexture(materials.wall, 'map', stone.map);
    setTexture(materials.wall, 'bumpMap', stone.bump);
    materials.wall.bumpScale = finish.bumpScale ?? 0.03;
    materials.wall.color.set(0xffffff);
    materials.wall.roughness = finish.roughness ?? 0.94;

    const grain = trimEntry(tone);
    setTexture(materials.trim, 'map', grain.map);
    setTexture(materials.trim, 'bumpMap', grain.bump);
    materials.trim.bumpScale = 0.006;
    materials.trim.color.set(0xffffff);
    materials.trim.roughness = 0.82;

    const concrete = concreteEntry();
    setTexture(materials.slab, 'map', concrete.map);
    materials.slab.color.set(0xffffff);
    materials.slab.roughness = 0.92;

    const tile = roofEntry(roof);
    setTexture(materials.roofTop, 'map', tile.map);
    setTexture(materials.roofTop, 'bumpMap', tile.bump);
    materials.roofTop.bumpScale = 0.012;
    materials.roofTop.color.set(0xffffff);
    materials.roofTop.roughness = roof.roughness ?? 0.86;
    materials.roofSide.color.setHex(roof.sideColor);
    materials.roofSide.roughness = roof.roughness ?? 0.86;
  } else {
    setTexture(materials.wall, 'map', null);
    setTexture(materials.wall, 'bumpMap', null);
    assignColor(materials.wall, tone.base);
    materials.wall.roughness = finish.roughness ?? 0.94;

    setTexture(materials.trim, 'map', null);
    setTexture(materials.trim, 'bumpMap', null);
    assignColor(materials.trim, tone.trim);

    setTexture(materials.slab, 'map', null);
    materials.slab.color.setHex(0xcfc8b9);

    setTexture(materials.roofTop, 'map', null);
    setTexture(materials.roofTop, 'bumpMap', null);
    materials.roofTop.color.setHex(roof.flat ? 0xbdb6a8 : roof.sideColor);
    materials.roofSide.color.setHex(roof.sideColor);
  }

  materials.frame.color.setHex(frame.color);
  materials.frame.roughness = frame.roughness;
  materials.frame.metalness = frame.metalness;
  materials.iron.color.setHex(frame.key === 'wood' ? 0x3b2c20 : 0x202526);
  materials.iron.roughness = frame.key === 'wood' ? 0.62 : 0.55;
  materials.iron.metalness = frame.key === 'wood' ? 0.12 : 0.25;

  return resolved;
}

export function createGroundMaterial() {
  if (!hasCanvas()) {
    return new MeshStandardMaterial({ color: 0x65715b, roughness: 1 });
  }
  const texture = textureFromCanvas(drawGrass(512), {
    srgb: true,
    repeat: [24, 24]
  });
  return new MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 1,
    metalness: 0
  });
}
