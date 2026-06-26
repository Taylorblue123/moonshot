# M1 Plan — Architecture & Design

**Type:** Design / technical plan (the HOW) for [M1 spec](../../specs/m1.md).
**Last updated:** 2026-06-25
**Audience:** the implementer. This is the architecture layer between the spec
(WHAT/WHY) and the per-step task docs (`task_1.md` … `task_9.md`).

> This doc holds all the design decisions and contracts. The spec stays
> stack-agnostic on purpose; everything technology-specific is here so it can
> evolve during implementation without rewriting the contract.

---

## 1. Tech & Conventions

- **Stack:** Vite + Three.js + **JavaScript** (not TypeScript).
- **Three.js role:** used as a **2.5D compositor**, not a 3D world — textured
  `PlaneGeometry` quads at different `z`, a single camera, custom
  `ShaderMaterial` per layer, and `EffectComposer` for the post-FX pass. We do
  **not** use 3D lighting / shadows / PBR. (The lit-3D icosahedron in
  `src/sandbox.js` is a learning playground, not part of this scene.)
- **Types:** JSDoc typedefs (`/** @typedef ... */`) on the parameter shape for
  editor autocomplete without a compile step.
- **Camera:** gentle perspective (~40° FOV) for subtle depth — see §4.
- **Art source:** procedural-first (shaders generate sky/clouds/grass) so the
  scene is fully parametric. Painted PNG textures may replace individual layers
  later; a layer's external interface (§5) stays the same either way.
- **Architecture rule (non-negotiable):** all tunable state lives in the
  `params` object; modules read from it every frame. This is what makes DoD #4
  true and makes M2's control API a thin set of setters instead of a refactor.

### Why this stack (summary; full rationale in the handoff & `notes.md`)
The reference's beauty is painterly layered art + parametric animation +
atmosphere, **not** a true-3D world. Cloud density / weather (the agent's headline
controls) are natural in 2.5D (blend layers / noise shaders) but painful in true
3D (volumetrics). Three.js is the easiest path that keeps the user writing only
shaders (their strength) while it handles loaders / scene graph / render loop /
post-FX FBO plumbing. OGL is a noted low-cost escape hatch if Three.js's
abstraction chafes — the layered-quad architecture is identical.

---

## 2. File Structure

```
moonshot/
├── index.html              # mounts #app, loads src/main.js
├── package.json            # three + vite
├── vite.config.js          # add only if needed; defaults are fine to start
└── src/
    ├── main.js             # bootstrap: renderer, composer, camera, loop, params wiring
    ├── sandbox.js          # NON-M1 Three.js playground (lit 3D icosahedron)
    ├── params.js           # SceneParams: single source of tunable state + JSDoc typedef
    ├── skyRamp.js          # timeOfDay (0–24) → sky gradient colors (pure ramp)
    ├── scene.js            # assembles the layer stack into a THREE.Scene
    ├── layers/
    │   ├── sky.js          # sky gradient quad (ShaderMaterial)
    │   ├── stars.js        # stars (points) + moon sprite + shooting stars
    │   ├── clouds.js       # cumulus band (noise shader or texture), drifts by wind
    │   ├── ridge.js        # fence + hill silhouette (mostly static plane)
    │   ├── grass.js        # mid + foreground grass, vertex-sway by wind
    │   ├── butterflies.js  # instanced butterflies, flutter + drift
    │   └── character.js    # lone silhouette (sprite); optional in M1
    ├── postfx/
    │   ├── composer.js     # EffectComposer + RenderPass + lofiPass
    │   └── lofiPass.js     # custom ShaderPass: color grade + vignette (+ grain)
    └── shaders/            # .glsl or template-literal strings, per layer
        ├── sky.frag / sky.vert
        ├── clouds.frag
        ├── grass.vert / grass.frag
        └── lofi.frag
```

Keep each layer in its own module exposing the small interface in §5 so the scene
is composable and each piece is independently visible / testable.

---

## 3. Layer Stack (far → near)

| z (far→near) | Layer | Look | Animated by |
|---|---|---|---|
| 1 | **Sky** | vertical gradient (dusk blue → pale near horizon) | `timeOfDay` (gradient stops, tint) |
| 2 | **Stars + moon** | sparse points + a crescent; faint by day | `starTwinkleSpeed`, `shootingStarRate` |
| 3 | **Clouds** | painterly cumulus band; soft, billowy | `uWind` (drift), `cloudCoverage`, `cloudDriftSpeed` |
| 4 | **Ridge (fence + hill)** | dark silhouette line across the frame | static |
| 5 | **Grass (mid)** | textured / shaded grass field | `uWind` vertex sway |
| 6 | **Foreground grass + butterflies** | taller grass + drifting blue butterflies | `uWind` sway + butterfly motion |
| — | **Post FX** | color grade + vignette over the whole frame | `mood.*` |

Depth is created two ways, combined: (a) real `z` separation of the quads (far
layers behind, near layers in front), and (b) painterly overlap + the dark
foreground framing. The camera is **fixed** (no drift) — see §4.

---

## 4. Key Design Decisions

### Camera: fixed, gentle perspective
- **Fixed camera (no drift).** The camera does **not** move. This matches the
  reference, which is a static composition — all life in the scene comes from
  **content motion** (clouds drift, grass sways, butterflies flutter via wind),
  not from a moving viewpoint. Decision (2026-06-26): camera parallax drift was
  dropped to stay faithful to the reference and reduce complexity.
- **Gentle perspective (~40° FOV) [default]:** real depth, cozy photographic feel.
- **Orthographic:** flatter "diorama" look; choose only if a paper-craft aesthetic
  is wanted later. One-line swap; camera config lives in `params.camera`, so it's
  reversible at no cost. Start with gentle perspective.

### Depth without camera motion
Because the camera is fixed there is **no parallax drift and no per-layer
`parallaxFactor`**. Depth is read from real `z` separation of the quads + painterly
overlap + haze + the dark foreground framing (see §3). `params.camera` keeps `fov`
and `zoom`; the `parallaxAmount` / `parallaxSpeed` keys are dropped from the M1
implementation (they may return later as an agent-controllable option, but are not
built in M1).

### Broadcast params
`wind` and `timeOfDay` are **broadcast** values: one number in `params`, consumed
by many layers (wind → clouds + grass + butterflies; timeOfDay → sky + stars +
mood). Layers subscribe by reading `params` each frame. This is the abstraction
the agent will love ("make it windy" = one knob, whole scene responds).

`timeOfDay` does **not** map to a layer directly — it maps through a **ramp**
(`src/skyRamp.js`): `skyColorsForTime(timeOfDay)` interpolates named keyframes
around the 24h clock (night → dawn → day → dusk → night) into the sky's top +
horizon colors. The sky has **no manual color knobs**; `timeOfDay` is its sole
input. `scene.js` also tints `scene.background` from the ramp's horizon color so
gaps match the time. Stars/moon/mood will read the same ramp / `timeOfDay` later.

### Procedural vs illustrated art
Procedural-first (shaders). If a layer resists looking good procedurally (e.g.
cumulus clouds), it may use a painted texture — the layer's `update(params, dt)`
interface stays the same.

---

## 5. Module Contracts

Each layer module exports a factory returning a consistent shape so `scene.js`
can build / update them uniformly:

```js
// layers/<name>.js
/**
 * @param {THREE.Scene} scene
 * @param {SceneParams} params
 * @returns {{ object3d: THREE.Object3D, update(params: SceneParams, dt: number, t: number): void, dispose(): void }}
 */
export function createSkyLayer(scene, params) { /* ... */ }
```

- `object3d` — added to the scene by `scene.js`.
- `update(params, dt, t)` — called every frame; reads `params`, advances
  animation (`dt` = delta seconds, `t` = elapsed seconds), updates uniforms.
- `dispose()` — frees geometry / material / textures (hygiene for a 24/7 app).

`scene.js` exports `createScene(params)` returning
`{ scene, camera, update(params, dt, t) }` whose `update` fans out to all layers.
The camera is fixed, so `update` does not move it.

`postfx/composer.js` exports `createComposer(renderer, scene, camera, params)`
returning `{ composer, update(params), setSize(w, h) }`.

---

## 6. The `params` Object (M1 subset)

M1 implements the **clear-dusk** subset of the full parameter list (full list in
`notes.md` §8 / `notes.html` §8). Unimplemented params may exist as hooks without
affecting the scene yet.

```js
/** @typedef {Object} SceneParams ... (full typedef in params.js) */
export const params = {
  timeOfDay: 18.5,                 // dusk (hours, 0–24)  ★broadcast — drives the
                                   //   sky gradient via skyRamp.js (no manual
                                   //   sky-color knobs); later stars/moon/mood too
  stars:  { density: 0.4, twinkleSpeed: 1.0, shootingStarRate: 0.03 },
  clouds: { coverage: 0.6, driftSpeed: 0.02, driftDir: 1, tint: '#ffffff', height: 0.55 },
  wind:   { strength: 0.4, direction: 1 },        // ★broadcast
  grass:  { color: '#243b3a', lushness: 0.7, height: 1.0 },
  butterflies: { count: 40, speed: 0.5, color: '#8fb7ff', behavior: 'calm' },
  camera: { fov: 40, zoom: 1.0 },   // fixed camera — no parallax drift in M1
  mood:   { colorTemperature: 0.45, brightness: 1.0, contrast: 1.05,
            saturation: 1.0, vignette: 0.35, bloom: 0.2, filmGrain: 0.08 },
  // hooks for later milestones (not implemented in M1):
  weather: { precipType: 'none', precipIntensity: 0, fogDensity: 0.1, lightningRate: 0 },
};
```

Design rule: expose **both** low-level knobs (`cloudCoverage`) and high-level
macros (`moodPreset`, `setWeather('storm')`) later. M1 only needs the knobs above
wired into the scene.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Shader / mood polish rabbit-hole | Time-box per layer; "recognizable, not perfect" is the bar; polish is post-M1 |
| Procedural clouds look bad | Fall back to a painted cloud texture for that layer (interface unchanged) |
| Hardcoding values now → M2 refactor later | Enforce `params`-driven from task_2; review DoD #4 |
| Scope creep (rain / audio / agent) | Those are M3–M5; M1 only hooks them in `params`, doesn't implement |
| 24/7 perf later | Note only; M1 just shouldn't leak (use `dispose()`); real perf work is M6/M8 |

---

## 8. Implementation steps

The ordered, individually-runnable build steps live in this directory as
`task_1.md` … `task_9.md` (mapping to M1.0 … M1.8). Each task is small, ends in a
visible result, and lists its own acceptance check. Build them in order; prove the
pipeline on `task_1` + `task_2` (one layer, one shader) before adding the rest.

---

## 9. Handoff to M2

When M1 is done, M2 builds the control API + debug panel. Because everything is
`params`-driven, M2 is: (1) expose setters / getters over `params`
(`window.scene.set('wind.strength', 0.8)`), (2) a small lil-gui panel bound to
`params`, (3) ensure each setter triggers the relevant layer to pick up the
change. **The setter surface defined here becomes the tool schema the M4 agent
calls** — so name params clearly and keep the shape stable.
