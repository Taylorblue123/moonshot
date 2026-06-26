# Task 4 — clouds layer + uWind (M1.3)

| | |
|---|---|
| **Milestone step** | M1.3 |
| **Status** | implemented — code/build verified (headless); needs a browser eye for look + drift |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §3 Layer Stack (z=3), §4 (Broadcast params; fixed camera), §5 Module Contracts, §6 `params.clouds` + `params.wind` |
| **Depends on** | Task 3 (`scene.js` assembles layers) |
| **Blocks** | Tasks 5–6 (grass/butterflies reuse the same broadcast `uWind`) |

---

## Objective

Add the **clouds layer** — a painterly cumulus band rendered above the sky — that
**drifts horizontally** under the broadcast wind value. This introduces the
`uWind` broadcast uniform pattern that grass and butterflies will reuse, and adds
the reference's signature big-cumulus element.

## Traceability
- **Satisfies (spec):** advances DoD #1 (another depth layer), DoD #2 (clouds
  drift = part of "gentle life"), and DoD #5 (the giant cumulus is a defining
  feature of the reference).
- **Implements (design):** `plan.md` §3 row z=3 (Clouds), §4 (wind is a
  ★broadcast value consumed by multiple layers), §6 (`params.clouds.*`,
  `params.wind.*`).

## Implementation steps
1. **Cloud shader:** add `src/shaders/clouds.frag` (+ a vertex shader or reuse a
   simple pass-through). Generate a soft, billowy cumulus band procedurally
   (fbm/value-noise) — soft edges, painterly, not a hard sprite. Inputs:
   - `uTime` (animation), `uWind` (horizontal scroll offset = wind strength ×
     direction × time), `uCoverage` (`params.clouds.coverage`), `uHeight`
     (`params.clouds.height`, vertical placement of the band), `uTint`
     (`params.clouds.tint` color).
   - Output RGBA with an **alpha** mask so the sky shows through gaps.
2. **`src/layers/clouds.js`:** export `createCloudsLayer(scene, params)` returning
   `{ object3d, update(params, dt, t), dispose() }`:
   - A `PlaneGeometry` quad placed at the clouds `z` (in front of sky, behind the
     ridge), sized to overfill the frame like the sky.
   - A transparent `ShaderMaterial` (`transparent: true`, sensible blending,
     `depthWrite: false`) with the uniforms above seeded from `params`.
   - `update(params, dt, t)`: advance the wind scroll
     (`uWind += params.wind.strength * params.wind.direction * params.clouds.driftSpeed * dt`,
     or compute from `t`) and refresh `uCoverage`/`uHeight`/`uTint` from `params`.
   - `dispose()` frees geometry + material.
3. **Register in `scene.js`:** add `createCloudsLayer` to the layer array at its
   `z` (in front of sky, behind the future ridge). No `main.js` change should be
   needed. (No parallax factor — the camera is fixed; depth is `z` order only.)

## Acceptance criteria (Definition of Done for this task)
- [~] A soft cumulus cloud band is visible above the sky gradient, with the sky
      showing through the gaps (alpha works — not an opaque rectangle). *(Code:
      `transparent:true` + alpha = density mask; fbm cumulus. Visual look needs a
      browser eye.)*
- [~] Clouds **drift horizontally**; `params.wind.strength` changes drift speed,
      `params.wind.direction` flips it. *(Code: `uWind += wind.strength *
      wind.direction * clouds.driftSpeed * dt`. Motion needs a browser eye.)*
- [x] Changing `params.clouds.coverage` changes cover, `params.clouds.height`
      moves the band vertically — all from `params`. *(uniforms refreshed from
      params every frame; no hardcoded knobs in the shader.)*
- [x] Clouds sit at the correct depth (sky `z=-10`, renderOrder -1000; clouds
      `z=-8`, renderOrder -900 → in front of sky, behind future ridge).
- [x] No console errors; build clean (13 modules); resize refits the quad
      (`resize(camera)`). Seamless scroll by design (continuous fbm coordinate, no
      tiling seam) — *visual seam check needs a browser eye.*

## Notes / guardrails
- **Wind is broadcast:** read `params.wind` here exactly as grass/butterflies will
  later, so "make it windy" later moves everything from one knob. Don't invent a
  clouds-only wind value.
- Procedural-first per §4/§7. If procedural cumulus looks bad after a time-box,
  fall back to a painted cloud texture scrolled by `uWind` — the layer's
  `update(params, dt, t)` interface stays identical, so `scene.js` is unaffected.
- "Recognizable, not perfect" — match the reference's soft, towering cumulus vibe;
  don't rabbit-hole on photoreal clouds.

## Verification log
- `npm run build` (2026-06-26): ✓ 13 modules transformed (was 10; +clouds.js,
  clouds.vert, clouds.frag), 0 errors.
- `npm run dev` (2026-06-26): Vite ready; HTTP 200 for `/src/scene.js`,
  `/src/layers/clouds.js`, `/src/shaders/clouds.frag?raw`,
  `/src/shaders/clouds.vert?raw`; no transform error in `clouds.js`. Stopped
  cleanly.
- Implementation: `clouds.frag` = value-noise fbm cumulus, vertical band mask at
  `uHeight`, coverage→threshold, `uTint` color, alpha = density (sky shows
  through). `clouds.js` mirrors `sky.js` (frustum-fill quad, `?raw` shaders,
  `resize`), registered as the 2nd layer in `scene.js`. Wind read from the
  BROADCAST `params.wind` (not a clouds-only value).
- Open (needs a human browser check): cumulus *looks* painterly/soft; horizontal
  drift visible and reverses with `wind.direction`; no scroll seam; coverage/height
  edits read correctly. GLSL only compiles at runtime — confirm no shader-compile
  error in the browser console.
- **2026-06-26 — cloud-vividness experiments, REVERTED.** First render vs the
  reference was faint translucent blue-grey haze. Tried two procedural reworks:
  (1) domain-warp + sharp alpha + fake self-shadow + horizon envelope — rendered
  as one huge murky-grey blob (noise scale wrong because it was computed in the
  oversized frustum-overfill quad's UV space); (2) screen-space quad rewrite to
  fix scale/placement — rendered as a busy, mirror-tiled, low-contrast cloud field
  (awkward, not cumulus). Both rejected by eye. **Reverted all three cloud files to
  the original simple-fbm band implementation.** Lesson: getting painted-cumulus
  vividness procedurally is the flagged rabbit-hole; revisit with either a more
  careful art-directed shader or the texture fallback (plan §7) post-M1, with the
  full scene (ridge/grass) for context. Build clean (14 modules).
