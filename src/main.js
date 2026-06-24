// =============================================================================
// main.js — bootstrap the renderer and the render loop.
//
// WebGL/GL mental map:
//   - WebGLRenderer  ≈ your `gl` context + canvas + viewport + clear setup,
//                       all wrapped up. It owns the GL state machine.
//   - renderer.render(scene, camera) ≈ your per-frame "clear, bind program,
//                       set uniforms, draw everything" — but driven by the
//                       scene graph instead of manual draw calls.
//   - The animation loop (requestAnimationFrame) is STILL yours to write.
//     Three.js does not hide the loop; it only hides what happens inside one
//     render() call.
// =============================================================================

import * as THREE from 'three';

// --- The renderer: this is the `gl` context wrapper ------------------------
// antialias: true  -> MSAA on the default framebuffer (like requesting a
//                     multisampled context in raw WebGL).
const renderer = new THREE.WebGLRenderer({ antialias: true });

// devicePixelRatio handling: on a Retina display the CSS pixel != hardware
// pixel. In raw WebGL you'd size the drawingBuffer yourself; here we just tell
// the renderer. Cap at 2 so 3x phones don't render 9x the pixels.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Size the drawing buffer to the window. (≈ gl.viewport + canvas.width/height.)
renderer.setSize(window.innerWidth, window.innerHeight);

// The renderer made a <canvas>; mount it into our #app div.
document.getElementById('app').appendChild(renderer.domElement);

// --- Placeholder scene + camera --------------------------------------------
// We need *a* scene and *a* camera just to call render(). Right now the scene
// is empty, so all you'll see is the clear color. We flesh these out in Step 2+.
const scene = new THREE.Scene();

// A background color = your glClearColor. Three.js clears to this each frame.
scene.background = new THREE.Color(0x12131a); // dark slate (lo-fi night base)

// Minimal camera so render() is happy. We design the real one in scene.js next.
const camera = new THREE.PerspectiveCamera(
  45,                                     // FOV in degrees (vertical)
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1,                                    // near plane
  100                                     // far plane
);
camera.position.set(0, 0, 5);

// --- The render loop --------------------------------------------------------
// setAnimationLoop is Three.js's requestAnimationFrame wrapper. It also does
// the right thing for WebXR/headless later. The callback runs once per frame.
function tick() {
  // (Per-frame updates will go here in later steps — animation, etc.)
  renderer.render(scene, camera); // clear + draw the scene from the camera
}
renderer.setAnimationLoop(tick);

// --- Keep it sharp on window resize ----------------------------------------
// Same idea as a resize handler in raw WebGL: update viewport + the camera's
// projection matrix (aspect changed, so the projection must be recomputed).
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // projection matrix is cached; force rebuild
  renderer.setSize(window.innerWidth, window.innerHeight);
});
