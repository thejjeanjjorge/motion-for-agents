# Agent workflow

Use motion to clarify what changed, where content went, or whether an action completed. Preserve the user's requested scope and the app's existing visual language.

## Inspect the consuming app

Read its applicable instructions, package manifest, and relevant UI code. Identify existing animation tools, stateful children, focus behavior, and reduced-motion handling. Confirm the React version and package installation approach before choosing this kit.

Choose the smallest stable boundary for each interaction. A lesson summary can switch; the SQL editor should usually stay mounted. Animate new feedback beside an editor rather than animating the editor on every query or keystroke.

## Choose intent and preset

Use `reveal` for newly available content, `navigate` for view changes, `feedback` for action results, and `press` for button interaction. Use the dedicated `progress` and `celebrate` components for those cases.

Start with `quiet` for frequent actions. Use `spring` when responsive movement helps the interaction and `celebration` for occasional milestones. Keep a consistent provider default and use per-component overrides selectively.

If the user requests comparison or a preview before edits, use the local playground or a contained demonstration first. A preview request does not authorize changes to the target app. Once implementation is authorized, implement the smallest coherent change and preserve existing styling.

## Write and validate a plan when useful

A plan is helpful for multiple boundaries or coordination between agents. It is optional for a simple, authorized change.

The v0.1 format is:

```json
{
  "version": 1,
  "preset": "quiet",
  "reducedMotion": "user",
  "transitions": [
    {
      "id": "lesson-navigation",
      "intent": "navigate",
      "target": "LessonSummary",
      "trigger": "Selected lesson id changes",
      "component": "MotionSwitch"
    }
  ],
  "notes": ["Keep the query editor mounted outside the switched boundary."]
}
```

Allowed presets are `quiet`, `spring`, and `celebration`. Reduced-motion policies are `user` and `always`. Transition intents are `reveal`, `navigate`, `feedback`, `press`, `progress`, and `celebrate`. IDs, targets, triggers, and component names are explicit strings; `notes` is optional. Do not add custom durations to this format.

Targets describe the intended boundary; the validator does not resolve them against source code. Write triggers as concrete state changes or user actions, not vague phrases such as "make it beautiful."

```sh
npm run plan:validate -- path/to/plan.json
```

Plans never grant permission to edit a different app, install packages globally, change licensing, publish a package, or deploy a site. Follow the user's existing authorization for those actions.

## Implement and verify

Use `MotionProvider` at a stable boundary and prefer a provided component over new timing code. Use `getMotionRecipe` with the resolved settings for a custom semantic wrapper. Keep component names, intent names, and the installed API consistent.

Verify the change under keyboard interaction and reduced motion. Confirm that essential content is immediately accessible, query output is not held back by animation, and switching content does not lose editor state or focus. Verify disabled buttons, progress bounds, and one-shot celebration when they are involved.

Run the consuming app's relevant checks and review the actual interaction. For changes in this library, run `npm run check`; run `npm run test:e2e` for browser behavior changes and `npm run agent:check` for catalog or committed plan changes. Validation of a JSON plan is structural, not a substitute for interaction review.

Report the boundaries changed, the intended visual effect, the checks completed, and any remaining limitation. Keep installation and publication claims accurate: this is an early source repository for an unpublished React package with a local playground. The package manifest's `private: true` blocks npm publication independently of GitHub repository visibility.
