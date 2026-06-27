# Moonshot — working notes & checklist (yours)

1. fake the comments first and test the agent against local browser page first
2. scene change comments of commands concurrency and race condition
   2.1: command queue with batching, conflict resolution, and rate limiting?
   2.2: Caching of common intents + Cheap LLM Classifier for comments
3. 2D or 3D for prototype mvp?
4. JS control API? But the API should be exactly tool schema for stage 2 agent to use
5. command queue + conflict/rate handling (classify and combine/cache relavant commands into a queue; slice window for max commands combined)
6. Wire comments lists on youtube into local rendered page
7.

---

# HANDOFF — session 2026-06-22

> Read this to get fully caught up. Records the original project draft, the
> research done, and every decision made. The checklist above is the user's own
> priority scratchpad; each numbered item is resolved in §5 below.

## 1. Project in one line

A 24/7 interactive lo-fi scene with ambient music, where comments on a live
YouTube channel are read automatically and an AI agent turns those comment
instructions into real-time scene changes.

## 2. Original draft plan (baseline we are iterating from)

**Stage 1 — Lovable scene + control interface**
- Implement a lovable scene (2D or 3D) + pick a few lo-fi ambient tracks.
- Build the scene demo AND expose interface APIs/tools so an external system can
  control the scene's parameters/behavior.

**Stage 1 (cont.) — Agentic system**
- Design + implement an agentic system that turns instructions into scene
  manipulations using that control interface, so any input modifies the scene.

**Stage 2 — Turn the local demo into a YouTube channel**
- Research how to make a virtual scene into a YouTube live channel.
- Handle real-world challenges: parallel instructions, caching, speed.

Original notes: plan is a draft, subject to change; split into small, clear steps
with clear feedback to stay motivated.

## 3. What research changed (key takeaways)

1. The hard part is NOT the scene or the streaming — both are commodity (OBS +
   Browser Source → RTMP for streaming; chat-reading AI agents already exist).
   The novel/risky part is the **agent layer that turns messy chat into safe,
   coherent scene changes under concurrency.** Spend effort there.
2. **Key architectural insight:** the scene's control API **is** the LLM tool
   schema. Design them together (= checklist item 4).
   ```
   Chat ──▶ Agent (LLM + tools) ──▶ {tool, params} JSON ──▶ Scene API ──▶ Render
   ```
3. **YouTube chat quota wall:** 10,000 units/day per project; naive polling
   exhausts it. Build all agent work against a FAKE chat feed; touch the real
   API only at the end. Prefer `liveChatMessages.streamList`, respect
   `pollingIntervalMillis` (= checklist item 1).
4. **Concurrency is the boss fight**, promoted to its own milestone (= items 2 & 5).
5. **Latency/cost:** cache common intents; consider a cheap classifier before the
   expensive LLM (= item 2.2).

## 4. Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Visual target | **2.5D layered painterly scene** matching the reference (Antent "end of era" — grass hill + fence + cumulus sky + lone character + butterflies, lo-fi dusk) | The beauty in the reference is *painterly layered art + parametric animation + atmosphere*, NOT a true-3D world |
| Render style | **2.5D** — textured layer-quads at different `z`, **fixed** gentle-perspective camera | Real depth via `z` order + overlap; camera does NOT move (decided 2026-06-26). All life comes from content motion (wind/clouds/butterflies), matching the static reference |
| Stack | **Three.js as a 2.5D compositor** | Free texture loading, scene graph, render loop, and a mature `EffectComposer` post-FX chain; per-layer look is custom `ShaderMaterial` (user's GLSL skills stay central). Easiest path + user learns the standard lib. |
| Mood engine | **Per-layer GLSL shaders + EffectComposer post stack** (grade · grain · bloom · vignette) | Every layer's animation/look and the global mood are shader uniforms → the agent's control surface |
| Escape hatch | **OGL** if Three.js abstraction chafes | Scene architecture (layered quads + uniforms + post pass) is identical, so pivoting is low-cost. Not expected. |
| GPU cost | **Deferred** | Set aside for now; deployment concern that resurfaces only at M6, not an architecture concern. (2.5D is far cheaper than true 3D anyway.) |
| LLM provider | **Decide at M4** — scene built provider-agnostic | No need to commit now |

Stack history (so the chain is clear):
- 2026-06-22: first picked 2.5D/PixiJS, then **reversed to 3D/Three.js** (user
  fluent in 3D, GPU cost deferred).
- 2026-06-25: user shared the **reference image** (a painterly 2.5D lo-fi scene)
  and clarified the agent should drive **weather, cloud density, wind**, etc.
  Re-examined: the target is painterly layered art, not a true-3D world. A full-3D
  scene would *fight its own renderer* to look painterly, and cloud-density/weather
  are hard in true 3D (volumetrics) but natural in 2.5D. **Final: Three.js used as
  a 2.5D layered compositor.** PixiJS ruled out — its grain is 2D sprites, and our
  look is built from custom shaders + a post-FX chain (Three.js's strength). OGL
  noted as a clean escape hatch.

Why Three.js is still the easiest here: it gives texture loading, the scene graph,
the render loop, and `EffectComposer` for free, while leaving every layer's look
to the user's own GLSL inside `ShaderMaterial`. PixiJS is easier ONLY for plain
sprite parallax with no custom shaders/post-FX — not our case.

> ⚠️ MVP scope discipline: the mood comes from shaders + post-processing, which can
> rabbit-hole. Build the scene layer by layer; get the *pipeline* (textured quad →
> custom shader → post pass → screen) proven first, then add layers and polish.

## 5. Resolution of the checklist (items 1–7 above)

- **1 (fake comments first):** ✅ adopted. All of stage 2 built vs a fake chat feed.
- **2 / 2.1 / 2.2 / 5 (concurrency, queue, caching, classifier):** ✅ promoted to
  milestone **M5** — command queue with batching, conflict resolution, rate
  limiting, intent caching, and a cheap pre-classifier; sliding window combines
  max N commands per tick.
- **3 (2D or 3D MVP):** ✅ resolved → **2.5D layered painterly scene built in Three.js (used as a compositor)**. Evolution: 2.5D/PixiJS → 3D/Three.js → (after reference image) 2.5D-in-Three.js. MVP = the reference scene.
- **4 (control API = tool schema):** ✅ adopted as the core architectural rule.
- **6 (wire YouTube comments into rendered page):** → milestone **M7** (after the
  agent works locally; quota-safe).
- **7:** open / TBD.

## 6. Milestones (each ends in something VISIBLE)

Stage 1 — Scene + control API (local)
- **M1** 2.5D layered scene renders (reference look: sky → clouds → fence/hill →
  grass → foreground butterflies) with per-layer shaders + one post-FX pass +
  content motion (drifting clouds, swaying grass, fluttering butterflies; fixed
  camera). *Looks like the reference.*
- **M2** JS control API (`window.scene.setX(...)`) + debug panel. *Click → change.*
- **M3** Ambient music + track switching via same API. *Audio responds.*

Stage 2 — Agentic control (local, FAKE chat)
- **M4** Tool schema (= M2 API) + LLM emits tool calls. *"rainy at night" works.*
- **M5** Command queue + conflict/rate/cache/classifier vs simulated burst.
  *20 fake comments don't break the scene.*

Stage 3 — Go live
- **M6** OBS Browser Source → YouTube RTMP (unlisted test). *Scene live on YouTube.*
- **M7** Real YouTube chat (quota-safe) → M5 queue. *Real comment moves scene.*
- **M8** Hardening — caching, moderation, 24/7 stability.

## 7. Next action — M1 spec (2.5D layered scene in Three.js)

Reference: Antent "end of era / ambient mix" — grass hill + black fence + giant
cumulus sky + lone character silhouette + drifting blue butterflies, lo-fi dusk
palette, gentle content animation (fixed camera).

Stack: **Vite + Three.js + JavaScript** (JS not TS — user preference; JSDoc
typedefs for editor hints). Scene = textured/shaded quads stacked by `z`, viewed
by a gentle-perspective (or near-ortho) **fixed** camera; per-layer look = custom
`ShaderMaterial`; global mood = one EffectComposer post pass.

Layer stack (far → near) — *as built (2026-06-27); fence dropped, grass→hill,
butterflies→fireflies; see build order below for the rationale:*
1. **Sky** — gradient shader, `timeOfDay` ramp (`skyRamp.js`)  ✅
2. **Stars + moon** — points/sprite, twinkle + shooting-star  *(later)*
3. **Cloud band** — fbm cumulus, drift by `uWind`; color tracks the sky via
   `skyRamp` (lift more by day, less at night) so clouds stay visible-not-glaring  ✅
4. **Hill** — fbm-ridge ground mass, breathes with `uWind`, darkens into a
   backlit silhouette at night via `timeOfDay`  ✅ *(was "fence + hill"; fence
   dropped — procedural picket fence is a rabbit-hole with little payoff)*
5. **Fireflies** — `THREE.Points` glowing motes above the ridge, elliptical-orbit
   drift + alpha pulse, fade in/out by `timeOfDay`  ✅ *(was "grass + butterflies";
   butterflies deferred to their own milestone — different technique)*
6. **Post FX** — color grade + vignette (+ grain)  *(later)*

Build order (step-by-step, each runnable):
M1.0 scaffold → cleared canvas · M1.1 sky-gradient quad (first shader) ·
M1.2 scene.js layer assembler (fixed camera) · M1.3 cloud layer + `uWind` ·
**M1.4 hill (fbm ridge + wind breathing + night silhouette)** ✅ ·
**M1.5 fireflies (Points, orbit drift + pulse, night fade)** ✅ ·
M1.6 stars/moon + character silhouette · M1.7 post-FX pass ·
M1.8 wire everything through `params` (see §6 architecture rule) + idle motion.

> M1.4/M1.5 note: the foreground was re-scoped to "lively, easy-to-code,
> params-driven lo-fi" rather than a 1:1 reference copy — fence dropped,
> fireflies chosen as the life signal. `timeOfDay` now also drives cloud color
> and hill darkness (not just the sky), all through `skyRamp.js`.

**Done when:** localhost shows a recognizably reference-like 2.5D dusk scene with
drifting clouds, swaying grass, butterflies, and a post-FX mood pass — all values
read from a single `params` object (ready for M2 to expose as the tool schema).

Cautions: keep `params`-driven from the start (don't hardcode); prove the
pipeline on one layer before adding the rest; art can be procedural (shaders),
illustrated assets, or hybrid — TBD per layer, procedural-first for MVP.

## 8. Scene parameter list (the agent's control surface — = the M2/M4 tool schema)

This is the master list of what the agent can manipulate. Grouped by domain.
Two are **broadcast** params (one value, many layers subscribe): `wind` and
`timeOfDay`. All are continuous/enumerable → clean tool-call targets.

**Sky / time**
- `timeOfDay` (0–24 or dawn/day/dusk/night) — drives sky gradient stops, light tint, star/moon visibility ★broadcast
- `skyTopColor`, `skyHorizonColor` — gradient endpoints
- `sunMoonPosition` (angle/azimuth), `sunMoonGlow` (intensity), `bodyType` (sun|moon|crescent)
- `starDensity`, `starTwinkleSpeed`
- `shootingStarRate` (frequency), `shootingStarIntensity`

**Clouds**
- `cloudCoverage` / `cloudDensity` (0–1) — the headline control
- `cloudType` (wispy ↔ cumulus ↔ storm)
- `cloudDriftSpeed`, `cloudDriftDirection`
- `cloudColor` / `cloudTint`, `cloudHeight` (band position)

**Weather**
- `precipType` (none | rain | snow | petals)
- `precipIntensity` (0–1)
- `fogDensity` / `haze` (depth + mood)
- `lightningRate` (flash frequency; storm only)

**Wind** ★broadcast
- `windStrength` (0–1), `windDirection` — consumed by grass sway, cloud drift, butterflies, precip slant

**Foreground / life**
- `butterflyCount`, `butterflySpeed`, `butterflyColor`, `butterflyBehavior` (calm|scatter)
- `grassColor` / `grassLushness`, `grassHeight`
- `fireflyCount` (night), falling `leafCount` / `petalCount`
- `characterVisible`, `characterPose` (later/optional)

**Mood / post-FX** (global)
- `colorTemperature` (warm↔cool), `brightness`, `contrast`, `saturation`
- `vignette` (0–1), `bloom` (0–1), `filmGrain` (0–1)
- `moodPreset` — convenience macro that sets a coherent bundle (e.g. `rainy_night`,
  `golden_hour`, `clear_dusk`); the agent's easiest high-level lever

**Camera** (fixed — no drift in M1; decided 2026-06-26)
- `fov`, `zoom` (gentle)
- `cameraOffset` — static framing offset only (not animated)
- *(dropped: `parallaxAmount` / `parallaxSpeed` — camera does not move; a drift
  option could return later as an agent-controllable extra, but is out of scope)*

**Audio** (M3+)
- `track` (select/next), `volume`
- `weatherAudioCoupling` (rain sound auto-plays with rain, etc.)

Design note: expose both **low-level knobs** (e.g. `cloudCoverage`) AND
**high-level macros** (`moodPreset`, `setWeather('storm')` that fans out to several
knobs). The agent prefers macros for natural language ("make it stormy"); the
debug panel (M2) exposes the low-level knobs. Both map to the same `params`.

## 9. Environment

- Dir `/Users/mac/Desktop/Projects/moonshot` (git repo, branch `main`). Node v22.22.3, npm 10.9.8.
- Scaffold in progress: `package.json`, `index.html`, `src/main.js` (Step 1 renderer+loop) exist; `npm install` pending.
- User reads the rendered **`notes.html`** in a browser, not the `.md`. Keep both in sync.
