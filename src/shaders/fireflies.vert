// fireflies.vert — each mote's position is computed IN-SHADER from per-point
// attributes (seeded once in JS) + uTime, so JS never rewrites the buffer.
// Motion = a small elliptical orbit around the base position (phase-offset per
// mote). Deliberately NO broadcast-wind term: motes are discrete points, so a
// monotonic wind offset would sweep the whole swarm off-screen with nothing
// re-entering. They hover in place; the orbit gives the horizontal wander.

uniform float uTime;
uniform float uGlow;     // 0..1 — scales point size
uniform float uDrift;    // orbit speed (params.fireflies.driftSpeed)

attribute float aPhase;  // orbit phase offset
attribute float aRadius; // orbit radius
attribute float aPulse;  // pulse phase offset (forwarded to fragment)

varying float vPulse;

void main() {
  vPulse = aPulse;

  float a = uTime * uDrift + aPhase;
  // Wider than tall: motes wander more horizontally than vertically.
  vec3 offset = vec3(cos(a) * aRadius * 1.6, sin(a * 0.9) * aRadius, 0.0);
  vec3 pos = position + offset;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // Constant size in screen space (camera is fixed); glow scales it.
  gl_PointSize = mix(6.0, 26.0, clamp(uGlow, 0.0, 1.0));
}
