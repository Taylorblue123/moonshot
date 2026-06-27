# Task 6 — fireflies layer (M1.5)

| | |
|---|---|
| **Milestone step** | M1.5 |
| **Status** | implemented — code/build verified + browser-checked (night) |
| **Spec** | [`docs/specs/m1.md`](../../specs/m1.md) |
| **Design** | [`plan.md`](./plan.md) §3 Layer Stack (z=6 foreground life), §4 (Broadcast `timeOfDay`; fixed camera), §5 Module Contracts; new `params.fireflies` block |
| **Depends on** | Task 5 (hill — fireflies drift in a band *above* the ridge) |
| **Blocks** | — (butterflies are a separate, later effort with their own technique) |

> **Plan divergence (intentional, 2026-06-27).** `plan.md` §3 row z=6 is
> "foreground grass + butterflies". This task ships **fireflies** instead — the
> chosen lo-fi life signal. **Butterflies are deferred** to their own milestone
> with a different technique (`InstancedMesh`, to flap wings); fireflies are
> glowing dots and use `THREE.Points`. The two do **not** share a system.

---

## Objective

Add the **fireflies layer** — a swarm of soft glowing motes drifting in a band
above the hill ridge. Each mote traces its own slow elliptical path (phases
offset so they don't pulse in sync), glows by additive blending + an alpha pulse,
and **fades in at night / out by day** via `timeOfDay`. The foreground's primary
"alive" signal.

## Traceability
- **Satisfies (spec):** advances DoD #1 (nearest depth layer), DoD #2 (drifting,
  pulsing motes = the headline "gentle life"), DoD #4 (all knobs from `params`).
- **Implements (design):** `plan.md` §3 row z=6 (re-scoped to fireflies), §4
  (`timeOfDay` broadcast drives the night fade), §5 (layer contract); introduces
  the `params.fireflies` block (notes.md §8 `fireflyCount`).

## Implementation steps (as built)
1. **`params.fireflies` block** (+ `FirefliesParams` typedef):
   `{ count: 60, color: '#cfe8a0', driftSpeed: 0.3, glow: 0.8, pulseSpeed: 1.0 }`.
2. **Firefly shaders** — `src/shaders/fireflies.vert` + `.frag`:
   - **Vertex:** position computed in-shader from per-point attributes (`aPhase`,
     `aRadius`, `aPulse`, seeded once) + `uTime` → a small elliptical orbit
     (wider than tall). `gl_PointSize` from `uGlow`. **No wind term** — see the
     guardrail below.
   - **Fragment:** soft radial halo via `gl_PointCoord` (`smoothstep` falloff) ×
     `uColor` × per-mote alpha pulse (offset by `aPulse` so they breathe out of
     sync) × `uNightFactor`.
3. **`src/layers/fireflies.js`** — `createFirefliesLayer(scene, params)`:
   - `THREE.Points` + `ShaderMaterial` with `AdditiveBlending` (overlaps
     brighten → luminous), `depthTest/Write = false`.
   - Attributes seeded **once** in a band above the ridge (`BAND_LOW 0.4` →
     `BAND_HIGH 0.62` of frame height); deterministic hashed seeding (no
     `Math.random`, which is unavailable in the sandbox). `count` change rebuilds.
   - `update`: per frame only pushes uniforms (`uTime`, `uGlow`, `uDrift`,
     `uPulseSpeed`, `uColor`, `uNightFactor = nightFactor(timeOfDay)`) — no
     per-frame buffer writes → no GC churn.
4. **Night fade** — `skyRamp.nightFactor(timeOfDay)` (added in this work): ~1 at
   night, ~0 by day, smooth dawn/dusk ramps; multiplies layer alpha so fireflies
   vanish in daylight with no agent intervention.
5. **Registered in `scene.js`** after the hill: `z=-4`, `renderOrder=-600` →
   nearest / foreground-most layer.

## Acceptance criteria (Definition of Done for this task)
- [x] A swarm of soft glowing motes above the hill ridge; soft halos, not squares.
- [x] Motes drift on individual elliptical paths and **pulse out of sync**.
- [x] `params.fireflies.count/color/glow/pulseSpeed` all change the swarm live.
- [x] **Night fade:** bright at night, fade ~to nothing in daylight as
      `timeOfDay` sweeps; smooth at dawn/dusk. *(Browser-confirmed: invisible at
      `timeOfDay` 7/12, visible at 19–22.)*
- [x] Additive glow reads luminous; nearest depth (in front of hill); no console /
      shader-compile errors; build clean; `resize` re-seeds the band to fit.

## Notes / guardrails
- **No broadcast-wind term (deliberate).** An earlier build added a monotonic
  `uWind` x-offset like the clouds — but motes are *discrete points*, so the swarm
  swept off-screen to the right with nothing re-entering. Removed. Fireflies now
  hover in place; the elliptical orbit provides all the horizontal wander. **They
  do not consume `params.wind`** — a future "it's windy" command won't move them.
  (A bounded wind sway — `sin`-based, not accumulating — could be added later.)
- **All motion in the vertex shader; attributes seeded once** → 24/7-safe, no GC.
- **`THREE.Points`, one draw call.** Butterflies (later, `InstancedMesh`) are a
  separate system — not generalized into this layer.
- **`uTime` long-run float precision** is a known 24/7 concern deferred to **M8**,
  same as clouds.
- **Glow without bloom:** additive halo + pulse read luminous on their own; M1.7
  bloom will enhance, not enable.

## Verification log
- `npm run build`: ✓ 20 modules (+fireflies.js/.vert/.frag, +`nightFactor` in
  skyRamp.js), 0 errors.
- Browser (worktree dev server, 2026-06-27): swarm of ~60 green motes, good
  spread, soft additive halos, out-of-sync pulse. **Band lowered** `BAND_HIGH`
  0.78 → 0.62 per review (motes drifted too high into the cloud zone). **Wind
  sweep-off-screen bug fixed** by removing the `uWind` term (see guardrail).
  Night fade confirmed across `timeOfDay`.
