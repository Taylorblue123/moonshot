// layers/sky.js — far Sky layer: a full-frame vertical gradient.
//
// The gradient endpoints are derived from params.timeOfDay via skyRamp.js and
// rewritten every frame; there are NO manual sky-color knobs — timeOfDay is the
// source of truth.
import * as THREE from "three";

// Vite's `?raw` suffix imports the GLSL as a string while keeping it in its own
// syntax-highlightable file.
import vertexShader from "../shaders/sky.vert?raw";
import fragmentShader from "../shaders/sky.frag?raw";

import { skyColorsForTime } from "../skyRamp.js";

const SKY_Z = -10;

/**
 * World-space frustum size at `dist` in front of the camera, padded so the quad
 * always overfills the frame (any aspect ratio / resize state).
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} dist  Distance from the camera to the quad plane.
 * @returns {{ width: number, height: number }}
 */
function frustumSizeAt(camera, dist) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFov / 2) * dist;
  const width = height * camera.aspect;
  return { width: width * 1.6, height: height * 1.6 }; // 1.6× pad overfills
}

/**
 * @param {THREE.Scene} scene
 * @param {SceneParams} params
 * @returns {{ object3d: THREE.Object3D, update(params: SceneParams, dt: number, t: number): void, dispose(): void, resize?(camera: THREE.PerspectiveCamera): void }}
 */
export function createSkyLayer(scene, params) {
  // Unit plane; on-screen size is set via mesh.scale so resize re-fits without
  // rebuilding geometry.
  const geometry = new THREE.PlaneGeometry(1, 1);

  // Seeded from the timeOfDay ramp, not literals; update() keeps it live.
  const seed = skyColorsForTime(params.timeOfDay);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTopColor: { value: new THREE.Color(seed.topColor) },
      uHorizonColor: { value: new THREE.Color(seed.horizonColor) },
    },
    depthTest: false, // backdrop; never occluded
    depthWrite: false, // don't pollute the depth buffer for nearer layers
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, SKY_Z);
  mesh.renderOrder = -1000; // draw first, behind every later layer
  mesh.frustumCulled = false; // deliberately oversized; never cull

  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - SKY_Z;
    const { width, height } = frustumSizeAt(camera, dist);
    mesh.scale.set(width, height, 1);
  }

  /**
   * @param {SceneParams} p
   * @param {number} _dt  delta seconds (unused; sky color is time-driven)
   * @param {number} _t   elapsed seconds (unused)
   */
  function update(p, _dt, _t) {
    const c = skyColorsForTime(p.timeOfDay);
    material.uniforms.uTopColor.value.set(c.topColor);
    material.uniforms.uHorizonColor.value.set(c.horizonColor);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  /** Current horizon color (hex) — so scene.js can match the clear color. */
  function horizonColor(p) {
    return skyColorsForTime(p.timeOfDay).horizonColor;
  }

  return { object3d: mesh, update, dispose, resize, horizonColor };
}
