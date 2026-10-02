import { createRef, StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MotionButton,
  MotionCelebration,
  MotionFeedback,
  MotionProgress,
  MotionProvider,
  MotionReveal,
  MotionSwitch,
  useMotionSettings,
} from "../src";

// Retain Motion's real DOM/presence behavior and exercise actual media changes.
let preference: MediaQueryList;
let preferenceListeners: Set<() => void>;

function changeDevicePreference(reduced: boolean) {
  Object.defineProperty(preference, "matches", { configurable: true, value: reduced });
  act(() => preferenceListeners.forEach((listener) => listener()));
}

beforeEach(() => {
  preferenceListeners = new Set();
  preference = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: (listener: () => void) => preferenceListeners.add(listener),
    removeListener: (listener: () => void) => preferenceListeners.delete(listener),
    addEventListener: (_event: string, listener: () => void) => preferenceListeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => preferenceListeners.delete(listener),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(preference);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function SettingsProbe() {
  const settings = useMotionSettings();
  return <output>{settings.preset}:{String(settings.reducedMotion)}</output>;
}

describe("settings and accessibility", () => {
  it("defaults to quiet and follows the device preference without a provider", () => {
    render(<SettingsProbe />);
    expect(screen.getByText("quiet:false")).toBeTruthy();
    changeDevicePreference(true);
    expect(screen.getByText("quiet:true")).toBeTruthy();
  });

  it("applies the provider preset and always-reduced policy", () => {
    render(<MotionProvider preset="celebration" reducedMotion="always"><SettingsProbe /></MotionProvider>);
    expect(screen.getByText("celebration:true")).toBeTruthy();
  });

  it("respects a user preference inside a provider", () => {
    changeDevicePreference(true);
    render(<MotionProvider preset="spring"><SettingsProbe /></MotionProvider>);
    expect(screen.getByText("spring:true")).toBeTruthy();
  });

  it("updates a mounted provider when the OS setting changes, without a parent rerender", () => {
    const view = render(<MotionProvider preset="spring"><SettingsProbe /></MotionProvider>);
    expect(screen.getByText("spring:false")).toBeTruthy();
    changeDevicePreference(true);
    expect(screen.getByText("spring:true")).toBeTruthy();
    changeDevicePreference(false);
    expect(screen.getByText("spring:false")).toBeTruthy();
    view.unmount();
    expect(preferenceListeners.size).toBe(0);
  });

  it("uses the legacy MediaQueryList subscription API when needed", () => {
    Object.defineProperty(preference, "addEventListener", { value: undefined });
    Object.defineProperty(preference, "removeEventListener", { value: undefined });
    const view = render(<MotionProvider><SettingsProbe /></MotionProvider>);
    changeDevicePreference(true);
    expect(screen.getByText("quiet:true")).toBeTruthy();
    view.unmount();
    expect(preferenceListeners.size).toBe(0);
  });

  it("uses opacity without a spatial entrance under reduced motion", () => {
    render(<MotionProvider reducedMotion="always"><MotionReveal data-testid="reveal">Content</MotionReveal></MotionProvider>);
    const reveal = screen.getByTestId("reveal");
    expect(["", "none"]).toContain(reveal.style.transform);
    expect(reveal.textContent).toBe("Content");
  });

  it("removes an in-flight entrance transform without remounting meaningful children", async () => {
    render(<MotionProvider><MotionReveal data-testid="live-reveal"><input aria-label="SQL" defaultValue="SELECT 1" /></MotionReveal></MotionProvider>);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "SELECT 2" } });
    changeDevicePreference(true);
    await waitFor(() => expect(screen.getByTestId("live-reveal").style.transform).toBe("none"));
    expect(screen.getByRole("textbox")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("SELECT 2");
  });
});

describe("native elements and feedback", () => {
  it("forwards button attributes, ref, and click behavior with a safe default type", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(<MotionButton ref={ref} name="answer" aria-label="Run SQL" onClick={onClick}>Run</MotionButton>);
    const button = screen.getByRole("button", { name: "Run SQL" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("name")).toBe("answer");
    expect(ref.current).toBe(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("retains explicit submit and disabled behavior", () => {
    const onClick = vi.fn();
    render(<MotionButton type="submit" disabled onClick={onClick}>Save</MotionButton>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("assigns errors an alert and other feedback a status", () => {
    const { rerender } = render(<MotionFeedback kind="success">Saved</MotionFeedback>);
    expect(screen.getByRole("status").textContent).toBe("Saved");
    rerender(<MotionFeedback kind="error">Try again</MotionFeedback>);
    expect(screen.getByRole("alert").textContent).toBe("Try again");
    rerender(<MotionFeedback kind="info" aria-live="polite">Loading</MotionFeedback>);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });

  it("retains reveal attributes and forwarded ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<MotionReveal ref={ref} role="region" aria-label="Results" className="panel">Rows</MotionReveal>);
    const panel = screen.getByRole("region", { name: "Results" });
    expect(ref.current).toBe(panel);
    expect(panel.className).toBe("panel");
  });
});

describe("progress", () => {
  it.each([
    [-3, "0"], [33.4, "33.4"], [120, "100"], [Number.NaN, "0"],
  ])("exposes an accessible clamped value for %s", (value, expected) => {
    render(<MotionProgress value={value} label="Course progress" trackClassName="track" fillClassName="fill" />);
    const bar = screen.getByRole("progressbar", { name: "Course progress" });
    expect(bar.getAttribute("aria-valuenow")).toBe(expected);
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.querySelector(".track .fill")).toBeTruthy();
  });

  it("updates the accessible value when progress changes", () => {
    const { rerender } = render(<MotionProvider reducedMotion="always"><MotionProgress value={10} label="Progress" /></MotionProvider>);
    rerender(<MotionProvider reducedMotion="always"><MotionProgress value={90} label="Progress" /></MotionProvider>);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("90");
  });

  it("can resume progress animation after forced reduced motion is turned off", async () => {
    const { container, rerender } = render(<MotionProvider preset="celebration" reducedMotion="always"><MotionProgress value={10} label="Progress" fillClassName="fill" /></MotionProvider>);
    const fill = container.querySelector(".fill") as HTMLElement;
    rerender(<MotionProvider preset="celebration" reducedMotion="user"><MotionProgress value={100} label="Progress" fillClassName="fill" /></MotionProvider>);
    await waitFor(() => {
      const match = /scaleX\(([^)]+)\)/.exec(fill.style.transform);
      const scale = match ? Number(match[1]) : 1;
      expect(scale).toBeGreaterThan(0.1);
      expect(scale).toBeLessThan(1);
    });
    await waitFor(() => expect(fill.style.transform).toBe("none"));
  });
});

describe("keyed navigation", () => {
  it("updates unchanged-key content without remounting its element", () => {
    const { rerender } = render(<MotionSwitch transitionKey="one" data-testid="shell"><input aria-label="Answer" defaultValue="retained" /></MotionSwitch>);
    const input = screen.getByRole("textbox");
    const shell = screen.getByTestId("shell");
    rerender(<MotionSwitch transitionKey="one" data-testid="shell"><input aria-label="Updated answer" defaultValue="new" /></MotionSwitch>);
    expect(screen.getByRole("textbox")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("retained");
    expect(screen.getByTestId("shell")).toBe(shell);
  });

  it("finishes an exit before mounting content with a new key", async () => {
    const { rerender } = render(<MotionProvider reducedMotion="always"><MotionSwitch transitionKey={1}>First question</MotionSwitch></MotionProvider>);
    rerender(<MotionProvider reducedMotion="always"><MotionSwitch transitionKey={2}>Second question</MotionSwitch></MotionProvider>);
    await waitFor(() => expect(screen.queryByText("First question")).toBeNull());
    expect(screen.getByText("Second question")).toBeTruthy();
  });

  it("suppresses a retained exit transform when the OS requests reduced motion", async () => {
    const { rerender } = render(<MotionProvider><MotionSwitch transitionKey={1}>First question</MotionSwitch></MotionProvider>);
    const exiting = screen.getByText("First question");
    rerender(<MotionProvider><MotionSwitch transitionKey={2}>Second question</MotionSwitch></MotionProvider>);
    changeDevicePreference(true);
    await waitFor(() => expect(exiting.style.transform).toBe("none"));
    await waitFor(() => expect(screen.queryByText("First question")).toBeNull());
    expect(screen.getByText("Second question")).toBeTruthy();
  });

  it("makes outgoing content inert so a repeated click cannot reach it", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<MotionSwitch transitionKey={1}><button onClick={onClick}>Finish exam</button></MotionSwitch>);
    const outgoing = screen.getByRole("button", { name: "Finish exam" }).parentElement!;
    expect(outgoing.hasAttribute("inert")).toBe(false);
    rerender(<MotionSwitch transitionKey={2}><p>Exam result</p></MotionSwitch>);
    expect(outgoing.hasAttribute("inert")).toBe(true);
    await waitFor(() => expect(screen.queryByText("Finish exam")).toBeNull());
    expect(screen.getByText("Exam result").parentElement!.hasAttribute("inert")).toBe(false);
  });
});

describe("finite celebration", () => {
  it("does not burst on initial mount, including Strict Mode", () => {
    const { container } = render(<StrictMode><MotionCelebration trigger={3}>Passed</MotionCelebration></StrictMode>);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
    expect(screen.getByText("Passed")).toBeTruthy();
  });

  it("bursts once on mount when the milestone raised the trigger, including Strict Mode", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container, rerender } = render(
      <StrictMode><MotionCelebration trigger={3} previousTrigger={2}>Level passed</MotionCelebration></StrictMode>,
    );
    const burst = container.querySelector("[data-motion-celebration]");
    expect(burst?.children.length).toBe(12);
    rerender(<StrictMode><MotionCelebration trigger={3} previousTrigger={2}>Level passed</MotionCelebration></StrictMode>);
    expect(container.querySelector("[data-motion-celebration]")).toBe(burst);
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["an equal", 3], ["a higher", 4], ["an invalid", Number.NaN],
  ])("does not burst on mount from %s previous trigger", (_label, previousTrigger) => {
    const { container } = render(<MotionCelebration trigger={3} previousTrigger={previousTrigger} />);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
  });

  it("does not burst on mount under reduced motion", () => {
    const { container } = render(
      <MotionProvider reducedMotion="always"><MotionCelebration trigger={1} previousTrigger={0} /></MotionProvider>,
    );
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
  });

  it("fires once per increasing trigger and removes the decorative burst", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container, rerender } = render(<MotionCelebration trigger={0}>Passed</MotionCelebration>);
    rerender(<MotionCelebration trigger={1}>Passed</MotionCelebration>);
    const burst = container.querySelector("[data-motion-celebration]");
    expect(burst?.getAttribute("aria-hidden")).toBe("true");
    expect(burst?.children.length).toBe(12);
    rerender(<MotionCelebration trigger={1}>Still passed</MotionCelebration>);
    expect(container.querySelector("[data-motion-celebration]")).toBe(burst);
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
    rerender(<MotionCelebration trigger={1}>Still passed</MotionCelebration>);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
  });

  it("cancels a running burst when reduced motion is enabled", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container, rerender } = render(<MotionProvider><MotionCelebration trigger={0} /></MotionProvider>);
    rerender(<MotionProvider><MotionCelebration trigger={1} /></MotionProvider>);
    expect(container.querySelector("[data-motion-celebration]")).toBeTruthy();
    rerender(<MotionProvider reducedMotion="always"><MotionCelebration trigger={1} /></MotionProvider>);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never creates particles for reduced motion, and cleans up on unmount", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const reduced = render(<MotionProvider reducedMotion="always"><MotionCelebration trigger={0} /></MotionProvider>);
    reduced.rerender(<MotionProvider reducedMotion="always"><MotionCelebration trigger={1} /></MotionProvider>);
    expect(reduced.container.querySelector("[data-motion-celebration]")).toBeNull();
    reduced.unmount();
    const normal = render(<MotionCelebration trigger={0} />);
    normal.rerender(<MotionCelebration trigger={1} />);
    normal.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels the previous timeout when another achievement arrives", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container, rerender } = render(<MotionCelebration trigger={0} />);
    rerender(<MotionCelebration trigger={1} />);
    const firstBurst = container.querySelector("[data-motion-celebration]");
    act(() => vi.advanceTimersByTime(750));
    rerender(<MotionCelebration trigger={2} />);
    expect(container.querySelector("[data-motion-celebration]")).not.toBe(firstBurst);
    act(() => vi.advanceTimersByTime(500));
    expect(container.querySelector("[data-motion-celebration]")).toBeTruthy();
    act(() => vi.advanceTimersByTime(500));
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
  });

  it("does not burst for a decreasing or invalid trigger", () => {
    const { container, rerender } = render(<MotionCelebration trigger={3} />);
    rerender(<MotionCelebration trigger={2} />);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
    rerender(<MotionCelebration trigger={Number.NaN} />);
    expect(container.querySelector("[data-motion-celebration]")).toBeNull();
  });
});
