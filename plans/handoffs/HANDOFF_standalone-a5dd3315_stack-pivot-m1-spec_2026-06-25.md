# HANDOFF: Moonshot — Stack Pivot to 2.5D-in-Three.js + Full M1 Spec

**Chain:** standalone-a5dd3315 (seq 2, continuation)
**Parent:** HANDOFF_standalone-a5dd3315_project-planning_2026-06-22.md (seq 1)
**Date:** 2026-06-25
**Auto:** false
**Status:** Planning re-locked after a stack pivot. M1 spec written. Scaffold partially started; `npm install` NOT yet run. No layers built.
**Next Action:** Run `npm install`, then build M1.0 (cleared canvas) → M1.1 (sky-gradient shader), teaching Three.js step-by-step.

---

## Since Last Handoff (seq 1 → seq 2)

Seq 1 ended with: "Next Action = update stale CLAUDE.md to Three.js, then scaffold M1 (Vite + Three.js + **TypeScript**), build a **minimal lit 3D scene**."

What actually happened this session, in order:
1. Onboarded from seq 1. Noted CLAUDE.md was already fixed at seq-1 close (so that "next action" was already done).
2. Reflected on M1 scaffold; confirmed **gentle perspective** camera + **`params` object from day one** (two AskUserQuestion answers).
3. Taught the WebGL→Three.js mental model; user chose **step-by-step, file-by-file** teaching pace.
4. **User switched TypeScript → JavaScript** (not fluent in TS).
5. Started scaffolding: wrote `package.json`, `index.html`, `src/main.js` (Step-1 renderer+loop).
6. **`npm install` was REJECTED by the user** — they interrupted to roll back and re-discuss goals.
7. **User shared the REFERENCE IMAGE** (Antent "end of era / ambient mix" — a painterly 2.5D lo-fi scene) and clarified the agent should drive **weather, cloud density, wind**.
8. Big re-evaluation: **the target is painterly 2.5D, not a true-3D world.** Decision pivoted again.
9. Resolved a sequence of user questions: JS vs TS impact; teach-by-doing Three.js; "is Three.js still right for 2.5D?"; "easiest approach — raw WebGL or Three.js?"; "other better stacks?"; "what is 2D-sprite grain vs 2.5D Three.js?".
10. **Final decision: Three.js used as a 2.5D layered compositor.** Updated all plan docs + added the full parameter list + wrote `docs/specs/m1.md`.

Net change vs seq 1: render approach moved from **"minimal lit 3D"** to **"2.5D layered painterly scene matching the reference"**; language **TS → JS**; a full parameter list and a standalone M1 spec now exist.

---

## Goal (unchanged)

Build **Moonshot**: a 24/7 interactive lo-fi YouTube live channel. An ambient
scene with lo-fi music where live YouTube chat comments are read automatically and
an AI agent turns them into real-time scene changes. 8 milestones (M1–M8). The
agent layer (M5) is the hard part; the scene/streaming are commodity.

**This session's concrete goal became:** lock the scene tech approach against the
reference image, define the full agent control surface (parameters), and produce a
buildable M1 spec.

---

## Where We Are

- **Repo:** git, branch `main`. One commit so far (`50fc652`, the seq-1 close).
  **Everything from THIS session is uncommitted** (modified + untracked).
- **Modified (uncommitted):** `CLAUDE.md`, `notes.md`, `notes.html` — all updated
  to the 2.5D-in-Three.js decision + full parameter list.
- **Untracked (uncommitted):** `docs/specs/m1.md` (new full M1 spec), `index.html`,
  `package.json`, `src/main.js`, `src/main2.js`.
- **`npm install` NOT run** → no `node_modules`, dev server never started, nothing
  has rendered yet. The scaffold is real on disk but not runnable.
- **Environment:** Node v22.22.3, npm 10.9.8, macOS. `bd` unavailable.

### Files this session touched/created
| File | State | Notes |
|---|---|---|
| `notes.md` | ✅ updated | Source of truth. Decisions table rewritten, §8 = full parameter list, §7 = M1 layer/build plan. Uncommitted. |
| `notes.html` | ✅ updated | Rendered view the user actually reads (`open notes.html`). Mirrors notes.md. Footer dated 2026-06-25. Uncommitted. |
| `CLAUDE.md` | ✅ updated | "What this is", stack decisions (now JS + 2.5D compositor), M1 milestone; points to docs/specs/m1.md. Uncommitted. |
| `docs/specs/m1.md` | ✅ NEW | The full M1 spec (the main deliverable the user requested). Uncommitted. |
| `package.json` | ✅ created | three ^0.169.0, vite ^5.4.0, type:module, dev/build/preview scripts. Uncommitted. |
| `index.html` | ✅ created | #app div, loads /src/main.js. Uncommitted. |
| `src/main.js` | ✅ created | Step-1 renderer + render loop, heavily commented w/ WebGL→Three.js mapping. Uncommitted. |
| `src/main2.js` | ⚠️ USER-created | **Exact duplicate of main.js.** Likely a stray copy. Recommend deleting before building. Uncommitted. |

---

## Key Decisions This Session (with rationale)

### 1. STACK PIVOT: Three.js as a 2.5D layered compositor (THE headline decision)
**Full evolution chain (so nobody re-litigates):**
- 2026-06-22 (seq 1): 2.5D/PixiJS → reversed to **3D/Three.js** (user fluent in 3D; GPU cost deferred).
- 2026-06-25 (this session): user shared the **reference image** + named the agent
  controls (weather/cloud-density/wind). Re-examined → **2.5D-in-Three.js**.

**Why the pivot:** The reference's beauty is **painterly layered art + parametric
animation + atmosphere**, NOT a true-3D world. Two concrete arguments:
- A full-3D scene would have to *fight its own renderer* to look painterly (the
  weeks-of-shader-tuning rabbit hole we'd flagged).
- **Cloud density** (the user's headline control) is painful in true 3D
  (volumetrics) but natural in 2.5D (blend painted layers / noise shader on a sky
  quad). Same for weather.

**Why Three.js (not PixiJS, not raw WebGL):**
- It's the **easiest** path: free texture loading, scene graph, render loop, and a
  mature `EffectComposer` post-FX chain. The user only writes the *shaders* (their
  strength) — not the buffer/FBO/loader plumbing.
- **PixiJS ruled out:** explained via "2D-sprite grain" — PixiJS's atom is a flat
  sprite, depth is faked by draw-order; custom GLSL + a post-FX chain are a
  secondary/awkward path there. Our look IS custom shaders + post-FX = Three.js's
  bread and butter. PixiJS only wins for *plain image parallax with no shaders*.
- **Raw WebGL ruled out:** maximum control but you hand-write loaders/FBO/quads —
  weeks of plumbing that buys nothing here; also skips the "learn Three.js" goal.
- **OGL = noted escape hatch:** the research surfaced OGL ("minimal abstraction for
  devs who write their own shaders") as a clean fit for the user's skills. If
  Three.js's abstraction ever chafes, pivot is low-cost — scene architecture
  (layered quads + uniforms + post pass) is identical. Not expected.

Research cited (web, 2025–2026): Three.js best for "sophisticated 2.5D parallax
with custom GLSL + advanced effects"; OGL for "minimal abstraction"; PixiJS only
when you "don't need advanced shader/lighting work."

### 2. Language: JavaScript, not TypeScript
User isn't fluent in TS. Decision: **plain JS + JSDoc typedefs** for editor hints
(zero compile step). TS is a superset; can migrate individual files to `.ts` later
where types pay off most (the agent↔tool-schema boundary at M4). This reversed the
seq-1 "Vite + TS" plan.

### 3. Camera: gentle perspective (~40° FOV), not orthographic
Perspective gives real depth + cozy photographic feel + cinematic-camera payoff
(matches the reference). Orthographic = flat diorama (only if a paper-craft look is
wanted later). One-line swap; camera config lives in `params.camera` so it's
reversible at no cost.

### 4. `params`-driven from day one (architecture rule, reaffirmed)
All tunable values live in a single `params` object; modules read from it each
frame. Makes M2 (control API) a thin set of setters, NOT a refactor. Confirmed via
AskUserQuestion. This is the operational form of the core rule "scene control API
= LLM tool schema."

### 5. Teaching mode: step-by-step, file-by-file
User has WebGL/OpenGL/GLSL experience but is NEW to Three.js, and wants to **learn
by doing**. Chosen pace: build one concept at a time, explain the WebGL→Three.js
mapping before each, pause to run. (See the mapping table in §"WebGL→Three.js" below.)

---

## The Full Parameter List (agent control surface = M2/M4 tool schema)

Lives in `notes.md`/`notes.html` §8. `★` = broadcast (one value, many layers).
Summary (full detail in notes):
- **Sky/time:** `timeOfDay`★, `skyTopColor`, `skyHorizonColor`, `sunMoonPosition`,
  `sunMoonGlow`, `bodyType`, `starDensity`, `starTwinkleSpeed`, `shootingStarRate`,
  `shootingStarIntensity`.
- **Clouds:** `cloudCoverage`/`cloudDensity` (headline), `cloudType`,
  `cloudDriftSpeed`, `cloudDriftDirection`, `cloudColor`/`cloudTint`, `cloudHeight`.
- **Weather:** `precipType` (none|rain|snow|petals), `precipIntensity`,
  `fogDensity`/`haze`, `lightningRate`.
- **Wind ★:** `windStrength`, `windDirection` (→ grass sway, cloud drift,
  butterflies, precip slant).
- **Foreground/life:** `butterflyCount/Speed/Color/Behavior`,
  `grassColor/Lushness/Height`, `fireflyCount`, `leafCount`/`petalCount`,
  `characterVisible/Pose`.
- **Mood/post-FX:** `colorTemperature`, `brightness`, `contrast`, `saturation`,
  `vignette`, `bloom`, `filmGrain`, `moodPreset` (macro).
- **Camera:** `parallaxAmount`, `parallaxSpeed`, `zoom`, `cameraOffset`.
- **Audio (M3+):** `track`, `volume`, `weatherAudioCoupling`.

Design rule: expose **both** low-level knobs (`cloudCoverage`) AND high-level
macros (`moodPreset`, `setWeather('storm')` that fans out). Agent prefers macros
for NL; debug panel exposes knobs. Both map to the same `params`.

---

## M1 Spec Summary (full doc: docs/specs/m1.md)

**Target:** recognizable 2.5D dusk scene matching the reference (NOT pixel-perfect).
**Stack:** Vite + Three.js + JavaScript; procedural-first (shaders), illustrated
assets optional later; gentle-perspective camera; EffectComposer post pass.

**Layer stack (far→near):** Sky (gradient shader) → Stars+moon → Clouds (noise/
texture, drift by `uWind`) → Ridge (fence+hill) → Grass (vertex-sway by `uWind`) →
Foreground grass + butterflies (instanced) → Post-FX (grade+vignette+grain).

**Planned file structure:** `src/main.js`, `src/params.js`, `src/scene.js`,
`src/layers/{sky,stars,clouds,ridge,grass,butterflies,character}.js`,
`src/postfx/{composer,lofiPass}.js`, `src/shaders/*`.

**Module contract:** each layer = factory returning
`{ object3d, update(params, dt, t), dispose() }`. `scene.js` →
`createScene(params)` returning `{ scene, camera, update(params,dt,t) }`.
`postfx/composer.js` → `createComposer(renderer, scene, camera, params)`.

**Build order (each runnable):** M1.0 scaffold+cleared canvas · M1.1 sky shader ·
M1.2 camera+parallax · M1.3 clouds+`uWind` · M1.4 ridge+grass sway · M1.5
butterflies · M1.6 stars/moon+character · M1.7 post-FX pass · M1.8 wire all through
`params` + idle motion.

**DoD:** localhost shows reference-like 2.5D dusk scene with drifting clouds,
swaying grass, butterflies, post-FX mood — ALL values from one `params` object.

---

## WebGL → Three.js teaching map (for the next session to continue teaching)

| User knows (raw WebGL/GL) | Three.js gives | Hidden |
|---|---|---|
| `gl` context, viewport, clear, draw loop | `WebGLRenderer` + `setAnimationLoop` | GL state; loop still user's |
| VBO/IBO, attrib pointers | `BufferGeometry` / `PlaneGeometry` | vertexAttribPointer bookkeeping |
| vertex+frag shader, useProgram, uniforms | `ShaderMaterial` | program linking; default vertex shader |
| model matrix per object | `Mesh` + `.position/.rotation/.scale` | matrix composition |
| scene graph / parent transforms | `Object3D` tree + `Scene` | tree walk + matrix multiply |
| view+projection matrices | `PerspectiveCamera` | matrix building |
| FBO ping-pong, fullscreen quad | `EffectComposer` + `ShaderPass` | FBO juggling + fullscreen blit |

One-liner that unlocks it: *Three.js = a scene-graph + shader-generator on top of
the WebGL pipeline you already know.* The custom-shader path (`ShaderMaterial`,
`lofiPass`) is the user's home turf — that's the bridge.

---

## Open Questions / Risks

1. **⚠️ `src/main2.js` is a stray exact-duplicate of `main.js`** (user-created).
   Recommend deleting before building to avoid confusion. (`src/main.js` is the
   real one referenced by `index.html`.)
2. **Nothing committed this session** — all M1-spec + scaffold work is uncommitted.
   (Will be handled at session close.)
3. **`npm install` not run** — first action next session; the user previously
   rejected it mid-rollback, so confirm before running.
4. **Art source per layer is TBD** — procedural-first is the plan, but clouds may
   need a painted texture if procedural looks bad (module interface stays the same).
5. **Checklist item #7** (in notes.md) still blank/open.
6. **LLM provider** still deferred to M4. **GPU hosting** still deferred to M6.

---

## User Preferences (carry forward — important)

- **Reads `notes.html` in a browser, NOT `.md` in terminal/IDE.** Keep notes.html
  in sync with notes.md every time.
- **JavaScript, not TypeScript.**
- **Learns by doing; wants Three.js taught step-by-step, file-by-file**, with the
  WebGL→Three.js mapping explained per step.
- **Reflects and reverses decisions deliberately** — has now pivoted the stack
  twice. Values being asked + reasoned tradeoffs over defaults. Present options,
  recommend, but let them decide.
- Works iteratively, small steps, clear visible feedback. Don't jump ahead of the
  agreed milestone.

---

## Immediate Next Steps (in order)

1. Delete `src/main2.js` (stray duplicate).
2. Confirm with user, then run `npm install`.
3. **M1.0:** `npm run dev` → see the cleared dusk canvas. Explain renderer + loop
   (mapping to user's `gl` context + RAF).
4. **M1.1:** write `src/params.js` (with JSDoc typedef) + the **sky gradient
   layer** (`src/layers/sky.js` + sky shader) — the first ShaderMaterial. Pause to
   run/verify before adding more layers.
5. Continue M1.2→M1.8 per docs/specs/m1.md, syncing notes.html as milestones land.

---

## Session Closed
**Closed at:** 2026-06-25
**Commit:** 476600b
**Session status:** Handed off to next session

Cleanup done at close: deleted stray `src/main2.js` duplicate. All work committed.
