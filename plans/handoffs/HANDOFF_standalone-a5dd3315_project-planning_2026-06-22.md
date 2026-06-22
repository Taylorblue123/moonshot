# HANDOFF: Moonshot — Project Planning & Stack Decision

**Chain:** standalone-a5dd3315 (seq 1, new chain)
**Parent:** none
**Date:** 2026-06-22
**Auto:** false
**Status:** Planning complete; ready to build M1. No code written yet.
**Next Action:** Update stale `CLAUDE.md` to Three.js, then scaffold M1 (Vite + Three.js + TypeScript).

---

## Goal

Build **Moonshot**: a 24/7 interactive lo-fi YouTube live channel. A lovable
ambient scene with lo-fi music, where comments on a live YouTube channel are read
automatically and an AI agent turns those comment instructions into real-time
scene changes.

The user's original 3-stage draft: (1) lovable 2D/3D scene + control interface
APIs, (2) agentic system that turns instructions into scene manipulations via
that interface, (3) upgrade local demo into a YouTube live channel handling
parallel instructions, caching, speed. The user explicitly asked to: research the
project online, discuss the draft, then split into small intuitive steps with
clear feedback, and start the first steps.

This session was **planning + research + a key stack-decision reversal**. No code
was written. Output artifacts: `notes.md`, `notes.html`, project memory, and a
(now stale) `CLAUDE.md`.

---

## Where We Are

- **Repo state:** `/Users/mac/Desktop/Projects/moonshot` is now a git repo (branch
  `main`). It was NOT a repo at session start — git init + `CLAUDE.md` appeared
  during the session (user-initiated, outside the assistant's actions).
- **Untracked files:** `CLAUDE.md`, `notes.html`, `notes.md` (nothing committed yet).
- **No scaffold/build/test** exists. Pure planning stage.
- **Environment:** Node v22.22.3, npm 10.9.8, macOS (darwin 23.3.0).
- `bd` (beads) unavailable. No prior handoffs, no plans/, no BIBLE docs.

### Files produced this session
| File | Purpose | State |
|---|---|---|
| `notes.md` | Source-of-truth handoff + decision log. User's checklist at top, structured handoff below. | ✅ Current (Three.js) |
| `notes.html` | Self-contained styled browser-readable view of the same. User does NOT want to read .md in terminal/IDE. | ✅ Current (Three.js) |
| `~/.claude/projects/-Users-mac-Desktop-Projects-moonshot/memory/moonshot-project.md` + `MEMORY.md` | Durable cross-session project memory. | ✅ Current (Three.js) |
| `CLAUDE.md` | Repo guidance file. **User-created during session.** | ⚠️ STALE — still says 2.5D/PixiJS |

---

## Key Decisions (with rationale)

### 1. Architecture rule: the scene control API IS the LLM tool schema
Do not design them separately. The control surface = shader uniforms + scene
params (e.g. `setMood('rainy_night')` nudges `uRainIntensity`, `uColorTemp`,
`uVignette`, `uBloom`). Whatever the agent can call = exactly what the scene
exposes. This collapses "stage 2 translation layer" into "wire LLM JSON →
function calls." Data flow is the whole product:
```
Chat ──▶ Agent (LLM + tools) ──▶ {tool, params} JSON ──▶ Scene API ──▶ Render
```

### 2. The agent layer is the hard part — NOT the scene or streaming
Research confirmed scene rendering and OBS→RTMP streaming are commodity (Lofi
Girl-style streams, existing chat-reading AI agents). The novel/risky work is
turning messy CONCURRENT chat into safe, coherent scene changes. Concentrate
effort in **M5** (the "boss fight"). Build all agent work against a **fake chat
feed**; only touch real YouTube API at M7.

### 3. Render stack: 3D / Three.js — REVERSED MID-SESSION
This is the most important decision-chain event. **First decided 2.5D / PixiJS
v8, then reversed to 3D / Three.js.** Both states are recorded below because the
reversal logic matters.

- **Initial pick (2.5D / PixiJS v8):** chosen on three grounds — (a) gentler
  learning curve, (b) cheap 24/7 streaming on CPU (3D needs a GPU server), (c)
  lower asset cost. PixiJS v8 fit the user's stated WebGL/shader/JS background via
  its GLSL ES 3.0 `Filter.from()` pipeline. The recommended sweet spot was
  **2.5D** (2D layered parallax simulating depth) — "visual depth without full 3D
  cost." Three.js orthographic was runner-up.

- **Reversal trigger:** user said they are **more familiar with 3D settings and
  the 3D rendering pipeline**, and explicitly **deferred the GPU bottleneck**
  ("skip the GPU bottleneck for now since it's enough").

- **Why the reversal is correct:** Two of the three original arguments flipped.
  (a) Learning curve REVERSED — 3D is now the path of least resistance for this
  user. (b) GPU cost SET ASIDE by user — and it's a *deployment* concern
  (resurfaces only at M6), not an *architecture* concern. (c) Asset cost still
  mildly favors 2D but is the weakest argument and manageable (low-poly /
  primitives + good lighting). What 3D *gains*: a **richer, more natural agent
  control surface** — continuous semantic params (camera pos/FOV, light
  color/intensity, fog density, sun angle, transforms) that map cleanly onto LLM
  tool calls (the Agentic Scene Policies pattern); a free cinematic/moving camera;
  and shaders compose well via `ShaderMaterial` + `EffectComposer`.

- **Final: Three.js (3D), GPU cost deferred to M6.** Mood via 3D lighting +
  EffectComposer post passes (grade · grain · bloom · vignette).

- **Caveat captured:** don't over-scope M1 into a beautiful room. Lo-fi mood in 3D
  leans on lighting/post tuning that can rabbit-hole. M1 = deliberately minimal.

### 4. LLM provider: decide at M4
Build the scene provider-agnostic until then. No commitment now. (Knowledge note:
latest Claude models per system context are Opus 4.8 / Sonnet 4.6 / Haiku 4.5 /
Fable 5 — relevant when provider is chosen.)

### 5. YouTube quota wall drives "fake chat first"
10,000 units/day quota per project; naive `liveChatMessages.list` polling
exhausts it. Prefer `liveChatMessages.streamList`, respect the dynamic
`pollingIntervalMillis` the API returns. This is WHY all agent dev happens against
a fake chat feed; real API only at M7.

---

## Milestones (each ends in something VISIBLE)

**Stage 1 — Scene + control API (local)**
- **M1** Minimal lit 3D scene renders + one EffectComposer post pass + idle anim. *Looks nice.*
- **M2** JS control API (`window.scene.setX(...)`) + debug panel (sliders/buttons). *Click → change.*
- **M3** Ambient music + track switching via same API. *Audio responds.*

**Stage 2 — Agentic control (local, FAKE chat)**
- **M4** Tool schema (= the M2 API) + LLM emits tool calls. *"rainy at night" works.*
- **M5** Command queue: batching, conflict resolution, rate limiting, intent
  caching, cheap pre-classifier; sliding window combines max N commands per tick.
  *20 fake comments don't break the scene.* **← the boss fight.**

**Stage 3 — Go live**
- **M6** OBS Browser Source → YouTube RTMP (unlisted test). *Scene live on YouTube.* (GPU cost resurfaces here.)
- **M7** Real YouTube chat (quota-safe) → M5 queue. *Real comment moves scene.*
- **M8** Hardening — caching, moderation, 24/7 stability.

> Key re-slice vs the original draft: concurrency was promoted from a stage-3
> footnote to its own first-class milestone (M5), and ALL of stage 2 is built
> against fake chat.

---

## M1 Spec (the immediate next build)

Goal: one minimal lit 3D scene, in Three.js, served locally via Vite. No
interactivity yet.

- Vite + Three.js + TypeScript scaffold
- Minimal scene: room box / a few low-poly or primitive objects
- One directional light
- Simple camera (orthographic or gentle perspective)
- ONE EffectComposer post-processing pass (vignette + color grade) to prove the pipeline
- A gentle idle animation (slow drift / "breathing") so it's not fully static
- Runs at `npm run dev`

**Definition of done:** open localhost, see a minimal lit 3D scene with a working
post-processing pass.

After scaffolding, update `CLAUDE.md`'s "Expected commands" section with the real
`package.json` scripts.

---

## User's Working Checklist (verbatim, from notes.md top — their priority order)

1. fake the comments first and test the agent against local browser page first
2. scene change comments of commands concurrency and race condition
   - 2.1: command queue with batching, conflict resolution, and rate limiting?
   - 2.2: Caching of common intents + Cheap LLM Classifier for comments
3. 2D or 3D for prototype mvp?  → RESOLVED: 3D/Three.js
4. JS control API? But the API should be exactly tool schema for stage 2 agent
5. command queue + conflict/rate handling (classify and combine/cache relevant
   commands into a queue; slice window for max commands combined)
6. Wire comments lists on youtube into local rendered page
7. (blank / open)

Resolution mapping: #1→adopted (fake chat first). #2/2.1/2.2/5→M5. #3→3D/Three.js.
#4→core architecture rule (API=tool schema). #6→M7. #7→OPEN.

---

## Research Findings (2025-2026 web research, cited in notes)

- **Streaming is commodity:** OBS + Browser Source → RTMP to YouTube is how
  Lofi-Girl-style 24/7 channels work. (Indie Hackers 10-step guide, Widen Island,
  Lofi Girl Wikipedia.)
- **Chat-reading AI agents already exist:** e.g. GitHub `live-stream-chat-ai-agent`
  (watches video/audio/chat, replies via LLM), Streamlabs Intelligent Streaming
  Agent. The white space is agents that DRIVE a rendered scene's parameters.
- **NL → scene = function calling:** standard pattern is LLM emits structured
  JSON `{tool, params}`. Agentic Scene Policies (arXiv 2509.19571) shows the
  scene-manipulation tool pattern. The scene API = the tool schema.
- **Headless 3D without GPU is brutal:** WebGL in headless Chrome without a GPU is
  10×–50× slower, ~1–5 FPS. → 3D needs a GPU server for 24/7 (the cost the user
  deferred). 2D sprite rendering runs fine on CPU. (Relevant again at M6.)
- **YouTube quota:** 10k units/day per project; use `streamList`, respect
  `pollingIntervalMillis`. (Google Live Streaming API docs.)
- **PixiJS vs Three.js learning curve:** PixiJS = hours to grasp; Three.js = easy
  start but shaders/lighting "several weeks." NOTE: this argument was nullified by
  the user's 3D fluency.

---

## Open Questions / Risks

1. **⚠️ `CLAUDE.md` is STALE** — it still describes 2.5D / PixiJS v8 throughout
   (lines 16, 43-51, 56-57). `notes.md`, `notes.html`, and memory are all updated
   to Three.js, but `CLAUDE.md` was NOT. **First action next session: rewrite
   CLAUDE.md's "What this is", "Locked stack decisions", "M1", and "Expected
   commands" sections to Three.js.** Otherwise the repo's own guidance file
   contradicts the source of truth.
2. **Checklist item #7** is blank — undefined open slot. Ask user if it represents
   a forgotten concern.
3. **LLM provider** undecided (intentionally, until M4).
4. **GPU hosting** for M6 deferred but not solved — will need a GPU instance for
   24/7 3D streaming, an ongoing cost.
5. Nothing is committed to git yet.

---

## Notes for the Next Session

- The user does NOT want to read `.md` in the terminal/IDE — they read the
  rendered `notes.html` in a browser (`open notes.html`). Keep `notes.html` in
  sync whenever `notes.md` changes.
- `notes.md` is the declared source of truth (per CLAUDE.md). Keep it updated as
  milestones land.
- The user works iteratively and wants small steps with clear, visible feedback —
  honor the milestone structure; don't jump ahead.
- The user reversed a major decision after the assistant recommended; they value
  being asked and reasoning through tradeoffs, not just defaults.

---

## Session Closed
**Closed at:** 2026-06-22
**Commit:** 9367e17
**Session status:** Handed off to next session

Note: `CLAUDE.md` was updated to Three.js as part of this close (it was stale at
handoff-write time). The repo is now internally consistent.
