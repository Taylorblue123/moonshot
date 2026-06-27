// hill.vert — pass-through; forwards UVs so the fragment shader shapes the ridge
// and fills the hill.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
