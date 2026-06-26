// sandbox.js — true-3D Three.js playground (NOT part of the M1 scene).
//
// A lit, orbit-controllable icosahedron, deliberately outside the 2.5D M1
// pipeline. To run it, point index.html's <script src> at "/src/sandbox.js"
// temporarily; the real M1 entry point is src/main.js.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12132a);

const geo = new THREE.IcosahedronGeometry(1.0, 1);

const mat = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.5,
  metalness: 0.5,
  flatShading: true,
});

const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

const lightDir = new THREE.DirectionalLight(0xffffff, 1);
lightDir.position.set(5, 5, 5);
const lightHemi = new THREE.HemisphereLight(0x0099ff, 0x000000, 0.5);
scene.add(lightDir);
scene.add(lightHemi);

// Camera must exist BEFORE OrbitControls — constructing them in the other
// order was the original bug.
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

function tick() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(tick);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
