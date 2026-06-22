# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Pre-code / planning stage.** The repo currently contains only `notes.md` (the
authoritative handoff + decision log) and `notes.html`. There is no scaffold,
build, or test setup yet. The immediate task is **M1** (see Milestones).

`notes.md` is the source of truth for goals, research takeaways, and locked
decisions — read it before starting work. Keep it updated as milestones land.

## What this is

Moonshot is a 24/7 interactive lo-fi YouTube live channel: a 3D scene
with ambient music where live YouTube chat comments are read automatically and an
AI agent turns them into real-time scene changes.

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

- **Render: 3D scene** (Three.js). Chosen over 2.5D because the user is more
  fluent in the 3D pipeline and 3D gives a richer, more natural agent control
  surface (continuous semantic params: camera pos/FOV, light color/intensity, fog
  density, sun angle, transforms). **GPU cost is deferred** — it's a deployment
  concern that resurfaces only at M6, not an architecture concern.
- **Three.js** — real cameras, lights, materials + `ShaderMaterial` and
  `EffectComposer` post-processing. The lo-fi mood comes from **3D lighting + a
  post-processing pass stack** (grade · grain · bloom · vignette); the lighting
  params and shader uniforms become the agent-controllable parameters.
- **LLM provider: decided at M4.** Build the scene provider-agnostic until then.
- Planned scaffold: **Vite + TypeScript + Three.js.**

> M1 scope discipline: lo-fi mood in 3D leans on lighting/post tuning, which can
> rabbit-hole. Keep M1 minimal — primitives + one light + simple camera + ONE
> post pass. Cozy comes later.

## Milestones (each ends in something visible)

Stage 1 — Scene + control API (local)
- **M1** Minimal lit 3D scene renders (primitives/low-poly + one directional light
  + simple camera) with one EffectComposer post pass (vignette + color grade) +
  gentle idle animation. *Looks nice.*
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
