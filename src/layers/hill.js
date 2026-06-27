// layers/hill.js — Hill layer: a dark rolling-ground mass with an fbm ridge
// silhouette, in front of the clouds. The ridge + surface breathe slowly under
// the BROADCAST wind (params.wind, shared with clouds + fireflies). Calm by
// design — the foreground's life signal is the fireflies, not this layer.
import * as THREE from "three";

import { nightFactor } from "../skyRamp.js";
import vertexShader from "../shaders/hill.vert?raw";
import fragmentShader from "../shaders/hill.frag?raw";

// In front of the clouds (z=-8), behind the fireflies (z=-4). Depth is z-order
// only (the camera is fixed — no parallax).
const HILL_Z = -6;

// Ground motion is slower than the clouds' drift — this is heavy earth, not sky.
const HILL_DRIFT = 0.004;

// params.grass.height is a blade-height MULTIPLIER (~1.0), not a screen fraction.
// Map it to where the ridge sits in the lower frame: taller grass → higher ridge.
const RIDGE_BASE = 0.38; // ridge fraction of frame at height multiplier 1.0
function ridgeFraction(heightMultiplier) {
  return Math.min(0.6, RIDGE_BASE * heightMultiplier);
}

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
export function createHillLayer(scene, params) {
  const geometry = new THREE.PlaneGeometry(1, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uWind: { value: 0 }, // accumulated scroll offset (advanced in update)
      uHillHeight: { value: ridgeFraction(params.grass.height) },
      uColor: { value: new THREE.Color(params.grass.color) },
      uLushness: { value: params.grass.lushness },
      uNightFactor: { value: nightFactor(params.timeOfDay) },
    },
    transparent: true, // alpha = 0 above the ridge lets sky/clouds show through
    depthTest: false, // backdrop band; never occluded
    depthWrite: false, // don't pollute depth for nearer layers
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, HILL_Z);
  mesh.renderOrder = -700; // after clouds (-900), before fireflies (-600)
  mesh.frustumCulled = false; // deliberately oversized; never cull

  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - HILL_Z;
    const { width, height } = frustumSizeAt(camera, dist);
    mesh.scale.set(width, height, 1);
  }

  /**
   * @param {import('../params.js').SceneParams} p
   * @param {number} dt delta seconds
   * @param {number} _t elapsed seconds (unused — all motion rides uWind)
   */
  function update(p, dt, _t) {
    // Broadcast wind: strength × direction, scaled down so ground motion is
    // subtler and slower than the clouds.
    material.uniforms.uWind.value +=
      p.wind.strength * p.wind.direction * HILL_DRIFT * dt;
    material.uniforms.uHillHeight.value = ridgeFraction(p.grass.height);
    material.uniforms.uColor.value.set(p.grass.color);
    material.uniforms.uLushness.value = p.grass.lushness;
    material.uniforms.uNightFactor.value = nightFactor(p.timeOfDay);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return { object3d: mesh, update, dispose, resize };
}
