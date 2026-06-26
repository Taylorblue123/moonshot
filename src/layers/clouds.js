// ─────────────────────────────────────────────────────────────────────────
// layers/clouds.js — z=3 Clouds layer (see plan.md §3).
//
// A painterly cumulus band that drifts horizontally under the BROADCAST wind
// value (params.wind), introducing the `uWind` pattern that grass + butterflies
// reuse later. Procedural-first: an fbm cloud shader on a transparent quad so
// the sky layer shows through the gaps.
//
// Conforms to the §5 layer module contract:
//   { object3d, update(params, dt, t), dispose(), resize?(camera) }
// ─────────────────────────────────────────────────────────────────────────
import * as THREE from "three";

import vertexShader from "../shaders/clouds.vert?raw";
import fragmentShader from "../shaders/clouds.frag?raw";

// In front of the sky (z=-10), behind the future ridge. Depth is z-order only
// (the camera is fixed — no parallax; plan.md §4).
const CLOUDS_Z = -8;

/**
 * World-space frustum size at `dist` in front of the perspective camera, padded
 * so the quad always overfills the frame (any aspect / resize state).
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} dist
 * @returns {{ width: number, height: number }}
 */
function frustumSizeAt(camera, dist) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFov / 2) * dist;
  const width = height * camera.aspect;
  return { width: width * 1.6, height: height * 1.6 };
}

/**
 * @param {THREE.Scene} scene
 * @param {import('../params.js').SceneParams} params
 * @returns {{ object3d: THREE.Object3D, update(params: import('../params.js').SceneParams, dt: number, t: number): void, dispose(): void, resize(camera: THREE.PerspectiveCamera): void }}
 */
export function createCloudsLayer(scene, params) {
  const geometry = new THREE.PlaneGeometry(1, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    // Uniforms seeded FROM params — not literals. update() keeps them live.
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0 }, // accumulated scroll offset (advanced in update)
      uCoverage: { value: params.clouds.coverage },
      uHeight: { value: params.clouds.height },
      uTint: { value: new THREE.Color(params.clouds.tint) },
    },
    transparent: true, // alpha mask lets the sky show through gaps
    depthTest: false, // it's a backdrop band; never occluded by the sky
    depthWrite: false, // don't pollute depth for nearer layers
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, CLOUDS_Z);
  mesh.renderOrder = -900; // after sky (-1000), before everything nearer
  mesh.frustumCulled = false; // deliberately oversized; never cull

  /**
   * Fit the quad to overfill the current frustum at the clouds' depth.
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - CLOUDS_Z;
    const { width, height } = frustumSizeAt(camera, dist);
    mesh.scale.set(width, height, 1);
  }

  /**
   * Per-frame update: advance the wind scroll from the BROADCAST params.wind,
   * and refresh coverage/height/tint from params so edits show live.
   * @param {import('../params.js').SceneParams} p
   * @param {number} dt delta seconds
   * @param {number} t  elapsed seconds
   */
  function update(p, dt, t) {
    // Broadcast wind: strength × direction, scaled by the clouds' drift speed.
    material.uniforms.uWind.value +=
      p.wind.strength * p.wind.direction * p.clouds.driftSpeed * dt;
    material.uniforms.uTime.value = t;
    material.uniforms.uCoverage.value = p.clouds.coverage;
    material.uniforms.uHeight.value = p.clouds.height;
    material.uniforms.uTint.value.set(p.clouds.tint);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return { object3d: mesh, update, dispose, resize };
}
