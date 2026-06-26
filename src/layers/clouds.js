// layers/clouds.js — Clouds layer: a painterly cumulus band that drifts under
// the BROADCAST wind value (params.wind, shared with grass + butterflies).
import * as THREE from "three";

import vertexShader from "../shaders/clouds.vert?raw";
import fragmentShader from "../shaders/clouds.frag?raw";

// In front of the sky (z=-10), behind the future ridge. Depth is z-order only
// (the camera is fixed — no parallax).
const CLOUDS_Z = -8;

/**
 * World-space frustum size at `dist` in front of the camera, padded so the quad
 * always overfills the frame (any aspect / resize state).
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
    // Seeded from params, not literals; update() keeps them live.
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0 }, // accumulated scroll offset (advanced in update)
      uCoverage: { value: params.clouds.coverage },
      uHeight: { value: params.clouds.height },
      uTint: { value: new THREE.Color(params.clouds.tint) },
    },
    transparent: true, // alpha mask lets the sky show through gaps
    depthTest: false, // backdrop band; never occluded by the sky
    depthWrite: false, // don't pollute depth for nearer layers
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, CLOUDS_Z);
  mesh.renderOrder = -900; // after sky (-1000), before everything nearer
  mesh.frustumCulled = false; // deliberately oversized; never cull

  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - CLOUDS_Z;
    const { width, height } = frustumSizeAt(camera, dist);
    mesh.scale.set(width, height, 1);
  }

  /**
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
