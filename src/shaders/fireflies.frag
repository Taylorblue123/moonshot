// fireflies.frag — soft radial glow per mote (additive), breathing in/out via a
// per-point alpha pulse. The whole layer fades by day through uNightFactor, so
// fireflies vanish in daylight with no agent intervention. Reads luminous on its
// own (additive); M1.7 bloom will only enhance it.

precision highp float;

uniform float uTime;
uniform float uPulseSpeed;   // alpha-breath rate
uniform vec3  uColor;        // glow tint
uniform float uNightFactor;  // 0..1 — layer-wide day→night visibility

varying float vPulse;

void main() {
  // Distance from the point-sprite center → soft halo.
  vec2 d = gl_PointCoord - vec2(0.5);
  float dist = length(d);
  float halo = smoothstep(0.5, 0.0, dist); // 1 at center, 0 at edge

  // Per-mote breathing pulse, offset by vPulse so they aren't in sync.
  float pulse = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * uPulseSpeed + vPulse));

  float alpha = halo * pulse * uNightFactor;
  // Additive blending: emit color premultiplied by alpha; overlaps brighten.
  gl_FragColor = vec4(uColor * alpha, alpha);
}
