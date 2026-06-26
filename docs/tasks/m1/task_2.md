# Task 2 — params.js + sky gradient layer (M1.1)

| | |
|---|---|
| **Milestone step** | M1.1 |
| **Status** | not started |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §5 Module Contracts, §6 `params` Object, §3 Layer Stack (z=1) |
| **Depends on** | Task 1 (working renderer + loop) |
| **Blocks** | Task 3 (`scene.js` assembles layers), every later layer (all read `params`) |

---

## Objective

Stand up the single source of tunable state (`params`) and render the first
layer — a full-screen **sky gradient** drawn by a custom `ShaderMaterial`, whose
colors are derived from the **`timeOfDay`** broadcast value via a time→color ramp
(`skyRamp.js`). This proves the textured-quad → custom-shader path, establishes
the `params`-driven rule, and wires the first ★broadcast knob (`timeOfDay`).

## Traceability
- **Satisfies (spec):** first concrete progress on DoD #1 (layered scene) and the
  foundation for DoD #4 (fully parameter-driven — the gradient is driven by
  `timeOfDay`, with no colors hardcoded in the shader).
- **Implements (design):** `plan.md` §6 (the `params` object + JSDoc typedef),
  §5 (layer module contract), §3 row z=1 (Sky, "Animated by `timeOfDay`"), §4
  (`timeOfDay` is a ★broadcast value).

## Implementation steps
1. **`src/params.js`:** export the `params` object from `plan.md` §6 (M1 clear-dusk
   subset). `timeOfDay` (0–24) is the source of truth for the sky — there are **no
   manual sky-color knobs**. Add a JSDoc `@typedef SceneParams`. Only place tunable
   values live.
2. **`src/skyRamp.js`:** a pure `skyColorsForTime(timeOfDay)` →
   `{ topColor, horizonColor }` mapping that interpolates between named keyframes
   around the 24h clock (night → dawn → day → dusk → night). Reusable later by
   stars/moon/mood.
3. **Sky shader:** add `src/shaders/sky.vert` + `src/shaders/sky.frag`. The frag
   shader produces a vertical gradient from `uTopColor` to `uHorizonColor` by
   UV height. No color hardcoded.
4. **`src/layers/sky.js`:** export `createSkyLayer(scene, params)` returning
   `{ object3d, update(params, dt, t), dispose(), resize(camera), horizonColor(p) }`:
   - A `PlaneGeometry` sized to fill the view, placed at the far `z`.
   - A `ShaderMaterial` with `uTopColor`/`uHorizonColor` seeded from
     `skyColorsForTime(params.timeOfDay)`.
   - `update()` recomputes the colors from `p.timeOfDay` via the ramp each frame
     and writes the uniforms (so changing `timeOfDay` re-colors the sky live).
   - `horizonColor(p)` exposes the current horizon color so `scene.js` can match
     the clear color to the time of day.
5. **Wire into the scene:** the sky layer is assembled by `scene.js` (Task 3), and
   `scene.js` sets `scene.background` from `sky.horizonColor(params)` each frame so
   any gap matches the time of day.

## Acceptance criteria (Definition of Done for this task)
- [ ] The canvas shows a smooth vertical **sky gradient**, no banding artifacts,
      no console errors.
- [ ] Changing **`params.timeOfDay`** (e.g. 6 = dawn, 12 = midday, 22 = night) and
      reloading visibly re-colors the sky — and the background clear color matches.
      **No color is hardcoded in the shader; there are no manual sky-color knobs.**
- [ ] The sky fills the frame at all window sizes (resize still clean).
- [ ] `sky.js` conforms to the `{ object3d, update, dispose }` contract (plus
      additive `resize` / `horizonColor`).

## Notes / guardrails
- **`timeOfDay` is the source of truth** for the sky — no manual `sky.topColor` /
  `horizonColor` knobs. This keeps the agent's lever a single broadcast number.
- Gradient colors, and any other tunable values, must come **from `params`** via
  uniforms — this is the rule the whole milestone depends on.
- Keep the quad full-frame for now; precise depth placement vs. other layers is
  handled when `scene.js` assembles the layer stack in Task 3.
- Procedural-first: no texture needed for the sky.

## Verification log
_(fill in when run)_
- `npm run dev` result:
- Screenshot / observation:
- Param-change test (topColor/horizonColor):
