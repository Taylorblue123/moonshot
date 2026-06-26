# Task 5 — ridge (fence + hill) + grass with wind sway (M1.4)

| | |
|---|---|
| **Milestone step** | M1.4 |
| **Status** | not started |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §3 Layer Stack (z=4 Ridge, z=5 Grass), §4 (Broadcast `wind`), §5 Module Contracts, §6 `params.grass` + `params.wind` |
| **Depends on** | Task 4 (`scene.js` assembles layers; broadcast `uWind` pattern established by clouds) |
| **Blocks** | Task 6 (foreground grass + butterflies reuse the grass sway + `uWind`) |

---

## Objective

Add the two mid-ground layers that give the scene its ground plane and horizon:
the **ridge** (a dark hill silhouette with the black slatted fence running along
it) and the **grass field** (a shaded grass plane whose blades **sway** under the
broadcast wind). After this the scene reads as "a grassy hill under a cloudy dusk
sky," recognizably the reference layout.

## Traceability
- **Satisfies (spec):** DoD #1 (the fence + hill ridge and grass become visible
  depth layers), DoD #2 (grass sways = gentle life), DoD #5 (the fence-on-a-hill
  is a defining feature of the reference).
- **Implements (design):** `plan.md` §3 rows z=4 (Ridge, static) + z=5 (Grass,
  `uWind` vertex sway), §4 (wind broadcast), §6 (`params.grass.*`,
  `params.wind.*`).

## Implementation steps
1. **Ridge layer (`src/layers/ridge.js`)** — `createRidgeLayer(scene, params)`:
   - A mostly-static dark silhouette of the hill line + a slatted fence running
     along the ridge (the reference's fence rises gently left→right).
   - Procedural-first: a shader (or geometry) drawing (a) a hill/ground mask
     below a sloped horizon line, filled near-black, and (b) evenly-spaced
     vertical fence posts + rails along that line. Keep it readable as a
     silhouette, not detailed.
   - Sits at the ridge `z` (in front of clouds, behind grass). Per the §5
     contract: `{ object3d, update(params, dt, t), dispose(), resize?(camera) }`.
     Ridge is static, so `update` may be a no-op (still accept the signature).
2. **Grass layer (`src/layers/grass.js`)** — `createGrassLayer(scene, params)`:
   - A grass field filling the lower portion of the frame, colored from
     `params.grass.color`, with blade/texture detail (procedural shader; blade
     shapes via noise or a vertex-displaced strip — implementer's choice).
   - **Wind sway:** blades displace horizontally by the broadcast wind. Drive it
     with a `uWind` (and/or `uTime`) uniform exactly as clouds do —
     `wind.strength * wind.direction` — so "make it windy" moves grass + clouds
     together from one knob. Sway should be a gentle, blade-tip-weighted bend
     (more at the top, anchored at the base), not a whole-layer slide.
   - `params.grass.lushness` modulates density/saturation; `params.grass.height`
     scales blade height. Colors/knobs from `params` only.
   - Sits at the grass `z` (in front of the ridge). §5 contract.
3. **Register in `scene.js`** — add ridge then grass to the layer array, in
   far→near order (clouds → ridge → grass). No `main.js` change needed.

## Acceptance criteria (Definition of Done for this task)
- [ ] A dark hill silhouette with a visible **slatted fence** runs across the
      frame along the ridge line (recognizably the reference's fence-on-a-hill).
- [ ] A **grass field** fills the lower frame, colored from `params.grass.color`.
- [ ] Grass **sways** with the wind; changing `params.wind.strength` changes sway
      amount and `params.wind.direction` flips the lean — using the same broadcast
      `wind` as the clouds.
- [ ] Changing `params.grass.color` / `lushness` / `height` visibly changes the
      grass — all from `params`, no hardcoded look in the shader.
- [ ] Correct depth order: clouds behind the ridge, ridge behind the grass.
- [ ] No console errors; resize stays clean; clean `npm run build`.

## Notes / guardrails
- **Wind is broadcast** — read `params.wind` exactly as `clouds.js` does. Do not
  invent a grass-only wind value.
- "Recognizable, not perfect" — a readable fence silhouette + a swaying shaded
  grass field is the bar; don't rabbit-hole on per-blade realism (foreground
  detail + butterflies come in Task 6, post-FX mood in Task 8).
- Procedural-first per §4/§7; a painted texture is an allowed fallback for either
  layer if procedural looks bad, with the same `update(params, dt, t)` interface.
- Sway must be base-anchored (tips move, roots don't) so the field doesn't slide
  as a rigid sheet.

## Verification log
_(fill in when run)_
- `npm run build` result:
- `npm run dev` result (module HTTP 200s, no overlay):
- Observation (fence silhouette, grass look, sway, depth order):
- Param-change tests (wind.strength / wind.direction / grass.color / lushness / height):
