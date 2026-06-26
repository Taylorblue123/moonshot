// sky.frag — smooth vertical sky gradient.
//
// Mixes uHorizonColor (bottom, vUv.y = 0) → uTopColor (top, vUv.y = 1).
// BOTH endpoints come from uniforms derived from params.timeOfDay (via
// skyRamp.js) — NO color is hardcoded here (M1 DoD #4 / task_2 acceptance).
//
// Banding mitigation: smoothstep eases the interpolation, and we mix in a
// roughly-linear space (square the colors, lerp, then sqrt back ≈ gamma 2.0)
// so equal UV steps don't clump into visible bands in the sRGB output.

precision highp float;

uniform vec3 uTopColor;
uniform vec3 uHorizonColor;

varying vec2 vUv;

void main() {
  // Ease the vertical blend to avoid a hard linear ramp.
  float t = smoothstep(0.0, 1.0, vUv.y);

  // Interpolate in ~linear space to reduce sRGB banding, then back to gamma.
  vec3 topLin = uTopColor * uTopColor;
  vec3 horLin = uHorizonColor * uHorizonColor;
  vec3 mixedLin = mix(horLin, topLin, t);
  vec3 color = sqrt(max(mixedLin, 0.0));

  gl_FragColor = vec4(color, 1.0);
}
