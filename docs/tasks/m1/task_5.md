# Task 5 — hill layer + uWind (M1.4)

| | |
|---|---|
| **Milestone step** | M1.4 |
| **Status** | implemented — code/build verified + browser-checked (day & night) |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §3 Layer Stack (z=4), §4 (Broadcast `uWind` + `timeOfDay`; fixed camera), §5 Module Contracts, §6 `params.grass` |
| **Depends on** | Task 4 (clouds — establishes the broadcast `uWind` pattern this reuses) |
| **Blocks** | Task 6 (fireflies — they drift in a band *above* the hill ridge, so the hill must exist first) |

> **Plan divergence (intentional, 2026-06-27).** `plan.md` §2/§3 named the next
> layer `ridge.js` = *fence + hill silhouette*. The **fence is dropped** — a
> procedural picket fence is a rabbit-hole with little payoff. This task ships a
> **hill-only** layer (`layers/hill.js`); the next life element is **fireflies**
> (Task 6), not the plan's grass/butterflies. The goal is restated as: a lively,
> easy-to-code, fully `params`-driven lo-fi foreground — not a 1:1 reference copy.

---

## Objective

Add the **hill layer** — a dark rolling-ground mass with a soft ridge silhouette
against the sky, occupying the lower part of the frame. Its ridge line and surface
**breathe** under the broadcast `uWind` (the same wind that drifts the clouds), and
it **darkens into a backlit silhouette at night** via `timeOfDay`, so the
foreground feels alive without any camera motion. Pure fragment shader, built 1:1
on the existing cloud-layer pattern.

## Traceability
- **Satisfies (spec):** advances DoD #1 (another depth layer — the ground plane
  every later foreground element sits on), DoD #2 (wind-coupled ridge/surface
  motion = part of "gentle life"), DoD #4 (all knobs from `params`).
- **Implements (design):** `plan.md` §3 row z=4 (re-scoped Ridge → Hill), §4
  (`wind` + `timeOfDay` are ★broadcast values), §6 (`params.grass.*`).

## Implementation steps (as built)
1. **Hill shaders** — `src/shaders/hill.vert` (pass-through, like clouds) +
   `src/shaders/hill.frag`:
   - **Ridge:** baseline `uHillHeight` displaced by `fbm(x)`; transparent above
     (alpha 0), filled below. Anti-aliased edge via `fwidth` so the line never
     jags at any resolution.
   - **Surface:** grass base color `uColor` modulated by a low-amplitude fbm
     (`uLushness` sets the amplitude) for painterly variation.
   - **Wind motion:** the fbm sample scrolls with `uWind` so ridge + surface
     breathe. Reuses the cloud value-noise/fbm — small amplitude, slow.
   - **Night silhouette:** `uNightFactor` (from `timeOfDay`) drops the hill toward
     a near-black silhouette at night so the ridge reads as a backlit edge against
     the deep-blue night sky rather than dissolving into it.
2. **`src/layers/hill.js`** — `createHillLayer(scene, params)` returning
   `{ object3d, update, dispose, resize }`, mirroring `layers/clouds.js`:
   - `PlaneGeometry(1,1)` quad at `z=-6`, scaled by `resize(camera)` to overfill
     the frame (`frustumSizeAt`), `frustumCulled = false`, transparent material
     (`depthTest/Write = false`).
   - `update`: advance `uWind` (`wind.strength × direction × HILL_DRIFT × dt`,
     `HILL_DRIFT = 0.004` so ground moves slower than clouds); refresh
     `uHillHeight`/`uColor`/`uLushness`/`uNightFactor` from `params`.
   - `ridgeFraction()` maps `params.grass.height` (a blade-height *multiplier*,
     ~1.0) to a ridge screen-fraction (`RIDGE_BASE = 0.38`, capped 0.6) — height
     1.0 puts the ridge crest ~30–38% up the frame.
3. **Registered in `scene.js`** after clouds: `z=-6`, `renderOrder=-700` (sky -1000,
   clouds -900) → in front of clouds, behind fireflies (`z=-4`).

## Acceptance criteria (Definition of Done for this task)
- [x] A dark hill mass fills the lower frame with a soft, rolling **fbm ridge**,
      anti-aliased edge (no jaggies). *(Browser-checked.)*
- [x] Above the ridge is **transparent** — sky and clouds show through.
- [x] Ridge + surface **breathe** with broadcast wind (`wind.strength` rate,
      `wind.direction` flips), subtle and slower than clouds.
- [x] `params.grass.color/height/lushness` recolor / raise / vary the hill live.
- [x] **Night silhouette:** at night the hill darkens to a near-black backlit
      shape whose ridge stays clearly readable against the night sky. *(Tuned to
      `×0.12` at full night after a first pass at `×0.25` washed out — see log.)*
- [x] Correct depth (in front of clouds); no console / shader-compile errors;
      build clean; `resize(camera)` refits the quad.

## Notes / guardrails
- **Broadcast `uWind` + `timeOfDay`:** read exactly as the other layers do; no
  hill-only copies. Reuses cloud fbm + `skyRamp.nightFactor` — not reinvented.
- **Calm by design:** surface detail (grass tufts, AO, depth bands) is out of
  scope; the foreground's *life* signal is the fireflies (Task 6).
- **`params.grass` reused** — no new params block this task.

## Verification log
- `npm run build`: ✓ 20 modules (was 14; +hill.js/.vert/.frag and the fireflies
  trio from Task 6), 0 errors.
- Browser (worktree dev server): hill renders as a soft fbm ridge; **ridge raised
  to ~30% via `RIDGE_BASE` 0.30 → 0.38** per review (first render sat too low).
- **Night-readability fix (with clouds, 2026-06-27):** first night pass had the
  hill at `grass.color × 0.25` — same brightness as the night sky, so the ridge
  dissolved. Root cause: night legibility is about *contrast*, not absolute
  brightness. Dropped to `× 0.12` so the hill is clearly darker than the
  blue-violet night sky → ridge reads as a backlit silhouette. Browser-confirmed
  at night (`timeOfDay` 19–22) and day (`timeOfDay` 12).
