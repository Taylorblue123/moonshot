# Task 1 — Scaffold + cleared canvas (M1.0)

| | |
|---|---|
| **Milestone step** | M1.0 |
| **Status** | done — needs render verification |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §1 Tech & Conventions, §2 File Structure |
| **Depends on** | — (first task) |
| **Blocks** | Task 2 (sky shader needs a working renderer + loop) |

---

## Objective

Make the project runnable and prove the rendering pipeline at its smallest: a
renderer + a render loop drawing an empty scene, so the only thing on screen is
the cleared "dusk" background color. No layers, no shaders yet.

## Traceability
- **Satisfies (spec):** the foundation behind DoD #6 ("runs at a smooth frame
  rate with no errors") and the precondition for every visible-scene DoD item.
- **Implements (design):** `plan.md` §1 (Vite + Three.js + JS, Three.js as
  compositor) and the `index.html` / `src/main.js` entries of §2.

## Implementation steps
1. **Install deps:** `npm install` (pulls `three` + `vite` from `package.json`).
2. **Entry HTML:** confirm `index.html` mounts a full-bleed `#app` and loads
   `/src/main.js` as a module.
3. **Renderer:** in `src/main.js`, create `WebGLRenderer({ antialias: true })`,
   cap pixel ratio (`Math.min(devicePixelRatio, 2)`), size to the window, append
   `renderer.domElement` to `#app`.
4. **Scene + clear color:** create an empty `THREE.Scene`; set `scene.background`
   to a dusk slate-blue so the empty canvas already reads as "evening."
5. **Camera:** a gentle-perspective `PerspectiveCamera` (≈40° FOV, window aspect,
   near 0.1 / far 100) at `z = 5`. Camera config moves into `params.camera` in a
   later task; hardcoded here is fine for M1.0.
6. **Render loop:** call `renderer.render(scene, camera)` from
   `renderer.setAnimationLoop`.
7. **Resize handler:** on `window resize`, update `camera.aspect`, call
   `camera.updateProjectionMatrix()`, and `renderer.setSize(...)`.

## Acceptance criteria (Definition of Done for this task)
- [ ] `npm run dev` starts Vite and serves the app with **no console errors**.
- [ ] The browser shows a **full-window dusk-colored canvas** (the clear color)
      and nothing else.
- [ ] Resizing the window keeps the canvas full-bleed and undistorted (no
      stretching, no scrollbars).
- [ ] No 3D mesh, lights, or `OrbitControls` are present in `main.js` (those
      belong to the non-M1 playground `src/sandbox.js`).

## Notes / guardrails
- `src/sandbox.js` holds the lit-3D icosahedron experiment and is **not** part of
  M1. `src/main.js` is the 2.5D-compositor entry point — keep them separate.
- The only hardcoded values allowed here (clear color, camera) are placeholders
  that move into `params` in Task 2+.

## Verification log
_(fill in when run)_
- `npm run dev` result:
- Screenshot / observation:
