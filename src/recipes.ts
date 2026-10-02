import type { TargetAndTransition, Transition } from "motion/react";

/** Presets describe the character of motion, independent of an app's skin. */
export type MotionPreset = "quiet" | "spring" | "celebration";
export type MotionIntent = "reveal" | "navigate" | "feedback" | "press";
export type MotionReducedMotion = "user" | "always";

export interface MotionPresetDefinition {
  id: MotionPreset;
  label: string;
  description: string;
  /** Tween duration, in seconds. Springs settle according to their physics. */
  duration: number;
  feedbackDuration: number;
  /** Maximum entrance displacement, in CSS pixels. */
  distance: number;
  pressScale: number;
  spring?: { stiffness: number; damping: number; mass: number };
}

export interface MotionIntentDefinition {
  id: MotionIntent;
  label: string;
  description: string;
  usage: string;
}

export interface MotionRecipe {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
}

export const PRESETS: Readonly<Record<MotionPreset, MotionPresetDefinition>> = {
  quiet: {
    id: "quiet",
    label: "Quiet",
    description: "Short fades and small movements that keep attention on the task.",
    duration: 0.18,
    feedbackDuration: 0.2,
    distance: 6,
    pressScale: 0.98,
  },
  spring: {
    id: "spring",
    label: "Spring",
    description: "A responsive, gently springing feel for direct interaction.",
    duration: 0.28,
    feedbackDuration: 0.32,
    distance: 10,
    pressScale: 0.96,
    spring: { stiffness: 420, damping: 32, mass: 0.8 },
  },
  celebration: {
    id: "celebration",
    label: "Celebration",
    description: "A little more lift for milestones and rewarding feedback.",
    duration: 0.36,
    feedbackDuration: 0.4,
    distance: 14,
    pressScale: 0.95,
    spring: { stiffness: 340, damping: 24, mass: 0.8 },
  },
};

export const MOTION_INTENTS: Readonly<Record<MotionIntent, MotionIntentDefinition>> = {
  reveal: {
    id: "reveal",
    label: "Reveal",
    description: "Introduce content with a small lift and a fade.",
    usage: "Cards, result panels, and newly added content.",
  },
  navigate: {
    id: "navigate",
    label: "Navigate",
    description: "Keep context while one view replaces another.",
    usage: "Steps, questions, tabs, and local view changes.",
  },
  feedback: {
    id: "feedback",
    label: "Feedback",
    description: "Bring attention to a result without interrupting the task.",
    usage: "Success messages, validation errors, and status updates.",
  },
  press: {
    id: "press",
    label: "Press",
    description: "A small compression that confirms a button press.",
    usage: "Use the animate target as whileTap on an interactive element.",
  },
};

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Pure animation targets for custom components. Reduced motion removes every
 * spatial target and spring, retaining only a short fade (and a static press).
 */
export function getMotionRecipe(
  intent: MotionIntent,
  preset: MotionPreset = "quiet",
  reducedMotion = false,
): MotionRecipe {
  const settings = PRESETS[preset];

  if (reducedMotion) {
    const staticPress = intent === "press";
    return {
      initial: { opacity: staticPress ? 1 : 0 },
      animate: { opacity: 1 },
      exit: { opacity: staticPress ? 1 : 0 },
      transition: { type: "tween", duration: staticPress ? 0 : 0.12, ease: "linear" },
    };
  }

  const transition: Transition = settings.spring
    ? { type: "spring", ...settings.spring }
    : { type: "tween", duration: settings.duration, ease: [...easeOut] };

  switch (intent) {
    case "press":
      return {
        initial: { scale: 1 },
        animate: { scale: settings.pressScale },
        exit: { scale: 1 },
        transition,
      };
    case "navigate":
      return {
        initial: { opacity: 0, x: settings.distance },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -settings.distance },
        transition,
      };
    case "feedback":
      return {
        initial: { opacity: 0, y: settings.distance / 2, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 0.98 },
        transition: settings.spring
          ? transition
          : { ...transition, duration: settings.feedbackDuration },
      };
    case "reveal":
      return {
        initial: { opacity: 0, y: settings.distance },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
        transition,
      };
  }
}
