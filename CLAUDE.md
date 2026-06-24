# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Pre-code / planning stage.** The repo currently contains only `notes.md` (the
authoritative handoff + decision log) and `notes.html`. There is no scaffold,
build, or test setup yet. The immediate task is **M1** (see Milestones).

`notes.md` is the source of truth for goals, research takeaways, and locked
decisions — read it before starting work. Keep it updated as milestones land.

## What this is

Moonshot is a 24/7 interactive lo-fi YouTube live channel: a 2.5D layered
painterly scene (per the reference image — grass hill, fence, cumulus sky, lone
character, butterflies, lo-fi dusk) with ambient music, where live YouTube chat
comments are read automatically and an AI agent turns them into real-time scene
changes.

## Core architecture

The data flow is the whole product:

```
Chat ──▶ Agent (LLM + tools) ──▶ {tool, params} JSON ──▶ Scene API ──▶ Render
```

Two rules drive every design decision:

1. **The scene's JS control API _is_ the LLM tool schema.** Do not design them
   separately. The control surface is scene params + shader uniforms (e.g.
   `setMood('rainy_night')` nudges sun angle, light color/intensity, fog density,
   `uVignette`, `uBloom`). Whatever the agent can call must be exactly what the
   scene exposes.

2. **The agent layer is the hard part, not the scene or the streaming.** Scene
   rendering and OBS→RTMP streaming are commodity. The novel/risky work is turning
   messy concurrent chat into safe, coherent scene changes — spend effort there
   (concentrated in M5). Build all agent work against a **fake chat feed**; only
   touch the real YouTube API at M7.

## Locked stack decisions

- **Visual target: 2.5D layered painterly scene** matching the reference. The
  reference's beauty is painterly layered art + parametric animation + atmosphere,
  NOT a true-3D world. A full-3D scene would fight its own renderer to look
  painterly, and cloud-density/weather are hard in true 3D (volumetrics) but
  natural in 2.5D.
- **Render: 2.5D** — textured layer-quads at different `z`, gentle parallax camera.
- **Stack: Three.js used as a 2.5D compositor.** Gives free texture loading, scene
  graph, render loop, and `EffectComposer`; each layer's look is a custom
  `ShaderMaterial` (the user's GLSL skills stay central). Easiest path here, and
  the user still learns the standard lib. PixiJS was ruled out (its grain is 2D
  sprites; our look is custom shaders + a post-FX chain = Three.js's strength).
  **OGL** is a noted escape hatch if Three.js abstraction chafes — same scene
  architecture, low-cost pivot.
- **Language: JavaScript** (not TypeScript) — user preference; use JSDoc typedefs
  for editor hints. Migrate individual files to `.ts` later if desired (e.g. the
  agent↔tool-schema boundary at M4).
- **GPU cost: deferred** to M6 (deployment concern; 2.5D is cheap anyway).
- **LLM provider: decided at M4.** Build the scene provider-agnostic until then.
- Scaffold: **Vite + Three.js + JavaScript.**

> MVP scope discipline: the mood comes from shaders + post-processing, which can
> rabbit-hole. Build the scene layer by layer; prove the pipeline (textured quad →
> custom shader → post pass → screen) on ONE layer first, then add layers/polish.
> Route ALL tunable values through a single `params` object from the start so M2's
> control API is a no-op, not a refactor.

See `docs/specs/m1.md` for the full M1 spec and `notes.md` (rendered: `notes.html`)
for the full parameter list.

## Milestones (each ends in something visible)

Stage 1 — Scene + control API (local)
- **M1** 2.5D layered scene renders (sky → clouds → fence/hill → grass →
  foreground butterflies) with per-layer custom shaders + one EffectComposer post
  pass + gentle parallax/idle motion, all driven by a `params` object. *Looks like
  the reference.* (Full spec: `docs/specs/m1.md`.)
- **M2** JS control API (`window.scene.setX(...)`) + debug panel. *Click → change.*
- **M3** Ambient music + track switching via same API. *Audio responds.*

Stage 2 — Agentic control (local, FAKE chat)
- **M4** Tool schema (= the M2 API) + LLM emits tool calls. *"rainy at night" works.*
- **M5** Command queue with batching, conflict resolution, rate limiting, intent
  caching, and a cheap pre-classifier; sliding window combines max N commands per
  tick. *20 fake comments don't break the scene.* **This is the boss fight.**

Stage 3 — Go live
- **M6** OBS Browser Source → YouTube RTMP (unlisted test). *Scene live on YouTube.*
- **M7** Real YouTube chat → M5 queue. *Real comment moves scene.*
- **M8** Hardening — caching, moderation, 24/7 stability.

## YouTube API constraints (relevant at M7)

10,000 units/day quota per project; naive polling exhausts it. Prefer
`liveChatMessages.streamList` and respect `pollingIntervalMillis`. This is why all
agent development happens against a fake chat feed first.

## Environment

Node v22.22.3, npm 10.9.8.

## Expected commands (once M1 scaffold exists)

A Vite project has not been created yet. After scaffolding, the standard commands
will be `npm run dev` (M1 done = localhost shows the minimal lit 3D scene with a
working post-processing pass), `npm run build`, and `npm run preview`. Update this
section with the actual scripts once `package.json` exists.
