// ─────────────────────────────────────────────────────────────────────────
// layers/sky.js — z=1 Sky layer (see plan.md §3).
//
// The first scene layer: a full-frame vertical gradient (dusk blue → pale
// horizon) drawn by a custom ShaderMaterial. Procedural-first: no texture.
//
// This module proves the "textured-quad → custom-shader" path and the
// params-driven rule: the gradient endpoints are derived from params.timeOfDay
// via skyRamp.js and rewritten every frame in update(), so changing timeOfDay
// (params.js now, or the M2 API / M4 agent later) re-colors the sky live.
// There are NO manual sky-color knobs — timeOfDay is the source of truth.
//
// Conforms to the §5 layer module contract:
//   { object3d, update(params, dt, t), dispose() }
// ─────────────────────────────────────────────────────────────────────────
import * as THREE from "three";

// Shaders live as readable files and are imported as raw strings (Vite's
// `?raw` suffix). This keeps GLSL syntax-highlighted/lintable on its own.
import vertexShader from "../shaders/sky.vert?raw";
import fragmentShader from "../shaders/sky.frag?raw";

// timeOfDay (★broadcast) → gradient colors. The sky has no manual color knobs;
// the time-of-day ramp is the single source of truth (see skyRamp.js).
import { skyColorsForTime } from "../skyRamp.js";

// The sky sits at the far end of the scene. The camera (main.js) is at z=5
// looking down -z with a ~40° vertical FOV; we place the quad well behind
// everything and size it to overfill the frustum at that depth.
const SKY_Z = -10;

/**
 * Compute the world-space height/width of the camera frustum at depth `dist`
 * in front of a perspective camera, padded so the quad always overfills the
 * frame (covers all aspect ratios / resize states).
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} dist  Distance from the camera to the quad plane.
 * @returns {{ width: number, height: number }}
 */
function frustumSizeAt(camera, dist) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFov / 2) * dist;
  const width = height * camera.aspect;
  // 1.6× pad: cheaply overfills the frame at any aspect ratio / resize state.
  return { width: width * 1.6, height: height * 1.6 };
}

/**
 * @param {THREE.Scene} scene
 * @param {SceneParams} params
 * @returns {{ object3d: THREE.Object3D, update(params: SceneParams, dt: number, t: number): void, dispose(): void, resize?(camera: THREE.PerspectiveCamera): void }}
 */
export function createSkyLayer(scene, params) {
  // A unit plane; the actual on-screen size is set by mesh.scale so we can
  // cheaply re-fit on resize without rebuilding geometry.
  const geometry = new THREE.PlaneGeometry(1, 1);

  // Seed colors from the timeOfDay ramp (NOT manual literals). update() keeps
  // them live as timeOfDay changes.
  const seed = skyColorsForTime(params.timeOfDay);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTopColor: { value: new THREE.Color(seed.topColor) },
      uHorizonColor: { value: new THREE.Color(seed.horizonColor) },
    },
    depthTest: false, // it's the backdrop; never occluded
    depthWrite: false, // don't pollute the depth buffer for nearer layers
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, SKY_Z);
  mesh.renderOrder = -1000; // draw first, behind every later layer
  mesh.frustumCulled = false; // it's deliberately oversized; never cull it

  /**
   * Re-fit the quad to fill the current camera frustum. Call on init and on
   * window resize (Task 3 owns the camera; main.js forwards resize for now).
   * @param {THREE.PerspectiveCamera} camera
   */
  function resize(camera) {
    const dist = camera.position.z - SKY_Z; // distance camera → quad plane
    const { width, height } = frustumSizeAt(camera, dist);
    mesh.scale.set(width, height, 1);
  }

  /**
   * Per-frame update. Derives the gradient from p.timeOfDay via the ramp and
   * writes the uniforms, so changing timeOfDay (params.js now, M2 API / M4 agent
   * later) re-colors the sky live. The sky has no manual color knobs.
   * @param {SceneParams} p
   * @param {number} _dt  delta seconds (unused; sky color is time-driven)
   * @param {number} _t   elapsed seconds (unused for now)
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
