// clouds.vert — pass-through for the cumulus band quad.
//
// Same shape as sky.vert: Three.js injects position/uv/matrices; we forward
// the quad UVs so the fragment shader can place + animate the cloud band.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
