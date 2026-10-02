# Working in this repository

These instructions apply to `motion-for-agents` only. They do not authorize changes to a consuming app, global agent configuration, repository visibility, or publication.

This is an early, private React library and local playground. The package is `@motion-for-agents/react`; keep `private: true` and `UNLICENSED` until the user requests a publication or license change.

## Contracts

- Keep public types, exports, `motion.catalog.json`, plan schema, README, API guide, and bundled skill consistent when changing the API.
- The three presets are `quiet`, `spring`, and `celebration`. Recipe intents are `reveal`, `navigate`, `feedback`, and `press`. Plans also accept `progress` and `celebrate` for their dedicated components.
- The v0.1 plan format deliberately has no custom duration field. A plan describes work; it does not grant permission to perform it.
- Keep the library unstyled. Consumer CSS controls layout, color, typography, and decoration; the playground can supply its own visual design.
- Do not add an animation framework or replace the Motion dependency without a concrete need.

## Motion behavior

Favor useful feedback and clear transitions. Keep essential content available without animation. Respect system reduced-motion preferences and the provider's `always` override.

Keep stateful editors, input focus, and scroll stable. Animate a wrapper or adjacent feedback rather than remounting an editor to replay a transition. `MotionSwitch` is for content that may safely remount when its transition key changes.

Celebration must stay bounded and run once per increasing numeric trigger. Do not start particles during initial render or create background loops. Progress values use a 0–100 range and must handle out-of-range and non-finite input.

## Verification

Use Node.js 22.12 or newer. Run `npm run check` for code changes. Run `npm run test:e2e` when playground behavior or browser interactions change; install Chromium with `npx playwright install chromium` if needed.

For catalog, plan, or agent documentation changes, run `npm run agent:check`. Validate any additional plan with `npm run plan:validate -- path/to/plan.json`.

Review keyboard operation, reduced motion, preserved state, and access to essential content. Prefer behavior checks to tests that merely reproduce implementation details. Report what was verified and any remaining practical limitation.
