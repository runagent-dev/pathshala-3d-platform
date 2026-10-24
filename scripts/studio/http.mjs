// Small HTTP helpers for the studio server.
import { MIME } from '../lib/mime.mjs';

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

export const json = (res, status, data, headers = {}) => send(res, status, JSON.stringify(data), { 'Content-Type': MIME['.json'], ...headers });

export async function readBody(req, limit = 60 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw httpError(413, 'Body too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req, limit = 64 * 1024) {
  const text = (await readBody(req, limit)).toString('utf8');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw httpError(400, 'The request body is not valid JSON');
  }
}

/** A PNG from a raw image body or a data URL. */
export function decodeImage(buf, contentType) {
  if ((contentType || '').startsWith('image/')) return buf;
  const m = /^data:image\/\w+;base64,(.+)$/s.exec(buf.toString('utf8'));
  if (!m) throw httpError(400, 'Expected a PNG body or data URL');
  return Buffer.from(m[1], 'base64');
}

/** Cookies of a request as an object. */
export function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
