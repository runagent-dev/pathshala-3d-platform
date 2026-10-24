#!/usr/bin/env node
// The studio for development: figures, the dashboard API, live reload. No install needed.
//
//   npm run dev                      → http://127.0.0.1:4800 (+ this machine's Tailscale address); no login
//   npm run dev:public               → every address; logins (data/users.json, npm run user); edits committed to git
//   PORT=5000 HOST=0.0.0.0 npm run dev
// Production (behind a TLS proxy, as a service): npm run studio (scripts/studio.mjs).
import { loadConfig } from './studio/config.mjs';
import { startStudio } from './studio/server.mjs';

await startStudio(loadConfig({ mode: 'dev' }));
