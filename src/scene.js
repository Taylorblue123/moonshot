// scene.js — assembles the THREE.Scene, the fixed camera, and all layers.
//
// The camera is FIXED — no parallax drift, no per-layer parallaxFactor
// (decided 2026-06-26). Depth comes from `z` order + overlap only.
import * as THREE from "three";
import { createSkyLayer } from "./layers/sky.js";
import { createCloudsLayer } from "./layers/clouds.js";

/**
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

  // Clear color is derived from timeOfDay (the sky's horizon color) so any gap
  // matches the time of day. Seeded below once the sky exists.
  scene.background = new THREE.Color(0x000000);

  // Fixed camera: positioned once and never moved.
  const camera = new THREE.PerspectiveCamera(
    params.camera.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 5);
  camera.zoom = params.camera.zoom;
  camera.updateProjectionMatrix();

  // Layers far → near. Register a new layer by pushing it here.
  const sky = createSkyLayer(scene, params);
  const layers = [
    sky,
    createCloudsLayer(scene, params), // drifts by broadcast wind
  ];
  for (const layer of layers) {
    scene.add(layer.object3d);
    if (typeof layer.resize === "function") layer.resize(camera);
  }

  scene.background.set(sky.horizonColor(params));

  /**
   * @param {import('./params.js').SceneParams} p
   * @param {number} dt delta seconds
   * @param {number} t  elapsed seconds
   */
  function update(p, dt, t) {
    // Reflect fov/zoom changes from params — still no camera motion.
    if (camera.fov !== p.camera.fov || camera.zoom !== p.camera.zoom) {
      camera.fov = p.camera.fov;
      camera.zoom = p.camera.zoom;
      camera.updateProjectionMatrix();
    }
    for (const layer of layers) layer.update(p, dt, t);
    scene.background.set(sky.horizonColor(p));
  }

  /**
   * Renderer sizing stays in main.js (it owns the renderer).
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

  /** Free all layer GPU resources — hygiene for a 24/7 app. */
  function dispose() {
    for (const layer of layers) layer.dispose();
  }

  return { scene, camera, update, resize, dispose };
}
