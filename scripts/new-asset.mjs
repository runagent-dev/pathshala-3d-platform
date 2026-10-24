#!/usr/bin/env node
// Usage: npm run new -- <id> "<Title>" [--model | --animation] [--subject Physics] [--chapter "Units and Measurement"] [--page 20] [--topic 1.6]
import { scaffoldAsset } from './lib/scaffold.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : '';
};
const subject = flag('subject');
const chapter = flag('chapter');
const page = flag('page');
const topic = flag('topic');
const isModel = args.includes('--model');
const isAnimation = args.includes('--animation');
const [id, title] = args.filter((a) => !a.startsWith('--'));

if (!id) {
  console.log('Usage: npm run new -- <id> "<Title>" [--model | --animation] [--subject X] [--chapter Y] [--page 20] [--topic 1.6]');
  process.exit(1);
}

try {
  const r = await scaffoldAsset({ id, title, type: isModel ? 'model' : isAnimation ? 'animation' : 'interactive', subject, chapter, page, topic });
  console.log(`✓ Created ${r.dir}`);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
