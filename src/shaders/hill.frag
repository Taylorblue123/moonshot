// hill.frag — procedural dark hill mass with an fbm-displaced ridge silhouette.
// Below the ridge = grass-colored ground (painterly fbm shading); above = alpha 0
// so the sky/clouds show through. The ridge and surface "breathe" slowly with the
// broadcast wind. Calm ground by design — the foreground's life signal is the
// fireflies (task_6), not waving grass.
//
// Same value-noise/fbm as clouds.frag, retuned: small amplitude, slow scroll.

precision highp float;

uniform float uWind;      // accumulated horizontal scroll offset (broadcast wind)
uniform float uHillHeight;// 0..1 — baseline height of the ridge line
uniform vec3  uColor;     // grass base color
uniform float uLushness;  // 0..1 — surface fbm amplitude / saturation
uniform float uNightFactor;// 0..1 — darkens the hill into a backlit silhouette at
                          // night so its ridge stays readable against the night sky

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

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
  // Ridge: baseline at uHillHeight, displaced by 1D-ish fbm along x. The scroll
  // (uWind) makes the silhouette breathe; low frequency = broad rolling hills.
  float ridgeNoise = fbm(vec2(vUv.x * 2.0 + uWind, 0.0));
  float ridge = uHillHeight + (ridgeNoise - 0.5) * 0.18;

  // Anti-aliased edge: 1 above the ridge fades to 0 just below it. fwidth keeps
  // the line ~1px regardless of resolution so it never jags.
  float aa = fwidth(vUv.y) * 1.5;
  float below = 1.0 - smoothstep(ridge - aa, ridge + aa, vUv.y);

  // Surface: grass color modulated by a low-amplitude fbm for painterly variation,
  // sampled at a slowly-scrolling coordinate so the ground subtly breathes too.
  float surf = fbm(vec2(vUv.x * 4.0 + uWind * 0.5, vUv.y * 4.0));
  float variation = (surf - 0.5) * mix(0.12, 0.30, clamp(uLushness, 0.0, 1.0));
  vec3 color = uColor * (1.0 + variation);

  // At night the hill drops to a near-black silhouette — clearly darker than the
  // (deep blue-violet) night sky — so the ridge reads as a backlit edge. The sky
  // isn't bright at night, so the hill must go quite dark for the edge to show.
  color *= mix(1.0, 0.12, clamp(uNightFactor, 0.0, 1.0));

  gl_FragColor = vec4(color, below);
}
