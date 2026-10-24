#!/usr/bin/env node
// Studio accounts (data/users.json on the server; never in git).
//
//   npm run user -- list
//   npm run user -- add rahim --role reviewer [--name "Rahim Uddin"] [--email …]   prints a one-time invite link
//   npm run user -- invite rahim          a new invite link (also how to reset a forgotten password)
//   npm run user -- role rahim contributor
//   npm run user -- disable rahim | enable rahim
//   npm run user -- password rahim        set a password directly (asks for it)
// Roles: admin (everything), contributor (make and export figures, answer reviews), reviewer (look and comment).
// PATHSHALA_STUDIO_URL sets the address used in invite links (default http://127.0.0.1:4800).
import readline from 'node:readline';
import { createAccounts } from './studio/accounts.mjs';
import { ROLES } from './studio/policy.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const base = (process.env.PATHSHALA_STUDIO_URL || 'http://127.0.0.1:4800').replace(/\/$/, '');
const link = (username, token) => `${base}/login/#invite=${encodeURIComponent(username)}.${token}`;
const accounts = createAccounts();
const [command, username, extra] = args;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), resolve(a))));
}

try {
  if (command === 'list' || !command) {
    const users = accounts.users;
    if (!users.length) console.log('No accounts yet. The first public or production start creates an admin.');
    for (const u of users) console.log(`${u.username.padEnd(20)} ${u.role.padEnd(12)} ${u.name}${u.email ? ` <${u.email}>` : ''}`);
  } else if (command === 'add') {
    const role = opt('role') || 'reviewer';
    const r = accounts.addUser({ username, role, name: opt('name') || '', email: opt('email') || '' });
    console.log(`✓ ${r.user.username} (${role}). Send them this link (valid 7 days) to set their password:\n  ${link(r.user.username, r.invite)}`);
  } else if (command === 'invite') {
    console.log(`New invite link for ${username} (valid 7 days):\n  ${link(username, accounts.invite(username))}`);
  } else if (command === 'role') {
    accounts.setRole(username, extra);
    console.log(`✓ ${username} is now ${extra}`);
  } else if (command === 'disable' || command === 'enable') {
    accounts.setDisabled(username, command === 'disable');
    console.log(`✓ ${username} ${command}d${command === 'disable' ? ' (logged out everywhere)' : ''}`);
  } else if (command === 'password') {
    const pw = await ask(`New password for ${username} (at least 10 characters): `);
    if (pw.length < 10) throw new Error('too short');
    accounts.setPassword(username, pw);
    console.log(`✓ password set for ${username}`);
  } else {
    console.log(`Unknown command "${command}". Commands: list, add, invite, role, disable, enable, password. Roles: ${ROLES.join(', ')}.`);
    process.exitCode = 2;
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exitCode = 1;
}
