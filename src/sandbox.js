// ─────────────────────────────────────────────────────────────────────────
// sandbox.js — Three.js learning playground (NOT part of the M1 scene).
//
// This is your true-3D experiment: a lit, orbit-controllable icosahedron.
// It deliberately lives OUTSIDE the M1 pipeline (which is 2.5D / compositor —
// no 3D lighting, no OrbitControls). Keep it for poking at Three.js concepts.
//
// To run this instead of the real scene, point index.html's <script src> at
// "/src/sandbox.js" temporarily. The real M1 entry point is src/main.js.
// ─────────────────────────────────────────────────────────────────────────
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- The renderer: this is the `gl` context wrapper ------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app").appendChild(renderer.domElement);

// --- Scene ------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12132a); // dark slate (lo-fi night base)

// Geometry
const geo = new THREE.IcosahedronGeometry(1.0, 1);

// Material
const mat = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.5,
  metalness: 0.5,
  flatShading: true,
});

// Mesh
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// Lights
const lightDir = new THREE.DirectionalLight(0xffffff, 1);
lightDir.position.set(5, 5, 5);
const lightHemi = new THREE.HemisphereLight(0x0099ff, 0x000000, 0.5);
scene.add(lightDir);
scene.add(lightHemi);

// --- Camera (must exist BEFORE OrbitControls — that was the original bug) ----
const camera = new THREE.PerspectiveCamera(
  45, // FOV in degrees (vertical)
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1, // near plane
  100, // far plane
);
camera.position.set(0, 0, 5);

// --- Controls ---------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

// --- Render loop ------------------------------------------------------------
function tick() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(tick);

// --- Resize -----------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
