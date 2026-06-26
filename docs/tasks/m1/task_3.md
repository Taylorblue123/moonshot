# Task 3 — scene.js layer assembler (M1.2)

| | |
|---|---|
| **Milestone step** | M1.2 |
| **Status** | done — code verified (headless); needs a browser eye for no-regression |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §4 (fixed camera; depth without camera motion), §5 Module Contracts, §6 `params.camera` |
| **Depends on** | Task 2 (a layer exists to assemble) |
| **Blocks** | Tasks 4–9 (every later layer is added through `scene.js`) |

---

## Objective

Introduce `scene.js` as the single place that owns "build the scene + camera,
hold all layers, and update them every frame." This refactors the inline wiring
out of `main.js` so adding each later layer is a one-line registration. The
**camera is fixed** — there is no camera drift; depth comes from layer `z` order
and overlap.

## Traceability
- **Satisfies (spec):** the depth half of DoD #1 (layers sit at clearly different
  depths) and sets up the structure that DoD #2's content motion plugs into.
- **Implements (design):** `plan.md` §4 (fixed gentle-perspective camera; no
  parallax drift / no `parallaxFactor`), §5 (`createScene` contract), §6
  (`params.camera` = `fov` + `zoom` only).

## Implementation steps
1. **`src/scene.js`:** export `createScene(params)` returning
   `{ scene, camera, update(params, dt, t) }` per the §5 contract:
   - Build the `THREE.Scene` and the gentle-perspective `PerspectiveCamera`
     (FOV/zoom from `params.camera`), positioned once and **not moved** afterward.
   - Instantiate each layer via its factory (currently just `createSkyLayer`),
     add each `object3d` to the scene at its correct `z`, and keep the layer
     handles in an array so `update` can fan out to all of them.
   - `update(params, dt, t)`: call each layer's `update(params, dt, t)`. It does
     **not** move the camera.
   - Provide a `resize(width, height, camera)` path (or expose the layer resize
     hooks) so layers that fit themselves to the frustum (e.g. sky) can refit.
2. **Refactor `main.js`:** replace the inline scene/camera/sky wiring with
   `const { scene, camera, update } = createScene(params)`. The render loop
   computes `dt`/`t` and calls `update(params, dt, t)` then
   `renderer.render(scene, camera)`. The resize handler updates `camera.aspect` +
   projection + renderer size and forwards to the scene's resize path so the sky
   quad still fills the frame.

## Acceptance criteria (Definition of Done for this task)
- [~] The scene renders exactly as after Task 2 (sky gradient), now assembled
      through `scene.js` — **no visual regression**. *(Code path is unchanged for
      the sky; module graph + sky layer intact. Final pixel parity needs a browser
      eye.)*
- [x] The camera does **not** move (fixed viewpoint); nothing drifts yet (content
      motion arrives with clouds/grass in later tasks). *(`update` never touches
      `camera.position`/rotation; only syncs fov/zoom from params.)*
- [x] `scene.js` conforms to `{ scene, camera, update }` (plus `resize`/`dispose`,
      additive); `main.js` no longer builds layers directly (only renderer + loop +
      resize + delegating to `createScene`).
- [x] Resize stays clean (sky quad still fills the frame at all aspect ratios).
      *(resize → camera aspect/projection + sky `resize(camera)` refit.)*
- [x] No console errors; clean `npm run build`. *(10 modules transformed, 0
      errors; dev server serves all modules HTTP 200, no overlay.)*

## Notes / guardrails
- **No parallax.** Do not add camera drift, `parallaxAmount`, `parallaxSpeed`, or
  per-layer `parallaxFactor` — the camera is fixed (plan §4, decided 2026-06-26).
  Depth is purely `z` order + overlap.
- Keep the layer list extensible: registering a new layer in later tasks should be
  "instantiate factory, push to array, add `object3d`" — nothing more.
- Camera config stays in `params.camera` (`fov`, `zoom`) — do not hardcode it in
  `scene.js`.

## Verification log
- `npm run dev` (2026-06-26): Vite ready; HTTP 200 for `/`, `/src/main.js`,
  `/src/scene.js`, `/src/params.js`, `/src/layers/sky.js`; no error overlay in any
  transformed module. Server stopped cleanly.
- `npm run build` (2026-06-26): ✓ 10 modules transformed, 0 errors (was 9 before
  `scene.js`).
- Code review: `createScene` builds scene + fixed camera (fov/zoom from
  `params.camera`), holds layers in an array, fans out `update`/`resize`; never
  moves the camera. `main.js` reduced to renderer + loop + resize delegating to
  `createScene`. No parallax / `parallaxFactor` introduced.
- Open: pixel-level "no regression vs Task 2" confirmation needs a human browser
  check (`npm run dev` → sky gradient looks identical).
