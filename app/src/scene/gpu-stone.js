import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three';

const TEXTURE_METERS = 2;
const TEXTURE_REPEAT = 1 / TEXTURE_METERS;
const HMIN = -0.014;
const HMAX = 0.07;

const STYLE_INDEX = {
  rock: 0,
  pick: 1,
  sesame: 2,
  barley: 3,
  smooth: 4,
  split: 5,
  comb: 6,
  rubble: 7,
  bush: 8,
  chisel: 9
};

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const NOISE = `
  float h1(float n) {
    return fract(sin(n * 12.9898 + uSeed * 78.233) * 43758.5453);
  }
  float h2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.17) * 43758.5453);
  }
  float vn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x),
      mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vn(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return s;
  }
  float wor(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float d = 9.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(h2(i + g), h2(i + g + 19.7));
        d = min(d, length(g + o - f));
      }
    }
    return d;
  }
`;

const HEIGHT_SHADER = `
  uniform float uP;
  uniform float uSeed;
  uniform float uStyle;
  uniform float uJoint;
  uniform float uJDepth;
  uniform float uMargin;
  uniform float uArris;
  uniform float uRelief;
  uniform float uScale;
  uniform vec2 uCourse;
    uniform vec2 uBlock;
  uniform float uJStyle;
  varying vec2 vUv;

  ${NOISE}

  void main() {
    float y = vUv.y * uP;
    float x = vUv.x * uP;
    float nC = max(1.0, floor(uP / (0.5 * (uCourse.x + uCourse.y)) + 0.5));
    float sumC = 0.0;
    for (int i = 0; i < 20; i++) {
      if (float(i) >= nC) break;
      sumC += mix(uCourse.x, uCourse.y, h1(float(i) + 0.5));
    }
    float kC = uP / sumC;
    float acc = 0.0;
    float ci = 0.0;
    float y0 = 0.0;
    float ch = uP;
    for (int i = 0; i < 20; i++) {
      if (float(i) >= nC) break;
      float hh = mix(uCourse.x, uCourse.y, h1(float(i) + 0.5)) * kC;
      if (y < acc + hh || float(i) == nC - 1.0) {
        ci = float(i);
        y0 = acc;
        ch = hh;
        break;
      }
      acc += hh;
    }
    float nB = max(
      1.0,
      floor(
        uP / (0.5 * (uBlock.x + uBlock.y)) + 0.5 +
        (h1(ci * 5.3 + 2.0) - 0.5) * 0.9
      )
    );
    float off = h1(ci * 7.13 + 3.1) * uP;
    float xu = mod(x - off, uP);
    float sumB = 0.0;
    for (int j = 0; j < 20; j++) {
      if (float(j) >= nB) break;
      sumB += mix(uBlock.x, uBlock.y, h1(ci * 31.7 + float(j) + 11.0));
    }
    float kB = uP / sumB;
    acc = 0.0;
    float bi = 0.0;
    float x0 = 0.0;
    float bw = uP;
    for (int j = 0; j < 20; j++) {
      if (float(j) >= nB) break;
      float ww = mix(uBlock.x, uBlock.y, h1(ci * 31.7 + float(j) + 11.0)) * kB;
      if (xu < acc + ww || float(j) == nB - 1.0) {
        bi = float(j);
        x0 = acc;
        bw = ww;
        break;
      }
      acc += ww;
    }
    float u = xu - x0;
    float v = y - y0;
    float rb = h1(ci * 16.0 + bi + 0.37);
    float rb2 = h1(ci * 16.0 + bi + 5.71);
    vec2 q = vec2(u, v) + vec2(rb * 37.0, rb2 * 53.0) * uScale;
    bool hand =
      uStyle < 1.5 ||
      (uStyle > 4.5 && uStyle < 5.5) ||
      (uStyle > 6.5 && uStyle < 7.5) ||
      uStyle > 8.5;
    float jw = uJoint * 0.18 + (hand ? 0.0015 : 0.0005);
    float e = min(
      min(
        u + (vn(vec2(v * 31.0, rb * 50.0)) - 0.5) * jw,
        bw - u + (vn(vec2(v * 29.0, rb * 70.0 + 9.0)) - 0.5) * jw
      ),
      min(
        v + (vn(vec2(u * 27.0, rb * 40.0 + 3.0)) - 0.5) * jw,
        ch - v + (vn(vec2(u * 33.0, rb * 60.0 + 5.0)) - 0.5) * jw
      )
    ) - 0.5 * uJoint;
    float H;
    float region;
    float mottle = clamp(
      fbm(q * 2.6) * 0.75 + fbm(q * 11.0) * 0.35 - 0.05 -
      0.45 * smoothstep(0.9, 0.97, vn(q * 48.0 + 5.0)),
      0.0,
      1.0
    );
    if (e < 0.0) {
      H = -uJDepth + (vn(q * 900.0) - 0.5) * 0.0008;
      region = 0.0;
    } else {
      float ar = clamp(e / max(uArris, 0.0001), 0.0, 1.0);
      float edge = -uArris * 0.7 * (1.0 - sqrt(ar));
      float face = 0.0;
      float nu = u / bw * 2.0 - 1.0;
      float nv = v / ch * 2.0 - 1.0;
      float fe = e - uMargin;
      if (uStyle < 0.5) {
        float rimW = 0.01 + 0.035 * vn(q * 7.0 + 3.0);
        float rim = smoothstep(0.0, rimW, fe);
        float dome =
          (1.0 - pow(abs(nu), 6.0)) * (1.0 - pow(abs(nv), 5.0));
        float lumps =
          fbm(q * 4.5) * 0.55 +
          fbm(q * 12.0 + 2.0) * 0.3 +
          (1.0 - wor(q * 4.2)) * 0.35;
        float ridge = 1.0 - abs(fbm(q * 9.0 + 4.0) * 2.0 - 1.0);
        face =
          uRelief * rim * (0.25 + 0.75 * dome) *
          (0.3 + 0.8 * lumps + 0.35 * ridge * ridge) +
          (fbm(q * 40.0) - 0.5) * 0.003;
      } else if (uStyle < 1.5) {
        vec2 qd =
          q + (vec2(vn(q * 30.0), vn(q * 30.0 + 7.0)) - 0.5) * 0.009;
        float w = wor(qd * 50.0);
        float w2 = wor(qd * 98.0 + 3.0);
        face =
          -0.0012 + (fbm(q * 4.0) - 0.5) * 0.0035 -
          smoothstep(0.5, 0.0, w) * 0.0042 -
          smoothstep(0.34, 0.0, w2) * 0.0016;
        mottle = clamp(
          mottle + 0.35 * smoothstep(0.2, 0.55, w) - 0.15,
          0.0,
          1.0
        );
      } else if (uStyle < 2.5) {
        vec2 qj =
          q + (vec2(vn(q * 40.0), vn(q * 40.0 + 3.0)) - 0.5) * 0.006;
        float w3 = wor(qj * 58.0);
        float w4 = wor(q * 210.0 + 7.0);
        float dt =
          smoothstep(0.3, 0.17, w3) *
          step(0.22, h2(floor(qj * 58.0)));
        face =
          -0.0005 + (fbm(q * 3.5) - 0.5) * 0.0012 -
          dt * 0.0008 -
          smoothstep(0.3, 0.0, w4) * 0.0007 +
          (vn(q * 600.0) - 0.5) * 0.0004;
        mottle = dt > 0.5 ? 1.0 : min(mottle * 0.75, 0.9);
      } else if (uStyle < 3.5) {
        float an = 1.05 + (rb - 0.5) * 0.25;
        vec2 r = vec2(
          q.x * cos(an) + q.y * sin(an),
          -q.x * sin(an) + q.y * cos(an)
        );
        float sp = 0.008;
        float row = floor(r.y / sp);
        float tt = fract(r.y / sp);
        float sl = 0.019;
        float so = h1(row * 3.7 + rb * 91.0) * sl;
        float cell = floor((r.x + so) / sl);
        float sx = fract((r.x + so) / sl);
        float on =
          smoothstep(0.08, 0.2, sx) *
          smoothstep(0.92, 0.8, sx) *
          step(0.18, h2(vec2(row, cell)));
        face =
          -0.0006 + (fbm(q * 3.5) - 0.5) * 0.0014 -
          0.0022 *
          (1.0 - smoothstep(0.0, 0.34, abs(tt - 0.5))) *
          on;
      } else if (uStyle < 4.5) {
        face =
          (fbm(q * 3.0) - 0.5) * 0.0006 +
          (vn(q * 500.0) - 0.5) * 0.00018;
        mottle = clamp(
          mix(
            mottle,
            vn(vec2(q.x * 2.2, q.y * 26.0) + rb * 9.0),
            0.55
          ) +
          0.25 * (vn(vec2(q.x * 6.0, q.y * 90.0)) - 0.5),
          0.0,
          1.0
        );
      } else if (uStyle < 5.5) {
        vec2 qs = vec2(q.x * 0.8, q.y * 1.6);
        float f = fbm(qs * 5.0 + 2.0) * 0.75 + fbm(qs * 13.0) * 0.25;
        float tr = floor(f * 6.0) / 6.0 + smoothstep(0.0, 0.18, fract(f * 6.0)) / 6.0;
        float rim2 = smoothstep(0.0, 0.025, fe);
        face = uRelief * rim2 * (0.3 + 0.7 * tr) + (fbm(q * 34.0) - 0.5) * 0.0025;
        mottle = clamp(mottle * 0.7 + tr * 0.5, 0.0, 1.0);
      } else if (uStyle < 6.5) {
        float gx = q.x / 0.0055;
        float g = abs(fract(gx) - 0.5) * 2.0;
        float wob = (vn(vec2(floor(gx), q.y * 40.0)) - 0.5) * 0.3;
        face =
          (fbm(q * 3.0) - 0.5) * 0.0008 -
          0.001 * smoothstep(0.35 + wob, 0.0, g);
      } else if (uStyle < 7.5) {
        float w5 = wor(q * 26.0);
        float cut = smoothstep(0.0, 0.2, w5);
        face =
          uRelief * smoothstep(0.0, 0.03, fe) *
          (0.4 + 0.6 * fbm(q * 9.0)) *
          (0.6 + 0.4 * cut) +
          (fbm(q * 40.0) - 0.5) * 0.0015;
      } else if (uStyle < 8.5) {
        face =
          -0.0003 + (vn(q * 900.0) - 0.5) * 0.0007 +
          (vn(q * 380.0 + 3.0) - 0.5) * 0.0006 -
          smoothstep(0.3, 0.0, wor(q * 260.0)) * 0.0006 +
          (fbm(q * 3.0) - 0.5) * 0.0007;
        mottle = clamp(mottle + (vn(q * 420.0) - 0.5) * 0.25, 0.0, 1.0);
      } else {
        float ca = -0.6 + (rb - 0.5) * 0.5;
        vec2 qr = vec2(
          q.x * cos(ca) - q.y * sin(ca),
          q.x * sin(ca) + q.y * cos(ca)
        ) * vec2(0.62, 1.0);
        qr += (vec2(vn(q * 9.0), vn(q * 9.0 + 4.0)) - 0.5) * 0.03;
        float sc = mix(28.0, 44.0, vn(q * 4.0 + 2.0));
        float f1 = wor(qr * sc);
        float f2 = wor(qr * sc * 2.1 + 5.0);
        face =
          -0.0045 * max(0.0, 1.0 - f1 * f1 / 0.5) -
          0.0012 * max(0.0, 1.0 - f2 * f2 / 0.45) +
          (fbm(q * 5.0) - 0.5) * 0.004 +
          (vn(qr * vec2(320.0, 40.0)) - 0.5) * 0.0004;
        mottle = clamp(
          mottle * 0.8 + 0.3 * smoothstep(0.35, 0.75, f1),
          0.0,
          1.0
        );
      }
      float mH = (vn(q * 420.0) - 0.5) * 0.00025;
      float inM = uMargin > 0.0 ? smoothstep(0.0, 0.003, fe) : 1.0;
      H = edge + mix(mH, face, inM);
      region = inM < 0.5 ? 0.3 : 0.5 + 0.5 * mottle;
      float et = (ch - v) - 0.5 * uJoint;
      if (uJStyle > 1.5 && et < 0.028) {
        float st = smoothstep(0.024, 0.028, et);
        H = mix(-0.0055 + mH + edge, H, st);
        region = st > 0.5 ? region : 0.3;
      }
      if (hand) {
        float chip =
          smoothstep(0.62, 0.8, vn(q * 22.0 + 11.0)) *
          (1.0 - smoothstep(0.004, 0.018, e));
        H -= chip * 0.006 * (0.6 + 0.4 * fbm(q * 90.0));
      }
    }
    float hv = clamp((H - ${HMIN.toFixed(4)}) / ${(HMAX - HMIN).toFixed(4)}, 0.0, 1.0) * 65535.0;
    float hi = floor(hv / 256.0);
    float lo = hv - hi * 256.0;
    gl_FragColor = vec4(hi / 255.0, lo / 255.0, rb, region);
  }
`;

const NORMAL_SHADER = `
  uniform sampler2D tH;
  uniform vec2 uTexel;
  uniform float uMpp;
  uniform float uCav;
  varying vec2 vUv;

  float hg(vec2 uv) {
    vec4 t = texture2D(tH, uv);
    return (t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0 *
      ${(HMAX - HMIN).toFixed(4)} + ${HMIN.toFixed(4)};
  }

  void main() {
    float c = hg(vUv);
    float l = hg(vUv - vec2(uTexel.x, 0.0));
    float r = hg(vUv + vec2(uTexel.x, 0.0));
    float d = hg(vUv - vec2(0.0, uTexel.y));
    float u = hg(vUv + vec2(0.0, uTexel.y));
    vec3 n = normalize(
      vec3((l - r) / (2.0 * uMpp), (d - u) / (2.0 * uMpp), 1.0)
    );
    float s = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982 + 0.3;
      vec2 o = vec2(cos(a), sin(a));
      s += hg(vUv + o * uTexel * 3.0);
      s += hg(vUv + o * uTexel * 8.0);
      s += hg(vUv + o * uTexel * 18.0);
    }
    float ao = clamp(1.0 - max(0.0, s / 24.0 - c) * uCav, 0.32, 1.0);
    gl_FragColor = vec4(n * 0.5 + 0.5, ao);
  }
`;

const COLOR_SHADER = `
  uniform sampler2D tH;
  uniform sampler2D tN;
  uniform vec3 uBase;
  uniform vec3 uAlt;
  uniform float uAltP;
  uniform vec3 uMortar;
  uniform float uVar;
  uniform float uWarm;
  uniform float uSeed;
  uniform float uStyle;
  varying vec2 vUv;

  void main() {
    vec4 th = texture2D(tH, vUv);
    vec4 tn = texture2D(tN, vUv);
    float R = th.a;
    float rb = th.b;
    float ao = tn.a;
    float t1 =
      fract(sin(rb * 91.7 + 3.1 + uSeed) * 43758.5) * 2.0 - 1.0;
    float t2 =
      fract(sin(rb * 47.3 + 7.7) * 24634.6) * 2.0 - 1.0;
    float t3 = fract(sin(rb * 13.1 + 1.3) * 9134.7);
    vec3 col;
    if (R < 0.12) {
      col = uMortar * (
        0.92 +
        0.16 * fract(sin(dot(vUv * 4096.0, vec2(12.9898, 78.233))) * 43758.5453)
      );
    } else {
      float t4 = fract(sin(rb * 71.9 + 2.3) * 15731.7);
      col = (
        t4 < uAltP
          ? mix(uAlt, uBase, 0.25 * t2 + 0.15)
          : uBase
      ) * (1.0 + uVar * t1);
      col += vec3(1.0, 0.25, -0.9) * uWarm * t2;
      if (t3 > 0.87) {
        col *= vec3(0.94, 0.955, 0.985);
      } else if (t3 < 0.1) {
        col *= vec3(1.015, 0.975, 0.875);
      } else if (t3 < 0.16) {
        col *= vec3(1.0, 0.965, 0.94);
      }
      if (R < 0.4) {
        col *= 1.06;
      } else {
        float m = (R - 0.5) * 2.0;
        if (uStyle > 1.5 && uStyle < 2.5) {
          col *= R > 0.985 ? 1.24 : 0.94 + 0.1 * m;
        } else {
          col *= 0.95 + 0.1 * m;
        }
      }
    }
    col *= mix(1.0, ao, R < 0.12 ? 0.55 : 0.9);
    gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
  }
`;

let generator = null;
let generatorFailed = false;

function createGenerator() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const renderer = new WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(1);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new Mesh(new PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const material = (fragmentShader, uniforms) =>
    new ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    });

  return {
    renderer,
    scene,
    camera,
    quad,
    height: material(HEIGHT_SHADER, {
      uP: { value: TEXTURE_METERS },
      uSeed: { value: 1 },
      uStyle: { value: 2 },
      uJoint: { value: 0.006 },
      uJDepth: { value: 0.005 },
      uMargin: { value: 0 },
      uArris: { value: 0.003 },
      uRelief: { value: 0 },
      uScale: { value: 1 },
      uCourse: { value: new Vector2(0.3, 0.3) },
      uBlock: { value: new Vector2(0.45, 0.85) },
      uJStyle: { value: 0 }
    }),
    normal: material(NORMAL_SHADER, {
      tH: { value: null },
      uTexel: { value: new Vector2() },
      uMpp: { value: 0.001 },
      uCav: { value: 70 }
    }),
    color: material(COLOR_SHADER, {
      tH: { value: null },
      tN: { value: null },
      uStyle: { value: 2 },
      uAlt: { value: new Color() },
      uAltP: { value: 0 },
      uBase: { value: new Color() },
      uMortar: { value: new Color() },
      uVar: { value: 0.07 },
      uWarm: { value: 0.012 },
      uSeed: { value: 1 }
    })
  };
}

function failGenerator(error, message) {
  generatorFailed = true;
  if (generator) {
    try {
      generator.renderer.dispose();
    } catch {
      // The context may already be gone; the fallback still works.
    }
    generator = null;
  }
  console.warn(message, error);
}

function getGenerator() {
  if (generator) return generator;
  if (generatorFailed) return null;
  try {
    generator = createGenerator();
  } catch (error) {
    failGenerator(error, 'GPU stone generator unavailable; using Canvas2D fallback.');
  }
  return generator;
}

function target(size, { smooth = false } = {}) {
  const filter = smooth ? LinearFilter : NearestFilter;
  return new WebGLRenderTarget(size, size, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: filter,
    magFilter: filter,
    format: RGBAFormat,
    type: UnsignedByteType,
    generateMipmaps: false,
    colorSpace: NoColorSpace
  });
}

function renderPass(gen, material, destination) {
  const previous = gen.renderer.getRenderTarget();
  const previousAutoClear = gen.renderer.autoClear;
  gen.quad.material = material;
  gen.renderer.autoClear = true;
  gen.renderer.setRenderTarget(destination);
  gen.renderer.render(gen.scene, gen.camera);
  gen.renderer.setRenderTarget(previous);
  gen.renderer.autoClear = previousAutoClear;
}

function linear(color) {
  return [
    Math.pow(color[0] / 255, 2.2),
    Math.pow(color[1] / 255, 2.2),
    Math.pow(color[2] / 255, 2.2)
  ];
}

function dataTexture(
  data,
  size,
  { srgb = false, anisotropy = 1, repeat = [TEXTURE_REPEAT, TEXTURE_REPEAT] } = {}
) {
  const texture = new DataTexture(
    data,
    size,
    size,
    RGBAFormat,
    UnsignedByteType
  );
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // Wall UVs are in metres; one 2 m texture tile is half a UV unit.
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = anisotropy;
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function gpuStoneTextures(finish, tone, joint, size) {
  const gen = getGenerator();
  if (!gen) return null;

  let height = null;
  let normal = null;
  let color = null;

  try {
    const actualSize = Math.min(
      size,
      gen.renderer.capabilities.maxTextureSize || size
    );
    const anisotropy = Math.min(
      8,
      gen.renderer.capabilities.getMaxAnisotropy?.() || 1
    );
    height = target(actualSize);
    normal = target(actualSize, { smooth: true });
    color = target(actualSize, { smooth: true });

    const h = gen.height.uniforms;
    h.uSeed.value = 3 + finish.key.length * 7.31;
    h.uStyle.value = STYLE_INDEX[finish.style] ?? 0;
    // Canvas2D parity: the selected joint style widens the gap.
    h.uJoint.value = finish.joint * joint.width;
    h.uJDepth.value = finish.jdepth ?? 0.005;
    // Canvas2D parity: an explicit joint margin overrides the finish margin.
    h.uMargin.value = joint.margin || finish.margin || 0;
    h.uArris.value = finish.arris ?? 0.003;
    h.uRelief.value = finish.relief ?? 0;
    h.uCourse.value.set(finish.course[0], finish.course[1]);
    h.uBlock.value.set(finish.block[0], finish.block[1]);
    h.uJStyle.value =
      joint.key === 'rebate' ? 2 : joint.key === 'margin' ? 1 : 0;
    renderPass(gen, gen.height, height);

    const n = gen.normal.uniforms;
    n.tH.value = height.texture;
    n.uTexel.value.set(1 / actualSize, 1 / actualSize);
    n.uMpp.value = TEXTURE_METERS / actualSize;
    n.uCav.value = finish.cav ?? 70;
    renderPass(gen, gen.normal, normal);

    const c = gen.color.uniforms;
    c.tH.value = height.texture;
    c.tN.value = normal.texture;
    c.uStyle.value = h.uStyle.value;
    c.uBase.value.setRGB(...linear(tone.base));
    c.uAlt.value.setRGB(...linear(tone.alt || tone.base));
    c.uAltP.value = tone.altP || 0;
    c.uMortar.value.setRGB(...linear(tone.mortar));
    c.uVar.value = ((tone.variation || 0) / 255) * 2;
    c.uWarm.value = (tone.warm || 0) / 128;
    c.uSeed.value = finish.key.length;
    renderPass(gen, gen.color, color);

    const normalPixels = new Uint8Array(actualSize * actualSize * 4);
    const colorPixels = new Uint8Array(actualSize * actualSize * 4);
    gen.renderer.readRenderTargetPixels(
      normal,
      0,
      0,
      actualSize,
      actualSize,
      normalPixels
    );
    gen.renderer.readRenderTargetPixels(
      color,
      0,
      0,
      actualSize,
      actualSize,
      colorPixels
    );

    return {
      map: dataTexture(colorPixels, actualSize, {
        srgb: true,
        anisotropy
      }),
      normal: dataTexture(normalPixels, actualSize, { anisotropy })
    };
  } catch (error) {
    failGenerator(
      error,
      'GPU stone generation failed; using Canvas2D fallback.'
    );
    return null;
  } finally {
    height?.dispose();
    normal?.dispose();
    color?.dispose();
  }
}
