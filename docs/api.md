# React API

Import public APIs from `@motion-for-agents/react`. React 18.2 or React 19 and Motion 13 (`^13.5.1`) are peer dependencies; React 19.3 and Motion 13.5.1 are the tested versions in this repository. Components provide motion behavior and semantic HTML, with no theme or Tailwind requirement.

## Presets and intents

`MotionPreset` is `quiet | spring | celebration`.

| Preset | Intended feel | Suggested use |
| --- | --- | --- |
| `quiet` | Restrained transitions | Default for study, reading, and frequent actions |
| `spring` | More responsive movement | Card interactions, switches, and occasional navigation |
| `celebration` | More expressive feedback | Milestones and completion moments |

These are design choices rather than universal rules. Choose one consistent default, then override individual components when the interaction warrants it.

`MotionIntent` is `reveal | navigate | feedback | press`.

| Intent | Boundary |
| --- | --- |
| `reveal` | Content becoming available |
| `navigate` | Switching between distinct content views |
| `feedback` | A result or status caused by an action |
| `press` | Immediate button interaction |

Plans additionally accept `progress` and `celebrate` to describe `MotionProgress` and `MotionCelebration`. Those two values are not accepted by `getMotionRecipe`.

## Provider and settings

```tsx
<MotionProvider preset="quiet" reducedMotion="user">
  <App />
</MotionProvider>
```

`MotionProvider` accepts `children`, optional `preset`, and optional `reducedMotion: 'user' | 'always'`. Defaults are `quiet` and `user`. `user` follows the system preference; `always` requests the reduced-motion experience regardless of system settings.

The built-in primitives respond to OS preference and provider policy changes while mounted, including enabling full motion again. Changing the policy does not require remounting their stateful children. A `MotionSwitch` still replaces its content when its `transitionKey` changes; that is separate from a policy change.

`useMotionSettings()` returns the active `preset` and a `reducedMotion` boolean. This boolean is the resolved preference, not the provider's policy string.

```tsx
import { useMotionSettings } from '@motion-for-agents/react';

function MotionStatus() {
  const { preset, reducedMotion } = useMotionSettings();
  return <p>{preset}: {reducedMotion ? 'reduced motion' : 'full motion'}</p>;
}
```

Use the provider at a stable app boundary. Recipe components and `MotionProgress` can take an optional `preset` override without changing the provider's value for other components. `MotionCelebration` has its own bounded particle treatment rather than a preset override.

Reduced-motion recipes retain a short opacity fade while removing spatial movement and springs. Press feedback is static, progress changes immediately, and celebration particles are suppressed.

## Components

### MotionReveal

An animated `div` for entering content. Accepts children, standard supported div props, and optional `preset`.

```tsx
<MotionReveal className="lesson-heading">
  <h1>Filtering rows</h1>
</MotionReveal>
```

Animate meaningful content boundaries rather than every line of text. Avoid remounting this wrapper merely to replay a reveal.

### MotionButton

A button with press feedback. Accepts standard supported button props, children, and optional `preset`. Its default `type` is `button`; use `type="submit"` explicitly inside a form when appropriate.

```tsx
<MotionButton onClick={runQuery} disabled={isRunning}>
  Run query
</MotionButton>
```

The app still handles the action, disabled state, styling, and accessible button name.

Press animation responds to pointer and Enter-key presses. Space retains native button activation but does not start the press animation. Both keyboard activation and pointer interaction retain native disabled-button behavior.

### MotionSwitch

Switches content when `transitionKey: string | number` changes. Accepts children, standard supported div props, and optional `preset`.

```tsx
<MotionSwitch transitionKey={lesson.id} className="lesson-summary">
  <LessonSummary lesson={lesson} />
</MotionSwitch>
```

Changing the key can remount the switched subtree. Keep a stateful editor or persistent form outside this boundary.

While the old content exits, it is inert: it ignores pointer and keyboard input, cannot take focus, and is hidden from assistive technology. A quick second click therefore cannot repeat the action that replaced it. Use an action-specific key rather than a timestamp or a value that changes on every keystroke.

### MotionFeedback

An animated feedback `div`. Accepts optional `kind: 'success' | 'error' | 'info'` (default `info`), children, standard supported div props, and optional `preset`. Errors default to `role="alert"`; success and informational feedback default to `role="status"`. An explicit `role` overrides that default.

```tsx
<MotionFeedback kind="success" className="query-feedback">
  Correct: the result contains three rows.
</MotionFeedback>
```

Keep the status in text and choose announcement semantics appropriate to the action. Motion and color alone should not convey whether an action succeeded.

### MotionProgress

An animated progress indicator with `value: number` and required `label: string`. The value is a percentage from 0 to 100. It clamps out-of-range values, uses 0 for `NaN`, 100 for positive infinity, and 0 for negative infinity. It also accepts `className`, `trackClassName`, `fillClassName`, and optional `preset`.

```tsx
<MotionProgress
  value={75}
  label="Chapter completion"
  className="progress"
  trackClassName="progress-track"
  fillClassName="progress-fill"
/>
```

Supply visible styling in your app:

```css
.progress-track {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}
```

Include visible numeric or explanatory text nearby when it helps the user interpret progress.

### MotionCelebration

A bounded, one-shot particle accent with `trigger: number`, optional `previousTrigger: number`, optional children, and `className`. It runs when a finite trigger increases from its previous finite value while mounted. It does not run on an ordinary initial render, a decrease, or an invalid number. It has no preset override. Do not update the trigger during rendering or from a repeating timer.

```tsx
import { useState } from 'react';
import { MotionButton, MotionCelebration } from '@motion-for-agents/react';

function CompletionAction() {
  const [celebration, setCelebration] = useState(0);

  return (
    <MotionCelebration trigger={celebration}>
      <MotionButton onClick={() => setCelebration((count) => count + 1)}>
        Celebrate completion
      </MotionButton>
    </MotionCelebration>
  );
}
```

When the milestone itself opens a new view, such as an exam result screen, that view mounts with the trigger already increased. Pass the earlier value as `previousTrigger` to burst once on mount:

```tsx
<MotionCelebration trigger={levelsPassed} previousTrigger={levelsPassedBeforeExam}>
  <h1>Level passed</h1>
</MotionCelebration>
```

Keep `previousTrigger` tied to the milestone event rather than recomputing it on every visit, so returning to the view does not replay the burst.

Keep the actual completion message and next action available independently of the particles.

## Recipe helper and catalogs

```ts
getMotionRecipe(intent, preset?, reducedMotion?)
```

The helper returns `initial`, `animate`, `exit`, and `transition` properties. Defaults use the quiet preset and full motion unless reduced motion is explicitly passed. Use it for a boundary needing custom composition with Motion rather than adding new timing rules throughout the app.

This is a pure recipe helper, not a complete live-policy manager. Motion 13.5.1 captures its built-in reduced-transform policy when an element mounts. Updating recipe targets alone does not fully control that policy, particularly when enabling full motion again. Prefer the built-in primitives for live policy support. A custom wrapper must explicitly own its underlying Motion policy and reduced-motion targets, rather than remounting important state to refresh the policy.

```tsx
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { getMotionRecipe, useMotionSettings } from '@motion-for-agents/react';

function CustomPanel({ children }: { children: ReactNode }) {
  const { preset, reducedMotion } = useMotionSettings();
  const recipe = getMotionRecipe('reveal', preset, reducedMotion);
  return <motion.section {...recipe}>{children}</motion.section>;
}
```

`PRESETS` is a record keyed by preset. Each item contains `id`, `label`, `description`, `duration` in seconds, `feedbackDuration`, `distance` in pixels, `pressScale`, and optional `spring` configuration.

`MOTION_INTENTS` is a record keyed by recipe intent. Each item contains `id`, `label`, `description`, and `usage`. The repository's `motion.catalog.json` supplies the corresponding machine-readable vocabulary for agents and tooling.

## Practical boundaries

Keep editor typing, result access, focus, and scroll responsive. Frequent transitions should be brief and easy to interrupt. Reduced motion must retain essential content and useful action feedback. These components do not manage application routing, data fetching, focus restoration, design tokens, or the correctness of the consuming app's accessibility semantics.
