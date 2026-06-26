// sky.frag — vertical sky gradient, uHorizonColor (vUv.y=0) → uTopColor
// (vUv.y=1). Both endpoints arrive as uniforms from params.timeOfDay — no color
// is hardcoded here.
//
// Banding mitigation: mix in ~linear space (square, lerp, sqrt back ≈ gamma
// 2.0) so equal UV steps don't clump into visible bands in the sRGB output.

precision highp float;

uniform vec3 uTopColor;
uniform vec3 uHorizonColor;

varying vec2 vUv;

void main() {
  float t = smoothstep(0.0, 1.0, vUv.y);

  vec3 topLin = uTopColor * uTopColor;
  vec3 horLin = uHorizonColor * uHorizonColor;
  vec3 mixedLin = mix(horLin, topLin, t);
  vec3 color = sqrt(max(mixedLin, 0.0));

  gl_FragColor = vec4(color, 1.0);
}
