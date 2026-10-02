import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PRESETS, MOTION_INTENTS, getMotionRecipe } from '../dist/index.js';
import * as library from '../dist/index.js';
import { readPlan, validatePlan } from './plan-contract.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, 'motion.catalog.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(root, 'schemas/motion-plan.schema.json'), 'utf8'));
assert.equal(catalog.package, manifest.name, 'Catalog package name drifted');
assert.equal(catalog.packageVersion, manifest.version, 'Catalog package version drifted');
assert.deepEqual(catalog.presets, Object.values(PRESETS), 'Catalog presets differ from exported presets');
assert.deepEqual(catalog.components.map(item => item.intent).slice(0, 4), Object.keys(MOTION_INTENTS));
for (const { name } of catalog.components) assert.ok(library[name], `${name} is not exported`);
assert.deepEqual(schema.properties.preset.enum, catalog.presets.map(item => item.id), 'Schema preset vocabulary drifted');
assert.deepEqual(schema.properties.transitions.items.properties.preset.enum, catalog.presets.map(item => item.id), 'Schema transition preset vocabulary drifted');
assert.deepEqual(schema.properties.transitions.items.properties.intent.enum, catalog.components.map(item => item.intent), 'Schema intent vocabulary drifted');
assert.deepEqual(schema.properties.transitions.items.properties.component.enum, catalog.components.map(item => item.name), 'Schema component vocabulary drifted');
for (const { intent, name } of catalog.components) {
  const mapping = schema.properties.transitions.items.allOf.find(item => item.if.properties.intent.const === intent);
  assert.equal(mapping?.then.properties.component.const, name, `${intent} has a mismatched schema component`);
}
for (const preset of Object.keys(PRESETS)) {
  for (const intent of Object.keys(MOTION_INTENTS)) {
    const recipe = getMotionRecipe(intent, preset, true);
    for (const target of [recipe.initial, recipe.animate, recipe.exit]) {
      assert.ok(Object.keys(target).every(key => key === 'opacity'), `Reduced ${preset}/${intent} has spatial motion`);
    }
    assert.ok(recipe.transition.duration <= 0.12, 'Reduced fade exceeds 120ms');
  }
}
// The plan validator ships with the package so consuming apps can run it.
const validator = manifest.bin?.['motion-for-agents-validate']?.replace(/^\.\//, '');
assert.ok(validator && existsSync(join(root, validator)), 'The plan validator bin is missing');
for (const file of [validator, 'scripts/plan-contract.mjs']) assert.ok(manifest.files.includes(file), `${file} is not packaged`);
assert.ok(manifest.files.includes('schemas'), 'The plan schema is not packaged');
assert.ok(manifest.dependencies?.ajv, 'The shipped plan validator needs ajv as a runtime dependency');
let plans = 0;
for (const file of readdirSync(join(root, 'docs/examples'))) {
  if (!file.endsWith('.json')) continue;
  const errors = validatePlan(readPlan(join(root, 'docs/examples', file)));
  assert.deepEqual(errors, [], `${file}: ${errors.join('; ')}`);
  plans++;
}
assert.ok(plans > 0, 'Commit at least one validated example motion plan');
const skill = readFileSync(join(root, catalog.skill), 'utf8');
assert.match(skill, /^---\r?\nname: motion-for-agents\r?\n/);
assert.match(skill, /description:/);
console.log(`Agent contract passed: ${catalog.presets.length} presets, ${catalog.components.length} components, ${plans} example plans.`);
