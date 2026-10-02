# Motion for Agents

A small React motion kit with explicit intents, three presets, and a portable skill for coding agents. Use it to add consistent feedback and transitions to an existing interface without adopting a component theme or CSS framework.

The package is `@motion-for-agents/react`. This is an early source repository: npm publication and hosted services are not provided. The local playground lets you compare **Quiet**, **Spring**, and **Celebration** before applying them to an app.

## Run the playground

Use Node.js 22.12 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The playground is a demonstration; the library's components are unstyled and take their appearance from your app.

## Use the library in a React app

React 18.2 or React 19 and Motion are peer dependencies. The repository is tested with React 19.3 and Motion 13.5.1.

Build a local tarball from this repository:

```sh
npm pack
```

Then, from an existing React app, install the tarball and Motion:

```sh
npm install /absolute/path/to/motion-for-agents/motion-for-agents-react-0.1.0.tgz motion
```

You can also install directly from GitHub:

```sh
npm install git+https://github.com/thejjeanjjorge/motion-for-agents.git motion
```

Git installation runs the package's `prepare` command to build the library from source. Prefer a commit reference, such as `#COMMIT_SHA`, when you need a reproducible installation. Authentication is needed if installing from a private repository.

The package manifest has `private: true`, which prevents accidental npm publication while allowing `npm pack` and local installation. That npm package flag is independent of GitHub repository visibility.

Here is a minimal example:

```tsx
import { useState } from 'react';
import {
  MotionButton,
  MotionFeedback,
  MotionProvider,
  MotionReveal,
  MotionSwitch,
} from '@motion-for-agents/react';

export default function App() {
  const [lesson, setLesson] = useState(1);
  const [finished, setFinished] = useState(false);

  return (
    <MotionProvider preset="quiet" reducedMotion="user">
      <MotionReveal>
        <h1>Learn SQL</h1>
      </MotionReveal>

      <MotionSwitch transitionKey={lesson}>
        <p>Lesson {lesson}: inspect a table, then write a query.</p>
      </MotionSwitch>

      <MotionButton onClick={() => setLesson((value) => value + 1)}>
        Next lesson
      </MotionButton>
      <MotionButton onClick={() => setFinished(true)}>
        Complete lesson
      </MotionButton>

      {finished && (
        <MotionFeedback kind="success">
          Lesson complete. Your progress has been saved.
        </MotionFeedback>
      )}
    </MotionProvider>
  );
}
```

Add your app's usual CSS for typography, buttons, spacing, and colors. No Tailwind setup or global stylesheet is required. Read the [API guide](docs/api.md) for progress, celebration, per-component presets, and recipe helpers.

## Use with an agent

The bundled [motion-for-agents skill](skills/motion-for-agents/SKILL.md) helps an agent choose an intent and boundary, preserve state, and verify reduced motion. It is kept in this repository; no personal skill directory is modified automatically. Its folder can be copied into a compatible agent's skill directory when you choose to install it.

An agent can write a small motion plan using the [example](docs/examples/plan.json), then validate it:

```sh
npm run plan:validate -- docs/examples/plan.json
npm run agent:check
```

The validator checks plan structure and supported vocabulary. It does not inspect the target app, grant permission to edit it, or establish that a transition is accessible. The [agent workflow](docs/agent-workflow.md) covers implementation and review.

## Verify changes

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs type checks, unit tests, builds, and catalog/schema/example contract checks. Browser tests check the local playground. `agent:check` checks the catalog and committed example plans; use `plan:validate` for a plan elsewhere on disk.

## Current scope

- React first, with unstyled animation essentials and a local Vite playground.
- Presets: `quiet`, `spring`, and `celebration`; standard recipes: `reveal`, `navigate`, `feedback`, and `press`.
- Bounded progress and celebration components; celebration starts only when its numeric trigger increases.
- No custom duration fields in the v0.1 plan format, full design system, hosted API, or published npm release.
- License metadata is currently `UNLICENSED`. A distribution license has not been selected.

See [AGENTS.md](AGENTS.md) for repository contribution instructions.
