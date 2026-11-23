import { Group, Mesh } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Flatten a list of window groups into one mesh per shared material.
 *
 * Window groups are placed in world space, so each source geometry is cloned,
 * transformed by its world matrix and then merged with the others that use the
 * same material. The source groups and materials are left intact; callers must
 * not add the source groups to the scene as well or every part renders twice.
 */
export function batchByMaterial(groups, name = 'window-batch') {
  const byMaterial = new Map();

  for (const group of groups) {
    group.updateMatrixWorld(true);
    group.traverse((object) => {
      if (!object.isMesh || !object.geometry) return;
      const geometry = object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      const list = byMaterial.get(object.material);
      if (list) list.push(geometry);
      else byMaterial.set(object.material, [geometry]);
    });
  }

  const batch = new Group();
  batch.name = name;

  let index = 0;
  for (const [material, geometries] of byMaterial) {
    const merged = mergeGeometries(geometries, false);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;

    const mesh = new Mesh(merged, material);
    mesh.name = `${name}:${index}`;
    mesh.castShadow = material.transparent !== true;
    mesh.receiveShadow = material.transparent !== true;
    batch.add(mesh);
    index += 1;
  }

  return batch;
}
