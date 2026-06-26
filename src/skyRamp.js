// skyRamp.js — map timeOfDay (0–24h) → sky gradient colors.
//
// timeOfDay is the broadcast source of truth: one number drives the sky (and
// later stars/moon/mood). There are no manual sky-color knobs. Pure +
// framework-free (returns hex strings) so any layer can reuse it.

/**
 * Keyframes around the clock (hour → gradient stops); hours wrap at 24, ordered
 * by hour. Tuned for a lo-fi look: deep blue night, soft dawn/dusk, gentle day.
 * @type {{ hour: number, top: [number,number,number], horizon: [number,number,number] }[]}
 */
const STOPS = [
  { hour: 0, top: [0.04, 0.05, 0.13], horizon: [0.1, 0.1, 0.22] }, // midnight
  { hour: 5, top: [0.1, 0.1, 0.25], horizon: [0.4, 0.28, 0.38] }, // pre-dawn
  { hour: 7, top: [0.35, 0.45, 0.72], horizon: [0.98, 0.78, 0.62] }, // sunrise
  { hour: 12, top: [0.18, 0.52, 0.92], horizon: [0.78, 0.9, 1.0] }, // midday
  { hour: 17, top: [0.2, 0.45, 0.8], horizon: [0.95, 0.82, 0.7] }, // late afternoon
  { hour: 18.5, top: [0.12, 0.43, 0.82], horizon: [0.75, 0.88, 1.0] }, // dusk (reference)
  { hour: 20, top: [0.1, 0.16, 0.42], horizon: [0.62, 0.4, 0.52] }, // twilight
  { hour: 22, top: [0.05, 0.07, 0.2], horizon: [0.16, 0.14, 0.3] }, // night
];

/** Linear interpolate two RGB triplets. */
function lerpRGB(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** RGB triplet (0–1) → '#rrggbb'. */
function toHex([r, g, b]) {
  const c = (v) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Sky gradient colors for a given time of day.
 * @param {number} timeOfDay Hours, 0–24 (wraps).
 * @returns {{ topColor: string, horizonColor: string }}
 */
export function skyColorsForTime(timeOfDay) {
  let h = timeOfDay % 24;
  if (h < 0) h += 24;

  // Default to the wrap pair (last stop → first stop); the loop below replaces
  // it when h falls inside a normal pair.
  let lo = STOPS[STOPS.length - 1];
  let hi = STOPS[0];
  let span = 24 - lo.hour + hi.hour;
  let local = (h >= lo.hour ? h - lo.hour : h + (24 - lo.hour)) / span;

  for (let i = 0; i < STOPS.length - 1; i++) {
    if (h >= STOPS[i].hour && h < STOPS[i + 1].hour) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      span = hi.hour - lo.hour;
      local = (h - lo.hour) / span;
      break;
    }
  }

  return {
    topColor: toHex(lerpRGB(lo.top, hi.top, local)),
    horizonColor: toHex(lerpRGB(lo.horizon, hi.horizon, local)),
  };
}
