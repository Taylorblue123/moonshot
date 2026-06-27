// layers/fireflies.js — Fireflies layer: a swarm of soft glowing motes drifting
// in a band ABOVE the hill ridge. Each mote rides its own elliptical orbit
// (phases offset) + a horizontal nudge from the BROADCAST wind, and breathes via
// an alpha pulse. The whole layer fades by day through timeOfDay (nightFactor).
//
// All motion is in the vertex shader: per-point attributes are seeded ONCE; per
// frame JS only pushes uniforms (no buffer rewrites → no GC churn → 24/7-safe).
import * as THREE from "three";

import { nightFactor } from "../skyRamp.js";
import vertexShader from "../shaders/fireflies.vert?raw";
import fragmentShader from "../shaders/fireflies.frag?raw";

// Nearest layer: in front of the hill (z=-6); clouds at -8, sky at -10.
const FIREFLIES_Z = -4;

// Vertical band the swarm occupies, as a fraction of frame height. Above the
// hill ridge (~0.38) so motes hover over the ground, not buried in it.
const BAND_LOW = 0.4;
const BAND_HIGH = 0.62;

/**
 * World-space frustum half-extents at `dist` (no overfill pad — points are placed
 * inside the visible frame, with a little horizontal slack for wind drift).
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} dist
 * @returns {{ halfW: number, halfH: number }}
 */
function frustumHalfAt(camera, dist) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const halfH = Math.tan(vFov / 2) * dist;
  const halfW = halfH * camera.aspect;
  return { halfW, halfH };
}

/**
 * @param {THREE.Scene} scene
 * @param {import('../params.js').SceneParams} params
 * @returns {{ object3d: THREE.Object3D, update(params: import('../params.js').SceneParams, dt: number, t: number): void, dispose(): void, resize(camera: THREE.PerspectiveCamera): void }}
 */
export function createFirefliesLayer(scene, params) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uGlow: { value: params.fireflies.glow },
      uDrift: { value: params.fireflies.driftSpeed },
      uPulseSpeed: { value: params.fireflies.pulseSpeed },
      uColor: { value: new THREE.Color(params.fireflies.color) },
      uNightFactor: { value: nightFactor(params.timeOfDay) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending, // overlaps brighten → luminous glow
    depthTest: false,
    depthWrite: false,
  });

  const points = new THREE.Points(new THREE.BufferGeometry(), material);
  points.position.set(0, 0, FIREFLIES_Z);
  points.renderOrder = -600; // after hill (-700)
  points.frustumCulled = false;

  // Frame extents cached from the last resize so a count-rebuild can re-seed
  // positions without a camera handle.
  let halfW = 1;
  let halfH = 1;
  let currentCount = -1;

  // Deterministic hashed pseudo-random (no Math.random — keeps seeding stable and
  // avoids the sandboxed-RNG ban; varies per index).
  function rand(i, salt) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  /** Rebuild the point cloud for `count` motes, seeding attributes once. */
  function seed(count) {
    const positions = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const radius = new Float32Array(count);
    const pulse = new Float32Array(count);

    const bandLowY = (BAND_LOW * 2 - 1) * halfH;
    const bandHighY = (BAND_HIGH * 2 - 1) * halfH;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand(i, 1) * 2 - 1) * halfW * 0.95;
      positions[i * 3 + 1] = bandLowY + rand(i, 2) * (bandHighY - bandLowY);
      positions[i * 3 + 2] = 0;
      phase[i] = rand(i, 3) * Math.PI * 2;
      radius[i] = (0.04 + rand(i, 4) * 0.08) * halfH; // orbit size ~world units
      pulse[i] = rand(i, 5) * Math.PI * 2;
    }

    const geom = points.geometry;
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geom.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
    geom.setAttribute("aPulse", new THREE.BufferAttribute(pulse, 1));
    currentCount = count;
  }

  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - FIREFLIES_Z;
    ({ halfW, halfH } = frustumHalfAt(camera, dist));
    seed(params.fireflies.count); // re-seed so the band fits the new frame
  }

  /**
   * @param {import('../params.js').SceneParams} p
   * @param {number} _dt delta seconds (unused — orbit motion rides uTime)
   * @param {number} t  elapsed seconds
   */
  function update(p, _dt, t) {
    if (p.fireflies.count !== currentCount) seed(p.fireflies.count);
    material.uniforms.uTime.value = t;
    material.uniforms.uGlow.value = p.fireflies.glow;
    material.uniforms.uDrift.value = p.fireflies.driftSpeed;
    material.uniforms.uPulseSpeed.value = p.fireflies.pulseSpeed;
    material.uniforms.uColor.value.set(p.fireflies.color);
    material.uniforms.uNightFactor.value = nightFactor(p.timeOfDay);
  }

  function dispose() {
    points.geometry.dispose();
    material.dispose();
  }

  return { object3d: points, update, dispose, resize };
}
