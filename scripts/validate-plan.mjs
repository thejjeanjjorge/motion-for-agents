#!/usr/bin/env node
import { readPlan, validatePlan } from './plan-contract.mjs';

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('Usage: motion-for-agents-validate path/to/plan.json [another-plan.json]');
  process.exitCode = 1;
}
for (const path of paths) {
  try {
    const errors = validatePlan(readPlan(path));
    if (errors.length) {
      console.error(`${path}: invalid\n${errors.map(error => `  ${error}`).join('\n')}`);
      process.exitCode = 1;
    } else {
      console.log(`${path}: valid`);
    }
  } catch (error) {
    console.error(`${path}: ${error.message}`);
    process.exitCode = 1;
  }
}
