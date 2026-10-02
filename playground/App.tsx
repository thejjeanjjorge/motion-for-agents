import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  MotionButton,
  MotionCelebration,
  MotionFeedback,
  MotionProgress,
  MotionProvider,
  MotionReveal,
  MotionSwitch,
} from '../src/index'
import type { MotionPreset } from '../src/index'

type IconName = 'arrow' | 'check' | 'close' | 'code' | 'copy' | 'github' | 'info' | 'moon' | 'play' | 'replay' | 'spark' | 'sun' | 'wave'
type FeedbackKind = 'success' | 'error' | 'info'
type PreviewTab = 'lesson' | 'elements'

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    code: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    github: <><path d="M9 19c-4 1-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 3.3-.4 6.5-1.6 6.5-6a4.8 4.8 0 0 0-1.3-3.4 4.5 4.5 0 0 0-.1-3.4s-1.3-.4-3.5 1.3a11.8 11.8 0 0 0-6.3 0C7.3 2.3 6 2.7 6 2.7a4.5 4.5 0 0 0-.1 3.4A4.8 4.8 0 0 0 4.6 9.5c0 4.4 3.2 5.6 6.5 6-.5.5-.6 1.2-.6 2V21" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.01" /></>,
    moon: <path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z" />,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    replay: <><path d="M3 10a9 9 0 1 1 1.5 7M3 4v6h6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
    wave: <path d="M2 12c3.3-12 5.3 12 8.6 0s5.3 12 8.6 0H22" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const presets: { id: MotionPreset; name: string; description: string; icon: IconName }[] = [
  { id: 'quiet', name: 'Quiet', description: 'Soft entrances. Clear transitions.', icon: 'arrow' },
  { id: 'spring', name: 'Spring', description: 'A little weight. A little play.', icon: 'wave' },
  { id: 'celebration', name: 'Celebration', description: 'A small reward for a big moment.', icon: 'spark' },
]

const questions = [
  { title: 'Find products under $50', query: 'SELECT name, price\nFROM products\nWHERE price < 50;', rows: '4 matching products', instruction: 'Return the name and price of every product priced below $50.' },
  { title: 'Find the newest customers', query: 'SELECT name, joined_at\nFROM customers\nORDER BY joined_at DESC\nLIMIT 5;', rows: '5 newest customers', instruction: 'Order customers by their join date and return the five newest.' },
  { title: 'Count orders by status', query: 'SELECT status, COUNT(*)\nFROM orders\nGROUP BY status;', rows: '3 order statuses', instruction: 'Group the orders by status, then count the orders in each group.' },
]

function FeedbackMessage({ kind, title, detail }: { kind: FeedbackKind; title: string; detail?: string }) {
  return (
    <div className={`feedback-message feedback-${kind}`}>
      <span className="feedback-icon"><Icon name={kind === 'success' ? 'check' : kind === 'error' ? 'close' : 'info'} /></span>
      <div><strong>{title}</strong>{detail && <p>{detail}</p>}</div>
    </div>
  )
}

function LessonDemo() {
  const [question, setQuestion] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [feedback, setFeedback] = useState<FeedbackKind | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [celebration, setCelebration] = useState(0)
  const current = questions[question]
  const complete = completed.length === questions.length

  function runQuery() {
    setFeedback('success')
    setAttempt((value) => value + 1)
    if (!completed.includes(question)) {
      const next = [...completed, question]
      setCompleted(next)
      if (next.length === questions.length) setCelebration((value) => value + 1)
    }
  }

  function nextQuestion() {
    if (question === questions.length - 1) {
      setQuestion(0)
      setCompleted([])
    } else {
      setQuestion((value) => value + 1)
    }
    setFeedback(null)
    setAttempt((value) => value + 1)
  }

  return (
    <div className="lesson-demo">
      <div className="demo-app-bar"><span className="demo-brand"><span className="database-mark" aria-hidden="true">S</span> SQL LAND</span><span className="demo-app-tag">Practice</span></div>
      <div className="lesson-content">
        <div className="lesson-meta"><span>Find the right rows</span><span>Question {question + 1} of {questions.length}</span></div>
        <MotionProgress value={completed.length / questions.length * 100} label="Lesson completion" className="lesson-progress" trackClassName="progress-track" fillClassName="progress-fill" />
        <div className="question-space">
          <MotionSwitch transitionKey={question}>
            <div className="question-body">
              <h3>{current.title}</h3>
              <p className="question-description">{current.instruction}</p>
              <div className="query-editor"><div className="editor-caption"><span>query.sql</span><span>PostgreSQL</span></div><pre><code>{current.query}</code></pre></div>
            </div>
          </MotionSwitch>
        </div>
        <div className="query-output">
          <MotionSwitch transitionKey={`${feedback ?? 'idle'}-${attempt}`}>
            {feedback ? (
              <MotionFeedback kind={feedback}>
                <FeedbackMessage kind={feedback} title={feedback === 'success' ? 'That’s the right result.' : 'Check the filter.'} detail={feedback === 'success' ? current.rows : 'The result doesn’t match yet. Try running the sample query.'} />
              </MotionFeedback>
            ) : <div className="output-placeholder" role="status"><span className="placeholder-dot" /> Run the sample query to see the result.</div>}
          </MotionSwitch>
        </div>
        <div className="lesson-actions">
          <MotionButton className="button button-primary" onClick={runQuery}><Icon name="play" /> Run query</MotionButton>
          <MotionButton className="button button-secondary" onClick={nextQuestion}>{question === questions.length - 1 ? 'Start again' : 'Next question'} <Icon name="arrow" /></MotionButton>
        </div>
        <div className="lesson-bottom"><button className="text-button" onClick={() => { setFeedback('error'); setAttempt((value) => value + 1) }}>Preview an error</button><span>Simulated query results</span></div>
        <MotionCelebration trigger={celebration} className="lesson-celebration">
          <div className={`level-status ${complete ? 'is-complete' : ''}`} aria-live="polite"><Icon name={complete ? 'spark' : 'check'} /><span>{complete ? 'Level complete. Nicely done.' : `${completed.length} of ${questions.length} questions complete`}</span></div>
        </MotionCelebration>
      </div>
    </div>
  )
}

function ElementsDemo() {
  const [reveal, setReveal] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackKind>('success')
  const [feedbackAttempt, setFeedbackAttempt] = useState(0)
  const [progress, setProgress] = useState(25)
  const [celebration, setCelebration] = useState(0)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState(0)

  return (
    <div className="elements-grid">
      <section className="element-card">
        <div className="element-heading"><span className="component-number">01</span><h3>Reveal</h3><code>MotionReveal</code></div>
        <div className="element-preview reveal-preview"><MotionReveal key={reveal} className="sample-notification"><span className="mini-avatar">M</span><div><strong>Your workspace is ready</strong><span>Everything in its place.</span></div><Icon name="check" /></MotionReveal></div>
        <button className="element-action" onClick={() => setReveal((value) => value + 1)}><Icon name="replay" /> Replay entrance</button>
      </section>
      <section className="element-card">
        <div className="element-heading"><span className="component-number">02</span><h3>Press</h3><code>MotionButton</code></div>
        <div className="element-preview"><MotionButton className="button button-primary save-button" aria-pressed={saved} onClick={() => setSaved((value) => !value)}><Icon name={saved ? 'check' : 'copy'} />{saved ? 'Saved to collection' : 'Save to collection'}</MotionButton></div>
        <p className="element-note">Hover, press, and release.</p>
      </section>
      <section className="element-card">
        <div className="element-heading"><span className="component-number">03</span><h3>Switch</h3><code>MotionSwitch</code></div>
        <div className="element-preview switch-preview"><MotionSwitch transitionKey={view}><div className="sample-profile"><span className="profile-symbol">{view === 0 ? 'A' : 'B'}</span><strong>{view === 0 ? 'A clear beginning' : 'A smooth next step'}</strong><span>{view === 0 ? 'The first view is ready.' : 'The content changed in place.'}</span></div></MotionSwitch></div>
        <button className="element-action" onClick={() => setView((value) => value === 0 ? 1 : 0)}>Change view <Icon name="arrow" /></button>
      </section>
      <section className="element-card">
        <div className="element-heading"><span className="component-number">04</span><h3>Feedback</h3><code>MotionFeedback</code></div>
        <div className="element-preview feedback-preview"><MotionFeedback key={feedbackAttempt} kind={feedback}><FeedbackMessage kind={feedback} title={feedback === 'success' ? 'Changes saved' : feedback === 'error' ? 'Couldn’t save changes' : 'Your draft is ready'} detail={feedback === 'success' ? 'You’re all set.' : feedback === 'error' ? 'Try again in a moment.' : 'Continue whenever you’re ready.'} /></MotionFeedback></div>
        <div className="small-segmented" aria-label="Feedback kind">{(['success', 'error', 'info'] as const).map((kind) => <button key={kind} aria-pressed={feedback === kind} onClick={() => { setFeedback(kind); setFeedbackAttempt((value) => value + 1) }}>{kind}</button>)}</div>
      </section>
      <section className="element-card">
        <div className="element-heading"><span className="component-number">05</span><h3>Progress</h3><code>MotionProgress</code></div>
        <div className="element-preview progress-preview"><div className="progress-label"><span>Importing collection</span><strong>{progress}%</strong></div><MotionProgress value={progress} label="Collection import progress" trackClassName="progress-track" fillClassName="progress-fill" /></div>
        <button className="element-action" onClick={() => setProgress((value) => value >= 100 ? 0 : value + 25)}>{progress >= 100 ? 'Reset progress' : 'Add 25%'} <Icon name={progress >= 100 ? 'replay' : 'arrow'} /></button>
      </section>
      <section className="element-card">
        <div className="element-heading"><span className="component-number">06</span><h3>Celebrate</h3><code>MotionCelebration</code></div>
        <div className="element-preview celebration-preview"><MotionCelebration trigger={celebration} className="sample-celebration"><span className="achievement-icon"><Icon name="spark" size={26} /></span><strong>{celebration > 0 ? 'A milestone worth marking' : 'Make the moment count'}</strong></MotionCelebration></div>
        <button className="element-action" onClick={() => setCelebration((value) => value + 1)}><Icon name="spark" /> Celebrate once</button>
      </section>
    </div>
  )
}

function CodeSample({ preset, reduced, tab }: { preset: MotionPreset; reduced: boolean; tab: PreviewTab }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timerRef.current), [])
  const lessonUsage = `  <MotionSwitch transitionKey={question.id}>\n    <Question question={question} />\n  </MotionSwitch>\n\n  <MotionFeedback kind="success">\n    Answer correct.\n  </MotionFeedback>\n\n  <MotionProgress value={67} label="Lesson completion" />`
  const elementsUsage = `  <MotionReveal>\n    <YourCard />\n  </MotionReveal>\n\n  <MotionButton onClick={save}>Save changes</MotionButton>\n\n  <MotionCelebration trigger={completedCount}>\n    Level complete.\n  </MotionCelebration>`
  const source = `import {\n  MotionProvider, ${tab === 'lesson' ? 'MotionSwitch,\n  MotionFeedback, MotionProgress' : 'MotionReveal,\n  MotionButton, MotionCelebration'}\n} from '@motion-for-agents/react';\n\n<MotionProvider preset="${preset}" reducedMotion="${reduced ? 'always' : 'user'}">\n${tab === 'lesson' ? lessonUsage : elementsUsage}\n</MotionProvider>`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setCopyFailed(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
    }
  }

  return (
    <section className="code-section" aria-labelledby="code-title">
      <div className="code-title-row"><div><span className="eyebrow">THE SAME MOMENTS, IN CODE</span><h2 id="code-title">A small API. A shared language.</h2></div><button className="button button-secondary copy-button" onClick={copyCode}><Icon name={copied ? 'check' : 'copy'} />{copied ? 'Copied' : 'Copy code'}</button></div>
      <div className="code-window"><div className="code-window-caption"><Icon name="code" /><span>App.tsx</span><span>React + TypeScript</span></div><pre tabIndex={0} aria-label="Example React usage"><code>{source}</code></pre></div>
      {copyFailed && <p className="copy-status" role="status">Clipboard access isn’t available here. Select the code above to copy it.</p>}
    </section>
  )
}

export default function App() {
  const [preset, setPreset] = useState<MotionPreset>('quiet')
  const [reduced, setReduced] = useState(false)
  const [systemReduced, setSystemReduced] = useState(false)
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [tab, setTab] = useState<PreviewTab>('lesson')
  const [replay, setReplay] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activePreset = presets.find((item) => item.id === preset)!

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : tab === 'lesson' ? 1 : 0
    setTab(next === 0 ? 'lesson' : 'elements')
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={`app ${dark ? 'theme-dark' : ''} ${reduced || systemReduced ? 'is-reduced' : ''}`}>
      <a className="skip-link" href="#playground">Skip to playground</a>
      <header className="site-header">
        <a className="brand" href="#"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Motion for Agents</span></a>
        <div className="header-actions"><span className="header-status"><span /> React framework</span><button className="icon-button" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}><Icon name={dark ? 'sun' : 'moon'} size={18} /></button><a className="github-link" href="https://github.com/thejjeanjjorge/motion-for-agents" target="_blank" rel="noreferrer"><Icon name="github" size={18} /><span>GitHub</span></a></div>
      </header>
      <main className="page-content">
        <section className="intro" aria-labelledby="intro-title"><span className="eyebrow">PURPOSEFUL BY DEFAULT</span><h1 id="intro-title">A little motion.<br /><span>A clearer moment.</span></h1><p>Give every entrance, response, and milestone the right feeling.<br className="desktop-break" /> Preview the motion. Then let your agent bring it to your app.</p></section>
        <div className="playground-layout" id="playground">
          <aside className="control-panel" aria-label="Motion settings">
            <div className="controls-heading"><span className="eyebrow">MAKE IT FEEL RIGHT</span><h2>Choose a character</h2></div>
            <fieldset className="preset-picker"><legend className="sr-only">Motion preset</legend>{presets.map((item) => <label key={item.id} className={`preset-option ${preset === item.id ? 'is-selected' : ''}`}><input type="radio" name="preset" value={item.id} checked={preset === item.id} onChange={() => setPreset(item.id)} /><span className="preset-icon"><Icon name={item.icon} size={22} /></span><span className="preset-copy"><strong>{item.name}</strong><span>{item.description}</span></span><span className="radio-mark" aria-hidden="true" /></label>)}</fieldset>
            <div className="accessibility-control"><label className="toggle-label"><span><strong>Reduce motion</strong><small>Keep the meaning. Ease the movement.</small></span><input className="toggle-input" type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span></label><p>{systemReduced ? 'Your system already requests reduced motion.' : 'Your system motion preference is respected.'}</p></div>
            <div className="preview-tip"><span className="tip-number">01 — 03</span><p>Run each query, then move to the next question. Complete all three to see a milestone.</p></div>
          </aside>
          <section className="preview-section" aria-labelledby="preview-title">
            <div className="preview-heading"><div><span className="eyebrow">LIVE PLAYGROUND</span><h2 id="preview-title">See it in context</h2></div><button className="button replay-button" onClick={() => setReplay((value) => value + 1)}><Icon name="replay" /> Replay</button></div>
            <div className="preview-toolbar"><div className="preview-tabs" role="tablist" aria-label="Preview examples">{([{ id: 'lesson', label: 'Learning flow' }, { id: 'elements', label: 'UI elements' }] as const).map((item, index) => <button key={item.id} id={`tab-${item.id}`} ref={(node) => { tabRefs.current[index] = node }} role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onKeyDown={handleTabKey} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><span className="active-preset"><span />{activePreset.name}{(reduced || systemReduced) && <span className="reduced-indicator"> · Reduced</span>}</span></div>
            <MotionProvider preset={preset} reducedMotion={reduced ? 'always' : 'user'}>
              <div className={`preview-stage ${tab === 'elements' ? 'elements-stage' : ''}`} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
                <MotionReveal key={`${tab}-${replay}`} className="preview-reveal">{tab === 'lesson' ? <LessonDemo /> : <ElementsDemo />}</MotionReveal>
              </div>
            </MotionProvider>
            <p className="preview-caption"><span className="caption-rule" />{tab === 'lesson' ? 'One flow. Four moments: transition, feedback, progress, celebration.' : 'Six primitives. One preset. Change the character and compare.'}</p>
          </section>
        </div>
        <CodeSample preset={preset} reduced={reduced} tab={tab} />
      </main>
      <footer className="site-footer"><span>Motion should help the moment make sense.</span><a href="https://github.com/thejjeanjjorge/motion-for-agents#readme" target="_blank" rel="noreferrer">Explore the framework <Icon name="arrow" /></a></footer>
    </div>
  )
}
