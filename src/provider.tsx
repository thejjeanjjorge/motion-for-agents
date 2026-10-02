"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import type { MotionPreset, MotionReducedMotion } from "./recipes";

export interface MotionSettings {
  preset: MotionPreset;
  reducedMotion: boolean;
}

export interface MotionProviderProps {
  preset?: MotionPreset;
  reducedMotion?: MotionReducedMotion;
  children: ReactNode;
}

const SettingsContext = createContext<MotionSettings | null>(null);

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function getSystemPreference(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(reducedMotionQuery).matches
    : false;
}

function subscribeSystemPreference(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(reducedMotionQuery);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  // Older Safari exposes the legacy MediaQueryList subscription methods.
  media.addListener(onChange);
  return () => media.removeListener(onChange);
}

function getServerPreference(): boolean {
  return false;
}

function useSystemPreference(): boolean {
  // Motion's current useReducedMotion implementation reads only its initial
  // value. Own the subscription so a mounted app responds to OS changes too.
  return useSyncExternalStore(subscribeSystemPreference, getSystemPreference, getServerPreference);
}

/** One provider gives built-in and custom Motion components the same policy. */
export function MotionProvider({
  preset = "quiet",
  reducedMotion = "user",
  children,
}: MotionProviderProps) {
  const systemPreference = useSystemPreference();
  const settings = useMemo(
    () => ({ preset, reducedMotion: reducedMotion === "always" || Boolean(systemPreference) }),
    [preset, reducedMotion, systemPreference],
  );

  return (
    <SettingsContext.Provider value={settings}>
      <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>{children}</MotionConfig>
    </SettingsContext.Provider>
  );
}

/** Outside a provider, defaults to Quiet and still respects device preferences. */
export function useMotionSettings(): MotionSettings {
  const settings = useContext(SettingsContext);
  const systemPreference = useSystemPreference();
  return settings ?? { preset: "quiet", reducedMotion: Boolean(systemPreference) };
}
