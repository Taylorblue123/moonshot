// clouds.frag — procedural painterly cumulus band.
//
// A soft, billowy horizontal band of cloud generated with value-noise fbm.
// The band:
//   • scrolls horizontally by uWind (broadcast wind; see plan.md §4),
//   • is masked to a vertical band centred on uHeight,
//   • has its amount of sky-cover controlled by uCoverage,
//   • is tinted by uTint,
//   • outputs ALPHA so the sky layer shows through the gaps.
//
// Procedural-first per plan §7. No color/threshold is hardcoded as a tunable —
// every knob arrives as a uniform seeded from params.{clouds,wind}.
//
// Seamless scroll: fbm is sampled at a continuous coordinate (vUv.x*scale +
// uWind), so there is no tiling seam as uWind grows.

precision highp float;

uniform float uTime;     // elapsed seconds (slow internal evolution)
uniform float uWind;     // accumulated horizontal scroll offset
uniform float uCoverage; // 0..1 — more coverage = lower threshold = more cloud
uniform float uHeight;   // 0..1 — vertical centre of the cloud band
uniform vec3  uTint;     // cloud color

varying vec2 vUv;

// --- value noise -----------------------------------------------------------
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // smooth (quintic) interpolation for soft, painterly edges
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// fractal brownian motion — stacked octaves = billowy cumulus
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * valueNoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  // Horizontal scroll from wind; a tiny vertical wobble over time keeps the
  // band from looking like a rigid sliding texture.
  vec2 p = vec2(vUv.x * 3.0 + uWind, vUv.y * 2.0 + uTime * 0.01);

  float n = fbm(p);

  // Vertical band mask: cloud lives near uHeight, fades above/below.
  float band = 1.0 - smoothstep(0.0, 0.35, abs(vUv.y - uHeight));

  // Coverage maps to a density threshold: higher coverage -> lower threshold
  // so more of the noise survives as cloud. Soft edge via smoothstep.
  float threshold = mix(0.75, 0.30, clamp(uCoverage, 0.0, 1.0));
  float density = smoothstep(threshold, threshold + 0.25, n) * band;

  // Subtle internal shading so cumulus reads as volumetric, not flat.
  float shade = mix(0.82, 1.0, smoothstep(0.3, 0.9, n));
  vec3 color = uTint * shade;

  gl_FragColor = vec4(color, clamp(density, 0.0, 1.0));
}
