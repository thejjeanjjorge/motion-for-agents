"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion, useIsPresent, type HTMLMotionProps } from "motion/react";
import { getMotionRecipe, PRESETS, type MotionIntent, type MotionPreset } from "./recipes";
import { useMotionSettings } from "./provider";

type OwnedAnimationProps = "initial" | "animate" | "exit" | "transition" | "variants";
type PresetOverride = { preset?: MotionPreset };

const noTransform = () => "none";

// Layout effects run before the browser handles the next input event; servers have no DOM to update.
const useBeforeNextInput = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Motion caches its transform policy at mount. Keep owned elements under a
 * stable policy and implement reduced motion ourselves so it can change live. */
function OwnMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}

/** Restore the provider policy for arbitrary consumer motion inside a wrapper. */
function ContentMotionPolicy({ children }: { children: ReactNode }) {
  const settings = useMotionSettings();
  return <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>{children}</MotionConfig>;
}

function componentRecipe(intent: MotionIntent, preset: MotionPreset, reducedMotion: boolean) {
  const recipe = getMotionRecipe(intent, preset, reducedMotion);
  if (!reducedMotion) return recipe;
  const neutral = { x: 0, y: 0, scale: 1 };
  return {
    ...recipe,
    initial: { ...recipe.initial, ...neutral },
    animate: { ...recipe.animate, ...neutral },
    exit: { ...recipe.exit, ...neutral },
    transition: {
      ...recipe.transition,
      x: { duration: 0 }, y: { duration: 0 }, scale: { duration: 0 },
    },
  };
}

export type MotionRevealProps = Omit<HTMLMotionProps<"div">, OwnedAnimationProps | "children"> &
  PresetOverride & { children?: ReactNode };
export type MotionButtonProps = Omit<
  HTMLMotionProps<"button">,
  OwnedAnimationProps | "whileTap" | "children"
> & PresetOverride & { children?: ReactNode };
export type MotionSwitchProps = Omit<
  HTMLMotionProps<"div">,
  OwnedAnimationProps | "children"
> & PresetOverride & {
  transitionKey: string | number;
  children: ReactNode;
};
export type MotionFeedbackProps = MotionRevealProps & {
  kind?: "success" | "error" | "info";
};

export const MotionReveal = forwardRef<HTMLDivElement, MotionRevealProps>(
  function MotionReveal({ preset, children, transformTemplate, ...props }, ref) {
    const settings = useMotionSettings();
    const recipe = componentRecipe("reveal", preset ?? settings.preset, settings.reducedMotion);
    return (
      <OwnMotion>
        <motion.div {...props} {...recipe} ref={ref} transformTemplate={settings.reducedMotion ? noTransform : transformTemplate}>
          <ContentMotionPolicy>{children}</ContentMotionPolicy>
        </motion.div>
      </OwnMotion>
    );
  },
);

/** Native button semantics, keyboard behavior, attributes, and ref are retained. */
export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  function MotionButton({ preset, type = "button", disabled, children, transformTemplate, ...props }, ref) {
    const settings = useMotionSettings();
    const recipe = componentRecipe("press", preset ?? settings.preset, settings.reducedMotion);
    return (
      <OwnMotion><motion.button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled}
        animate={settings.reducedMotion ? { scale: 1 } : undefined}
        whileTap={disabled ? undefined : recipe.animate}
        transition={recipe.transition}
        transformTemplate={settings.reducedMotion ? noTransform : transformTemplate}
      >
        <ContentMotionPolicy>{children}</ContentMotionPolicy>
      </motion.button></OwnMotion>
    );
  },
);

function SwitchContent({ preset, children }: { preset?: MotionPreset; children: ReactNode }) {
  // AnimatePresence retains this component while exiting. Context still updates
  // it if reduced motion changes during an exit, without remounting its content.
  const settings = useMotionSettings();
  const recipe = componentRecipe("navigate", preset ?? settings.preset, settings.reducedMotion);
  const isPresent = useIsPresent();
  const lastPresentRecipe = useRef(recipe);
  if (isPresent) lastPresentRecipe.current = recipe;
  // Replacing animate/exit targets during an exit can cancel Motion's presence
  // completion. Keep that recipe stable while suppressing its transform live.
  const activeRecipe = isPresent ? recipe : lastPresentRecipe.current;
  const element = useRef<HTMLDivElement>(null);
  // Outgoing content stays visible while it exits. Making it inert stops a quick
  // second click or key press from repeating the action that replaced it. The
  // attribute is set directly because React 18 and 19 serialize `inert` differently.
  useBeforeNextInput(() => {
    element.current?.toggleAttribute("inert", !isPresent);
  }, [isPresent]);
  return (
    <OwnMotion><motion.div {...activeRecipe} ref={element} transformTemplate={settings.reducedMotion ? noTransform : undefined}>
      <ContentMotionPolicy>{children}</ContentMotionPolicy>
    </motion.div></OwnMotion>
  );
}

/** Keep the shell stable; only replace its content when transitionKey changes. */
export const MotionSwitch = forwardRef<HTMLDivElement, MotionSwitchProps>(
  function MotionSwitch({ transitionKey, preset, children, ...props }, ref) {
    return (
      <motion.div {...props} ref={ref}>
        <AnimatePresence mode="wait" initial={false}>
          <SwitchContent key={transitionKey} preset={preset}>{children}</SwitchContent>
        </AnimatePresence>
      </motion.div>
    );
  },
);

/** Errors are alerts; success and informational feedback are polite statuses. */
export const MotionFeedback = forwardRef<HTMLDivElement, MotionFeedbackProps>(
  function MotionFeedback({ preset, kind = "info", role, children, transformTemplate, ...props }, ref) {
    const settings = useMotionSettings();
    const recipe = componentRecipe("feedback", preset ?? settings.preset, settings.reducedMotion);
    return (
      <OwnMotion><motion.div
        {...props}
        {...recipe}
        ref={ref}
        role={role ?? (kind === "error" ? "alert" : "status")}
        transformTemplate={settings.reducedMotion ? noTransform : transformTemplate}
      >
        <ContentMotionPolicy>{children}</ContentMotionPolicy>
      </motion.div></OwnMotion>
    );
  },
);

export interface MotionProgressProps {
  value: number;
  label: string;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  preset?: MotionPreset;
}

/** NaN means no known progress; infinities clamp to their nearest endpoint. */
export function clampProgress(value: number): number {
  return Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
}

export function MotionProgress({
  value,
  label,
  className,
  trackClassName,
  fillClassName,
  preset,
}: MotionProgressProps) {
  const settings = useMotionSettings();
  const selectedPreset = preset ?? settings.preset;
  const progress = clampProgress(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className={className}
    >
      <div className={trackClassName} style={{ overflow: "hidden" }}>
        <OwnMotion><motion.div
          className={fillClassName}
          aria-hidden="true"
          initial={false}
          animate={{ scaleX: progress / 100 }}
          transition={settings.reducedMotion
            ? { duration: 0 }
            : { type: "tween", duration: PRESETS[selectedPreset].duration, ease: "easeOut" }}
          style={{ transformOrigin: "left center", width: "100%" }}
        /></OwnMotion>
      </div>
    </div>
  );
}

export interface MotionCelebrationProps {
  /** Increment for a new achievement. */
  trigger: number;
  /**
   * The trigger's value before this component mounted. Defaults to `trigger`, so
   * mounting never fires a burst. Pass the earlier value when this view mounts
   * because of the milestone, such as a results screen, to burst once on mount.
   */
  previousTrigger?: number;
  children?: ReactNode;
  className?: string;
}

const particleCount = 12;
const burstDuration = 0.7;
const burstLifetime = 1000;

const particleBase: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: 6,
  height: 6,
  borderRadius: 2,
  backgroundColor: "currentColor",
};

function increased(trigger: number, previous: number): boolean {
  return Number.isFinite(trigger) && Number.isFinite(previous) && trigger > previous;
}

/**
 * One finite, decorative burst per increasing trigger. Children carry meaning;
 * particles are never exposed to assistive technology. Device reduced motion
 * suppresses the burst completely, including one already in progress.
 */
export function MotionCelebration({ trigger, previousTrigger, children, className }: MotionCelebrationProps) {
  const { reducedMotion } = useMotionSettings();
  const lastTrigger = useRef(trigger);
  const burstSequence = useRef(0);
  // A burst owed at mount starts in initial state, so Strict Mode's repeated
  // mount effects cannot cancel it.
  const [burst, setBurst] = useState<number | null>(() =>
    !reducedMotion && increased(trigger, previousTrigger ?? trigger) ? 0 : null);

  useEffect(() => {
    const previous = lastTrigger.current;
    lastTrigger.current = trigger;
    if (reducedMotion || !Number.isFinite(trigger) || trigger < previous) setBurst(null);
    else if (increased(trigger, previous)) setBurst(++burstSequence.current);
  }, [trigger, reducedMotion]);

  useEffect(() => {
    if (burst === null) return;
    const timer = setTimeout(() => setBurst(null), burstLifetime);
    return () => clearTimeout(timer);
  }, [burst]);

  return (
    <div className={className} style={{ position: "relative" }}>
      {children}
      {burst !== null && !reducedMotion && (
        <span
          key={burst}
          aria-hidden="true"
          data-motion-celebration="burst"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <OwnMotion>{Array.from({ length: particleCount }, (_, index) => {
            const angle = (index / particleCount) * Math.PI * 2;
            const radius = 28 + (index % 3) * 8;
            return (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: -3, y: -3, scale: 0.5, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos(angle) * radius - 3,
                  y: Math.sin(angle) * radius - 3,
                  scale: [0.5, 1, 0.5],
                  rotate: index % 2 === 0 ? 90 : -90,
                }}
                transition={{
                  type: "tween",
                  duration: burstDuration,
                  delay: (index % 3) * 0.04,
                  ease: "easeOut",
                }}
                style={particleBase}
              />
            );
          })}</OwnMotion>
        </span>
      )}
    </div>
  );
}
