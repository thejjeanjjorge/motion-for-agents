import { readFileSync } from 'node:fs';
import Ajv from 'ajv';

const schema = JSON.parse(readFileSync(new URL('../schemas/motion-plan.schema.json', import.meta.url), 'utf8'));
const validateSchema = new Ajv({ allErrors: true, strict: true }).compile(schema);

/** Validate shape, canonical component choices, and unique transition IDs. */
export function validatePlan(plan) {
  if (!validateSchema(plan)) {
    return validateSchema.errors.map(error => `${error.instancePath || '/'} ${error.message}`);
  }
  const errors = [];
  const seen = new Set();
  for (const [index, transition] of plan.transitions.entries()) {
    for (const field of ['id', 'target', 'trigger']) {
      if (!transition[field].trim()) errors.push(`/transitions/${index}/${field} must contain text`);
    }
    const id = transition.id.trim();
    if (seen.has(id)) errors.push(`/transitions/${index}/id duplicates ${JSON.stringify(id)}`);
    seen.add(id);
  }
  for (const [index, note] of (plan.notes ?? []).entries()) {
    if (!note.trim()) errors.push(`/notes/${index} must contain text`);
  }
  return errors;
}

export function readPlan(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
