---
name: motion-for-agents
description: Add or review purposeful motion in React apps using the Motion for Agents presets, recipes, and unstyled components. Use for transition planning, preview comparisons, or implementation with this kit; preserve the app's existing design and stateful UI.
---

# Motion for Agents

Use this kit to give an existing React interface consistent action feedback and transitions. Read [references/api.md](references/api.md) when selecting components or producing a plan. This bundled skill is portable; it does not depend on a global installation or hosted service.

## Choose the boundary

Read the target project's instructions, package manifest, and relevant components. Confirm that the kit fits the installed React version and existing motion tools. Keep stateful editors, persistent forms, focus, and scroll stable; do not key a switched editor subtree to replay an animation.

Map a concrete action or state change to an intent: `reveal`, `navigate`, `feedback`, or `press`. Use `progress` and `celebrate` only with their dedicated components. Choose `quiet` for frequent interactions, `spring` for more expressive movement, and `celebration` for occasional milestones. Treat these as defaults, not a mandate to animate every element.

If the user requests a preview or comparison before app changes, demonstrate the proposed motion in a contained preview first. Continue with app edits only within the user's authorized scope. A motion plan describes work and never grants permission.

## Implement the smallest coherent change

Use a stable `MotionProvider` and preserve the app's CSS. Prefer provided components; use `getMotionRecipe` for a custom semantic wrapper. Apply supported component presets only when the interaction benefits from an exception.

Follow system reduced motion with `reducedMotion="user"`, or use `always` when requested. Pass resolved settings to custom recipes. Keep essential information and next actions available without movement. Preserve immediate query output and responsive typing.

Celebration is a bounded one-shot accent: increment its numeric trigger for the relevant milestone. Do not trigger on mount or repeat it with a timer.

## Plan and verify

For multiple boundaries, a JSON plan can record preset, reduced-motion policy, target, concrete trigger, intent, and component. The v0.1 schema has no custom duration field. In the source repository, validate a plan with `npm run plan:validate -- path/to/plan.json`. `npm run agent:check` validates the catalog and committed example plans.

Check keyboard operation, reduced motion, state preservation, disabled controls, and essential content. Confirm that `MotionSwitch` does not remount an editor or discard important input. Run relevant app checks and review the interaction; plan validation alone proves only structure and vocabulary.

When editing this library, keep public exports, catalog, schema, docs, and skill aligned. Run `npm run check`; add `npm run test:e2e` for changed browser behavior. Report what changed and what was verified. Keep current limits explicit: React first, local playground, early source repository, unpublished npm package, and `UNLICENSED` pending license selection. The manifest's `private: true` blocks npm publication and does not determine GitHub repository visibility.
