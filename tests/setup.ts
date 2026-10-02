import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// jsdom has no media-query implementation. Component tests replace this with a
// subscribable MediaQueryList while retaining Motion's real DOM/presence code.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
