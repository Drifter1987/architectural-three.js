import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createGroundMaterial } from './materials.js';

const LIGHTS = {
  morning: {
    sky: 0xc5d7e3,
    sun: 0xffd9bb,
    intensity: 2.1,
    exposure: 1.02,
    hemiSky: 0xe4f0ff,
    hemiGround: 0x4c493e,
    hemi: 1,
    direction: [0.9, 0.5, -0.5]
  },
  noon: {
    sky: 0xb8cbd4,
    sun: 0xfff0dc,
    intensity: 2.6,
    exposure: 1.08,
    hemiSky: 0xeef5ff,
    hemiGround: 0x51493c,
    hemi: 1.15,
    direction: [0.2, 1.2, -0.4]
  },
  afternoon: {
    sky: 0xbfd0d6,
    sun: 0xffd7a5,
    intensity: 2.45,
    exposure: 1.05,
    hemiSky: 0xeaf2ff,
    hemiGround: 0x544a3b,
    hemi: 1.05,
    direction: [0.65, 0.65, -0.65]
  },
  sunset: {
    sky: 0xd8b3a7,
    sun: 0xff9d68,
    intensity: 2.15,
    exposure: 0.98,
    hemiSky: 0xffd7c2,
    hemiGround: 0x4b3d35,
    hemi: 0.9,
    direction: [-0.9, 0.24, -0.4]
  }
};

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function createViewer(container, group) {
  const scene = new Scene();
  scene.background = new Color(0xbfd0d6);
  scene.fog = new Fog(0xbfd0d6, 55, 150);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
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
  controls.autoRotateSpeed = 0.65;

  let dirty = true;
  let autoRotateEnabled = false;
  let tweenFrame = 0;
  let currentLight = 'afternoon';

  const invalidate = () => {
    dirty = true;
  };
  controls.addEventListener('change', invalidate);

  const groundMaterial = createGroundMaterial();
  const ground = new Mesh(new PlaneGeometry(130, 130), groundMaterial);
  ground.name = 'ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground, group);

  const bounds = new Box3().setFromObject(group);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const span = Math.max(size.x, size.z, size.y, 1);

  const views = {
    iso: new Vector3(
      center.x + span * 0.9,
      center.y + span * 0.58,
      center.z - span * 1.15
    ),
    front: new Vector3(
      center.x,
      center.y + size.y * 0.35,
      center.z - span * 1.9
    ),
    side: new Vector3(
      center.x + span * 1.9,
      center.y + size.y * 0.35,
      center.z
    ),
    back: new Vector3(
      center.x,
      center.y + size.y * 0.35,
      center.z + span * 1.9
    ),
    street: new Vector3(
      center.x + span * 0.45,
      center.y + span * 0.18,
      center.z - span * 2.2
    ),
    top: new Vector3(
      center.x,
      center.y + span * 2,
      center.z + span * 0.02
    )
  };

  controls.target.copy(center);
  camera.position.copy(views.iso);
  controls.update();

  const hemisphere = new HemisphereLight(0xeef5ff, 0x51493c, 1.15);
  scene.add(hemisphere);

  const sun = new DirectionalLight(0xfff0dc, 2.5);
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

  function setLight(name) {
    const preset = LIGHTS[name] ?? LIGHTS.afternoon;
    currentLight = LIGHTS[name] ? name : 'afternoon';
    scene.background.setHex(preset.sky);
    scene.fog.color.setHex(preset.sky);
    hemisphere.color.setHex(preset.hemiSky);
    hemisphere.groundColor.setHex(preset.hemiGround);
    hemisphere.intensity = preset.hemi;
    sun.color.setHex(preset.sun);
    sun.intensity = preset.intensity;
    const direction = new Vector3(...preset.direction).normalize();
    sun.position.copy(center).addScaledVector(direction, span * 2.3);
    sun.target.position.copy(center);
    renderer.toneMappingExposure = preset.exposure;
    invalidate();
  }

  function cancelTween() {
    if (!tweenFrame) return;
    cancelAnimationFrame(tweenFrame);
    tweenFrame = 0;
    controls.enabled = true;
    controls.autoRotate = autoRotateEnabled;
  }

  function setView(name, { animate = true } = {}) {
    const destination = views[name] ?? views.iso;
    cancelTween();

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endTarget = center.clone();

    if (!animate || REDUCED_MOTION) {
      camera.position.copy(destination);
      controls.target.copy(endTarget);
      controls.update();
      invalidate();
      return;
    }

    controls.enabled = false;
    controls.autoRotate = false;
    const start = performance.now();
    const duration = 650;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(startPosition, destination, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();
      invalidate();
      if (t < 1) {
        tweenFrame = requestAnimationFrame(tick);
      } else {
        tweenFrame = 0;
        controls.enabled = true;
        controls.autoRotate = autoRotateEnabled;
        controls.update();
        invalidate();
      }
    };

    tweenFrame = requestAnimationFrame(tick);
  }

  function setAutoRotate(value) {
    autoRotateEnabled = Boolean(value);
    controls.autoRotate = autoRotateEnabled && !tweenFrame;
    invalidate();
  }

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
    if (controls.autoRotate) dirty = true;
    controls.update();
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);

  setLight('afternoon');

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
    cancelTween();
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
    groundMaterial.map?.dispose();

    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    dispose,
    info,
    benchmark,
    invalidate,
    setView,
    resetView: () => setView('iso'),
    setAutoRotate,
    setLight,
    get light() {
      return currentLight;
    },
    get camera() {
      return {
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        up: camera.up.toArray(),
        quaternion: camera.quaternion.toArray(),
        distance: camera.position.distanceTo(controls.target),
        autoRotate: controls.autoRotate,
        tweening: Boolean(tweenFrame)
      };
    }
  };
}
