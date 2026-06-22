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
| Render style | **3D scene** (Three.js) | User is more fluent in 3D pipeline; richer/more natural agent control surface |
| Stack | **Three.js** | Real cameras, lights, materials + `ShaderMaterial` and `EffectComposer` post-processing; fits user's 3D + shader background |
| Mood engine | **3D lighting + post-processing passes** (grade · grain · bloom · vignette) via EffectComposer | Light color/intensity, fog, sun angle, camera, object transforms become continuous agent-controllable parameters |
| GPU cost | **Deferred** | Set aside for now ("enough for now"); it's a deployment concern that only resurfaces at M6, not an architecture concern |
| LLM provider | **Decide at M4** — scene built provider-agnostic | No need to commit now |

Three.js over PixiJS (revised 2026-06-22): the learning-curve argument that
favored 2D doesn't apply — user is *more* comfortable in 3D. With GPU cost
deferred, 3D wins on what matters most: a richer, more natural control surface
for the agent. 3D exposes genuinely continuous, semantic parameters (camera
pos/FOV, light color/intensity, fog density, sun angle, transforms) that map
cleanly onto LLM tool calls — e.g. "late afternoon" → agent dials sun angle +
warm light + fog. Plus a free cinematic/moving camera. The core architectural
rule is unchanged by this switch; only M1–M3 (renderer) change and a GPU
consideration is added at M6.

> ⚠️ M1 scope discipline: lo-fi mood in 3D leans on lighting/post tuning, which
> can rabbit-hole. Keep M1 minimal — low-poly/primitive scene, one light, simple
> camera, ONE post pass to prove the pipeline. Cozy comes later; pipeline-working
> comes first.

## 5. Resolution of the checklist (items 1–7 above)

- **1 (fake comments first):** ✅ adopted. All of stage 2 built vs a fake chat feed.
- **2 / 2.1 / 2.2 / 5 (concurrency, queue, caching, classifier):** ✅ promoted to
  milestone **M5** — command queue with batching, conflict resolution, rate
  limiting, intent caching, and a cheap pre-classifier; sliding window combines
  max N commands per tick.
- **3 (2D or 3D MVP):** ✅ resolved → **3D / Three.js** (revised from 2.5D/PixiJS once user confirmed 3D fluency + GPU cost deferred).
- **4 (control API = tool schema):** ✅ adopted as the core architectural rule.
- **6 (wire YouTube comments into rendered page):** → milestone **M7** (after the
  agent works locally; quota-safe).
- **7:** open / TBD.

## 6. Milestones (each ends in something VISIBLE)

Stage 1 — Scene + control API (local)
- **M1** Minimal lit 3D scene renders. *Looks nice.*
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

## 7. Next action — M1 spec

Three.js + Vite + TS scaffold; minimal scene (room box / a few low-poly or
primitive objects); one directional light; simple camera; ONE EffectComposer
post pass (vignette + color grade) to prove the pipeline; gentle idle animation;
runs at `npm run dev`.
**Done when:** localhost shows a minimal lit 3D scene with a working post-processing pass.

## 8. Environment

- Dir `/Users/mac/Desktop/Projects/moonshot` (fresh). Node v22.22.3, npm 10.9.8. Not a git repo.
