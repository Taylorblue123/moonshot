// sky.vert — pass-through; forwards UVs so the fragment shader builds the
// vertical gradient from vUv.y (0 at horizon → 1 at zenith).

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
