# Portable API reference

Package: `@motion-for-agents/react`. Supports React `^18.2.0 || ^19.0.0`; Motion is also a peer dependency. Repository testing uses React 19.3 and Motion 13.5.1. Install from a built local tarball or a Git URL; authentication is needed if the source repository is private. No npm release or hosted API is provided. The package manifest's `private: true` blocks npm publication independently of GitHub repository visibility.

## Settings

- `MotionPreset`: `quiet | spring | celebration`.
- `MotionIntent`: `reveal | navigate | feedback | press`.
- `MotionProvider`: `children`, optional `preset` (default `quiet`), optional `reducedMotion: 'user' | 'always'` (default `user`).
- `useMotionSettings()`: returns `preset` and resolved `reducedMotion: boolean`.
- `getMotionRecipe(intent, preset?, reducedMotion?)`: returns `initial`, `animate`, `exit`, and `transition`. Use resolved settings for custom components.
- `PRESETS`: record with `id`, `label`, `description`, `duration` in seconds, `feedbackDuration`, `distance` in pixels, `pressScale`, and optional `spring`.
- `MOTION_INTENTS`: record with `id`, `label`, `description`, and `usage`.

Built-in primitives track OS preference and provider policy changes while mounted, including enabling full motion again, without remounting their stateful children. A `MotionSwitch` key change still replaces its switched content; the outgoing content is inert while it exits.

## Components

All are unstyled. Add appearance through the consuming app's CSS. Recipe components and `MotionProgress` accept an optional `preset` override; `MotionCelebration` has its own bounded treatment.

| Component | Required / notable props | Use |
| --- | --- | --- |
| `MotionReveal` | children and supported div props | Entering content |
| `MotionButton` | supported button props; default `type="button"` | Pointer/Enter press animation; Space retains native activation |
| `MotionSwitch` | `transitionKey: string \| number`, children, supported div props | Changing view content; keyed subtree can remount; outgoing content is inert during its exit |
| `MotionFeedback` | optional `kind: success \| error \| info` (default `info`), children, supported div props | Error defaults to an alert; success/info to a status |
| `MotionProgress` | `value: number` (0–100), `label: string`; optional `className`, `trackClassName`, `fillClassName` | Progress with app-supplied visible styling |
| `MotionCelebration` | `trigger: number`; optional `previousTrigger: number`, children, and `className` | Bounded particles only on a finite trigger increase while mounted, or on mount when `trigger` exceeds `previousTrigger` |

Use standard supported props rather than assuming every raw Motion prop is part of the component API. Read the installed package's types for integration-specific details. Keep a persistent editor outside `MotionSwitch` and preserve textual status independent of animation.

Reduced motion retains short opacity fades for content while removing spatial recipes and springs. Button press feedback is static, progress changes immediately, and particles are suppressed. Progress uses 0 for `NaN` and clamps positive/negative infinity to 100/0.

`getMotionRecipe` changes targets but does not manage all underlying Motion policy. Motion 13.5.1 captures its built-in reduced-transform policy at mount, so a custom wrapper cannot assume changing recipes alone restores full motion. Prefer built-in primitives for live support, or explicitly own the custom wrapper's Motion policy and every reduced-motion target. Preserve important state rather than remounting it to refresh policy.

## Plan contract

```json
{
  "version": 1,
  "preset": "quiet",
  "reducedMotion": "user",
  "transitions": [
    {
      "id": "lesson-summary",
      "intent": "navigate",
      "target": "LessonSummary",
      "trigger": "Selected lesson id changes",
      "component": "MotionSwitch"
    }
  ],
  "notes": ["Keep the editor mounted outside this boundary."]
}
```

Allowed plan intents: `reveal`, `navigate`, `feedback`, `press`, `progress`, and `celebrate`. Use the matching component names above. `progress` and `celebrate` are plan intents, not `getMotionRecipe` inputs. `notes` is optional. A transition may add `preset` to override the plan preset, except for `celebrate`. Custom duration fields are unsupported in v0.1.

From an app that installed the package: `npx --no motion-for-agents-validate path/to/plan.json`. From the source repository: `npm run plan:validate -- path/to/plan.json`. Targets are descriptive strings; validation does not resolve the app's source, prove accessibility, or grant permission to edit or publish anything.
