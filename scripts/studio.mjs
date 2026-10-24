#!/usr/bin/env node
// The studio in production: listens on 127.0.0.1 behind a reverse proxy that adds TLS (see deploy/), everyone
// logs in, every studio edit is committed and the checkout is pulled and pushed in the background.
//
//   npm run studio                   (PORT, HOST, TRUST_PROXY, PATHSHALA_WEBHOOK_SECRET … in the environment)
import { loadConfig } from './studio/config.mjs';
import { startStudio } from './studio/server.mjs';

await startStudio(loadConfig({ mode: 'production' }));
