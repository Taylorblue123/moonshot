// ─────────────────────────────────────────────────────────────────────────
// main.js — Moonshot M1 entry point (2.5D layered painterly scene).
//
// Owns only the renderer, the render loop, and the resize handler. The scene
// graph (camera + all layers) is built and updated by scene.js, so adding
// layers never touches this file.
//
// NOTE: This is the 2.5D-compositor scene. The true-3D icosahedron experiment
// lives in src/sandbox.js (not part of M1).
// ─────────────────────────────────────────────────────────────────────────
import * as THREE from "three";
import { params } from "./params.js";
import { createScene } from "./scene.js";

// --- The renderer: this is the `gl` context wrapper ------------------------
// antialias: true -> MSAA on the default framebuffer (like requesting a
//                    multisampled context in raw WebGL).
const renderer = new THREE.WebGLRenderer({ antialias: true });

// devicePixelRatio handling: on Retina, CSS pixel != hardware pixel. Cap at 2
// so 3x phones don't render 9x the pixels.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Size the drawing buffer to the window. (≈ gl.viewport + canvas.width/height.)
renderer.setSize(window.innerWidth, window.innerHeight);

// The renderer made a <canvas>; mount it into our #app div.
document.getElementById("app").appendChild(renderer.domElement);

// --- Scene (camera + all layers) -------------------------------------------
// scene.js assembles everything from `params`; main.js just drives it.
const { scene, camera, update, resize } = createScene(params);

// --- The render loop --------------------------------------------------------
// setAnimationLoop is Three.js's requestAnimationFrame wrapper. A Clock gives
// us dt (delta) and t (elapsed) seconds for time-based animation; the scene
// reads `params` every frame.
const clock = new THREE.Clock();
function tick() {
  const dt = clock.getDelta(); // seconds since last frame
  const t = clock.getElapsedTime(); // seconds since start
  update(params, dt, t); // fan out to every layer (camera is fixed)
  renderer.render(scene, camera); // clear + draw the scene from the camera
}
renderer.setAnimationLoop(tick);

// --- Keep it sharp on window resize ----------------------------------------
// Renderer sizing lives here (main.js owns the renderer); camera + layer refit
// is delegated to the scene.
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resize(window.innerWidth, window.innerHeight);
});
