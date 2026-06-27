// params.js — the SINGLE source of tunable scene state.
//
// Architecture rule (non-negotiable): ALL tunable values live here; nothing
// tunable is hardcoded in rendering code. This keeps the scene params-driven
// and turns M2's control API into thin setters, not a refactor.
//
// M1 "clear-dusk" subset. Some keys (e.g. `weather`) are forward-looking hooks
// for later milestones and do not affect the scene yet.

/**
 * @typedef {Object} StarsParams
 * @property {number} density           0–1, how many stars are visible.
 * @property {number} twinkleSpeed      Twinkle animation rate.
 * @property {number} shootingStarRate  Probability/rate of shooting stars.
 */

/**
 * @typedef {Object} CloudsParams
 * @property {number} coverage    0–1, fraction of sky covered by cloud.
 * @property {number} driftSpeed  Horizontal drift speed.
 * @property {number} driftDir    Drift direction sign (+1 / -1).
 * @property {string} tint        Hex tint applied to the clouds.
 * @property {number} height      0–1, vertical placement of the cloud band.
 */

/**
 * @typedef {Object} WindParams  ★broadcast — consumed by clouds + grass + butterflies.
 * @property {number} strength    0–1 wind strength.
 * @property {number} direction   Sign of the wind direction (+1 / -1).
 */

/**
 * @typedef {Object} GrassParams
 * @property {string} color     Hex base color of the grass.
 * @property {number} lushness  0–1 density/saturation of the grass.
 * @property {number} height    Relative blade height multiplier.
 */

/**
 * @typedef {Object} ButterfliesParams
 * @property {number} count     Number of butterflies.
 * @property {number} speed     Flutter/drift speed.
 * @property {string} color     Hex butterfly color.
 * @property {string} behavior  Behavior preset (e.g. 'calm').
 */

/**
 * @typedef {Object} FirefliesParams
 * @property {number} count       Number of fireflies (point count).
 * @property {string} color       Hex glow tint.
 * @property {number} driftSpeed  Elliptical-orbit + wind motion rate.
 * @property {number} glow        0–1 halo size / intensity.
 * @property {number} pulseSpeed  Alpha-breath (blink) rate.
 */

/**
 * @typedef {Object} CameraParams
 * @property {number} fov   Vertical field of view in degrees.
 * @property {number} zoom  Camera zoom multiplier.
 *   The camera is fixed (no parallax drift) in M1 — see plan.md §4.
 */

/**
 * @typedef {Object} MoodParams
 * @property {number} colorTemperature  0–1, cool→warm overall grade.
 * @property {number} brightness        Exposure multiplier.
 * @property {number} contrast          Contrast multiplier.
 * @property {number} saturation        Saturation multiplier.
 * @property {number} vignette          0–1 vignette strength.
 * @property {number} bloom             0–1 bloom strength.
 * @property {number} filmGrain         0–1 grain strength.
 */

/**
 * @typedef {Object} WeatherParams  Hooks for later milestones — NOT implemented in M1.
 * @property {string} precipType       'none' | 'rain' | 'snow' | ...
 * @property {number} precipIntensity  0–1 precipitation intensity.
 * @property {number} fogDensity       0–1 fog density.
 * @property {number} lightningRate    Rate of lightning flashes.
 */

/**
 * @typedef {Object} SceneParams
 * @property {number}            timeOfDay     Hours 0–24 (18.5 = dusk). ★broadcast —
 *   the single source of truth for the sky gradient (via skyRamp.js) and, later,
 *   stars/moon/mood. There are NO manual sky-color knobs.
 * @property {StarsParams}       stars
 * @property {CloudsParams}      clouds
 * @property {WindParams}        wind          ★broadcast.
 * @property {GrassParams}       grass
 * @property {FirefliesParams}   fireflies
 * @property {ButterfliesParams} butterflies
 * @property {CameraParams}      camera
 * @property {MoodParams}        mood
 * @property {WeatherParams}     weather       Hooks only in M1.
 */

/** @type {SceneParams} */
export const params = {
  timeOfDay: 20.0, // night (hours, 0–24)  ★broadcast — drives the sky gradient
  stars: { density: 0.4, twinkleSpeed: 1.0, shootingStarRate: 0.03 },
  clouds: {
    coverage: 0.55,
    driftSpeed: 0.01,
    driftDir: 1,
    tint: "#ffffff",
    height: 0.82,
  },
  wind: { strength: 5.0, direction: 1.5 }, // ★broadcast
  grass: { color: "#243b3a", lushness: 0.7, height: 1.0 },
  fireflies: {
    count: 60,
    color: "#cfe8a0",
    driftSpeed: 0.3,
    glow: 0.8,
    pulseSpeed: 1.0,
  },
  butterflies: { count: 40, speed: 0.5, color: "#8fb7ff", behavior: "calm" },
  camera: { fov: 40, zoom: 1.0 }, // fixed camera — no parallax drift in M1
  mood: {
    colorTemperature: 0.45,
    brightness: 1.0,
    contrast: 1.05,
    saturation: 1.0,
    vignette: 0.35,
    bloom: 0.2,
    filmGrain: 0.08,
  },
  // hooks for later milestones (not implemented in M1):
  weather: {
    precipType: "none",
    precipIntensity: 0,
    fogDensity: 0.1,
    lightningRate: 0,
  },
};
