import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SKY = 0xb8cbd4;

export function createViewer(container, group) {
  const scene = new Scene();
  scene.background = new Color(SKY);
  scene.fog = new Fog(SKY, 55, 150);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Interactive villa model');
  container.appendChild(renderer.domElement);

  const camera = new PerspectiveCamera(38, 1, 0.1, 180);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 6;
  controls.maxDistance = 90;
  controls.maxPolarAngle = Math.PI * 0.495;

  let dirty = true;
  const invalidate = () => {
    dirty = true;
  };
  controls.addEventListener('change', invalidate);

  const ground = new Mesh(
    new PlaneGeometry(130, 130),
    new MeshStandardMaterial({ color: 0x65715b, roughness: 1 })
  );
  ground.name = 'ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground, group);

  const bounds = new Box3().setFromObject(group);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const span = Math.max(size.x, size.z, size.y, 1);

  controls.target.copy(center);
  camera.position.set(
    center.x + span * 0.9,
    center.y + span * 0.58,
    center.z - span * 1.15
  );
  controls.update();

  const hemisphere = new HemisphereLight(0xeef5ff, 0x51493c, 1.15);
  scene.add(hemisphere);

  const sun = new DirectionalLight(0xfff0dc, 2.5);
  sun.position.set(
    center.x - span * 0.8,
    center.y + span * 1.15,
    center.z + span * 0.65
  );
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = span * 4;
  sun.shadow.camera.left = -span * 0.9;
  sun.shadow.camera.right = span * 0.9;
  sun.shadow.camera.top = span * 0.9;
  sun.shadow.camera.bottom = -span * 0.9;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  const render = () => {
    controls.update();
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);

  function info() {
    controls.update();
    renderer.render(scene, camera);
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures
    };
  }

  function benchmark(frames = 60) {
    const count = Math.max(1, Math.floor(frames));
    renderer.setAnimationLoop(null);
    controls.update();
    renderer.render(scene, camera);

    const gl = renderer.getContext();
    const pixel = new Uint8Array(4);
    const sync = () => {
      try {
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      } catch {
        // Timing still measures command submission when readback is unavailable.
      }
    };
    sync();

    const start = performance.now();
    for (let i = 0; i < count; i++) {
      renderer.render(scene, camera);
    }
    sync();
    const elapsed = performance.now() - start;

    const result = {
      frames: count,
      msPerFrame: elapsed / count,
      fps: (count * 1000) / elapsed,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    };

    dirty = true;
    renderer.setAnimationLoop(render);
    return result;
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    observer.disconnect();
    controls.removeEventListener('change', invalidate);
    controls.dispose();

    const geometries = new Set();
    const materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (!object.material) return;
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of list) materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();

    renderer.dispose();
    renderer.domElement.remove();
  }

  return { dispose, info, benchmark };
}
