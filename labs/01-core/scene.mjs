import * as THREE from 'three';

/** A tiny scene with three wall panels sharing one geometry and material. */
export function buildScene() {
  const root = new THREE.Group();
  root.name = 'lab-01';

  const geometry = new THREE.BoxGeometry(6, 3, 0.3);
  const material = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.92 });

  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `wall-${i}`;
    mesh.position.set(i * 6.4, 1.5, 0);
    root.add(mesh);
  }

  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.name = 'sun';
  sun.position.set(6, 9, 5);
  root.add(sun);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 120);
  camera.position.set(9, 5, 13);
  camera.lookAt(6.4, 1.5, 0);

  return { root, geometry, material, camera, sun };
}

export function stats(root) {
  let objects = 0, meshes = 0, lights = 0, triangles = 0;
  const geometries = new Set(), materials = new Set();

  root.traverse((o) => {
    objects++;
    if (o.isMesh) {
      meshes++;
      geometries.add(o.geometry);
      const g = o.geometry;
      triangles += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      const m = Array.isArray(o.material) ? o.material : [o.material];
      m.forEach((x) => materials.add(x));
    }
    if (o.isLight) lights++;
  });

  return { objects, meshes, lights, triangles, geometries: geometries.size, materials: materials.size };
}

/** Dispose every unique geometry/material once and report how many events fired. */
export function disposeScene(root) {
  const geometries = new Set(), materials = new Set();
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m));
  });

  let geometryDisposals = 0, materialDisposals = 0;
  geometries.forEach((g) => { g.addEventListener('dispose', () => geometryDisposals++); g.dispose(); });
  materials.forEach((m) => { m.addEventListener('dispose', () => materialDisposals++); m.dispose(); });

  return { geometryDisposals, materialDisposals };
}
