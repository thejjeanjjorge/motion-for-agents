import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Run the public CLI: these checks cover its failure status as well as validation.
function validate(plan: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'motion-plan-'));
  try {
    const path = join(directory, 'plan.json');
    writeFileSync(path, JSON.stringify(plan));
    return spawnSync(process.execPath, ['scripts/validate-plan.mjs', path], { encoding: 'utf8' });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const plan = {
  version: 1, preset: 'quiet', reducedMotion: 'user',
  transitions: [{ id: 'result', intent: 'feedback', target: 'Result message', trigger: 'Query completes', component: 'MotionFeedback' }],
};

test('the public CLI accepts a canonical motion plan', () => {
  const result = validate(plan);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain(': valid');
});

test('the public CLI rejects a component that does not match its intent', () => {
  const result = validate({ ...plan, transitions: [{ ...plan.transitions[0], component: 'MotionCelebration' }] });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('/component');
});

test('the public CLI rejects ambiguous IDs and empty targets', () => {
  const result = validate({ ...plan, transitions: [plan.transitions[0], { ...plan.transitions[0], target: '  ' }] });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('duplicates');
  expect(result.stderr).toContain('/target');
});

test('the public CLI rejects invented settings', () => {
  const result = validate({ ...plan, duration: 7 });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('additional properties');
});

test('the public CLI accepts a per-transition preset override', () => {
  const result = validate({ ...plan, transitions: [{ ...plan.transitions[0], preset: 'celebration' }] });
  expect(result.status).toBe(0);
});

test('the public CLI rejects an unknown preset override', () => {
  const result = validate({ ...plan, transitions: [{ ...plan.transitions[0], preset: 'bouncy' }] });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('/transitions/0/preset');
});

test('the public CLI rejects a preset on a celebration, which has no preset', () => {
  const celebrate = { id: 'level', intent: 'celebrate', target: 'Level badge', trigger: 'Level passed', component: 'MotionCelebration' };
  const result = validate({ ...plan, transitions: [{ ...celebrate, preset: 'spring' }] });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('/transitions/0/preset is not supported for this intent');
  expect(validate({ ...plan, transitions: [celebrate] }).status).toBe(0);
});
