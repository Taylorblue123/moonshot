// main.js — M1 entry point: owns the renderer, render loop, and resize handler.
import * as THREE from "three";
import { params } from "./params.js";
import { createScene } from "./scene.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });

// Cap at 2 so 3x-DPR devices don't render 9x the pixels.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("app").appendChild(renderer.domElement);

const { scene, camera, update, resize } = createScene(params);

const clock = new THREE.Clock();
function tick() {
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();
  update(params, dt, t); // camera is fixed; this only updates layers
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(tick);

// Renderer sizing lives here (main.js owns the renderer); camera + layer refit
// is delegated to the scene.
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize(window.innerWidth, window.innerHeight);
});
