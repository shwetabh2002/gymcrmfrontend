// @/config/motion — shared framer-motion timing.
// Every modal/page transition pulls from here so the app animates as one system
// instead of eight slightly different copies of the same cubic-bezier.

import type { Transition } from "framer-motion";

/** Decelerating ease used across modals, cards and page entrances. */
export const EASE_OUT_EXPO: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

/** Durations in seconds (framer-motion's unit). */
export const MOTION_DURATION = {
  fast: 0.25,
  base: 0.3,
  slow: 0.4,
  page: 0.45,
} as const;

/** Per-item delay when animating a list in sequence. */
export const STAGGER_STEP = 0.06;

export const MODAL_TRANSITION: Transition = {
  duration: MOTION_DURATION.fast,
  ease: EASE_OUT_EXPO,
};

export const PANEL_TRANSITION: Transition = {
  duration: MOTION_DURATION.base,
  ease: EASE_OUT_EXPO,
};

export const PAGE_TRANSITION: Transition = {
  duration: MOTION_DURATION.slow,
  ease: EASE_OUT_EXPO,
};

/** Transition for the nth item of a staggered list. */
export function staggered(index: number, duration = MOTION_DURATION.page) {
  return {
    duration,
    delay: index * STAGGER_STEP,
    ease: EASE_OUT_EXPO,
  } satisfies Transition;
}
