import * as THREE from 'three';

export const TEX_M = 2; // one stone texture repeats every 2 metres

/**
 * A single planar wall with rectangular holes.
 * Local coordinates: x along the wall, y up, z toward the viewer.
 */
export function wallGeometry({ length, height, z0 = 0, openings = [], inset = 0.003 }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, z0);
  shape.lineTo(length, z0);
  shape.lineTo(length, z0 + height);
  shape.lineTo(0, z0 + height);
  shape.closePath();

  const holes = [];
  for (const o of openings) {
    const x0 = Math.max(inset, Math.min(o.x0, o.x1));
    const x1 = Math.min(length - inset, Math.max(o.x0, o.x1));
    const y0 = Math.max(z0 + inset, Math.min(o.y0, o.y1));
    const y1 = Math.min(z0 + height - inset, Math.max(o.y0, o.y1));
    if (x1 - x0 < 0.05 || y1 - y0 < 0.05) continue;

    const hole = new THREE.Path();
    hole.moveTo(x0, y0);
    hole.lineTo(x0, y1);
    hole.lineTo(x1, y1);
    hole.lineTo(x1, y0);
    hole.closePath();
    shape.holes.push(hole);
    holes.push({ x0, x1, y0, y1 });
  }

  const geometry = new THREE.ShapeGeometry(shape);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    position.setXYZ(i, x, y, 0);
    uv.setXY(i, x / TEX_M, y / TEX_M);
  }

  position.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  return { geometry, holes, length, height, z0 };
}

export function triangleCentroids(geometry) {
  const p = geometry.attributes.position;
  const index = geometry.index;
  const count = index ? index.count : p.count;
  const out = [];
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i + 1) : i + 1;
    const c = index ? index.getX(i + 2) : i + 2;
    out.push([
      (p.getX(a) + p.getX(b) + p.getX(c)) / 3,
      (p.getY(a) + p.getY(b) + p.getY(c)) / 3
    ]);
  }
  return out;
}

export function insideHole([x, y], holes, eps = 1e-6) {
  return holes.some((h) => x > h.x0 - eps && x < h.x1 + eps && y > h.y0 - eps && y < h.y1 + eps);
}
