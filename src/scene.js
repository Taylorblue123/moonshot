// ─────────────────────────────────────────────────────────────────────────
// scene.js — the layer assembler (see docs/tasks/m1/plan.md §5).
//
// Single place that owns: building the THREE.Scene + the (FIXED) camera,
// instantiating every layer, holding their handles, and fanning out per-frame
// update() + resize to all of them. Adding a later layer is one line here:
// instantiate its factory, push to `layers`, add its object3d.
//
// The camera is FIXED — no parallax drift, no per-layer parallaxFactor (plan
// §4, decided 2026-06-26). Depth comes from `z` order + overlap only.
//
// Contract: createScene(params) -> { scene, camera, update(params, dt, t), resize(w, h) }
// ─────────────────────────────────────────────────────────────────────────
import * as THREE from "three";
import { createSkyLayer } from "./layers/sky.js";
import { createCloudsLayer } from "./layers/clouds.js";

/**
 * Build the scene, the fixed camera, and all layers.
 *
 * @param {import('./params.js').SceneParams} params
 * @returns {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   update(params: import('./params.js').SceneParams, dt: number, t: number): void,
 *   resize(width: number, height: number): void,
 * }}
 */
export function createScene(params) {
  const scene = new THREE.Scene();

  // Background clear color is derived from timeOfDay (the sky's horizon color),
  // so any gap matches the time of day. Seeded below once the sky exists.
  scene.background = new THREE.Color(0x000000);

  // --- Fixed gentle-perspective camera (params.camera: fov + zoom) ----------
  // Positioned once and never moved. `zoom` is applied via the camera's native
  // zoom property (folded into the projection matrix).
  const camera = new THREE.PerspectiveCamera(
    params.camera.fov, // vertical FOV in degrees
    window.innerWidth / window.innerHeight, // aspect
    0.1, // near
    100, // far
  );
  camera.position.set(0, 0, 5);
  camera.zoom = params.camera.zoom;
  camera.updateProjectionMatrix();

  // --- Layers (far → near). Register a new layer by pushing it here. --------
  // Each conforms to the §5 contract: { object3d, update(params, dt, t),
  // dispose(), resize?(camera) }.
  const sky = createSkyLayer(scene, params); // z=1 Sky (timeOfDay-driven)
  const layers = [
    sky,
    createCloudsLayer(scene, params), // z=3 Clouds (drifts by broadcast uWind)
  ];
  for (const layer of layers) {
    scene.add(layer.object3d);
    // Layers that fit themselves to the frustum (e.g. sky) expose resize().
    if (typeof layer.resize === "function") layer.resize(camera);
  }

  // Match the clear color to the timeOfDay horizon color from the start.
  scene.background.set(sky.horizonColor(params));

  /**
   * Per-frame update. Fans out to every layer. Does NOT move the camera
   * (fixed viewpoint). Keeps the camera's fov/zoom in sync with params so the
   * scene stays fully params-driven.
   * @param {import('./params.js').SceneParams} p
   * @param {number} dt delta seconds
   * @param {number} t  elapsed seconds
   */
  function update(p, dt, t) {
    // Reflect any params.camera change (fov/zoom) — still no camera motion.
    if (camera.fov !== p.camera.fov || camera.zoom !== p.camera.zoom) {
      camera.fov = p.camera.fov;
      camera.zoom = p.camera.zoom;
      camera.updateProjectionMatrix();
    }
    for (const layer of layers) layer.update(p, dt, t);
    // Keep the clear color tracking timeOfDay (cheap; matches the sky horizon).
    scene.background.set(sky.horizonColor(p));
  }

  /**
   * Resize: update camera aspect/projection, then refit any layer that fills
   * the frustum. Renderer sizing stays in main.js (it owns the renderer).
   * @param {number} width
   * @param {number} height
   */
  function resize(width, height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    for (const layer of layers) {
      if (typeof layer.resize === "function") layer.resize(camera);
    }
  }

  /** Free all layer GPU resources (hygiene for a 24/7 app). */
  function dispose() {
    for (const layer of layers) layer.dispose();
  }

  return { scene, camera, update, resize, dispose };
}
