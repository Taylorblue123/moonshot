// sky.vert — pass-through for the sky gradient quad.
//
// Three.js injects `position`, `uv`, `modelViewMatrix`, and
// `projectionMatrix` automatically (its ShaderMaterial prologue). We only
// forward the quad's UVs so the fragment shader can build a vertical gradient
// from vUv.y (0 at bottom/horizon → 1 at top/zenith).

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
