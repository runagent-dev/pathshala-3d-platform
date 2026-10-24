// The books the figures belong to (books/books.json, kept by hand). Page and topic numbers are typed in per
// figure; the book list only says which books exist and, optionally, their chapter titles.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BOOKS_FILE = path.join(ROOT, 'books', 'books.json');
export const DEFAULT_BOOK = 'physics-9-10';

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

let cache = { mtime: -1, books: [] };

/** All books, in the order of books.json. Re-read when the file changes. Throws if the file is malformed. */
export function loadBooks(file = BOOKS_FILE) {
  const mtime = fs.statSync(file).mtimeMs;
  if (file === BOOKS_FILE && mtime === cache.mtime) return cache.books;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const problems = validateBooks(data);
  if (problems.length) throw new Error(`${path.relative(ROOT, file)}: ${problems.join('; ')}`);
  if (file === BOOKS_FILE) cache = { mtime, books: data.books };
  return data.books;
}

export function validateBooks(data) {
  const problems = [];
  if (!data || !Array.isArray(data.books)) return ['expected { "books": [...] }'];
  const seen = new Set();
  data.books.forEach((b, i) => {
    const at = `books[${i}]`;
    if (!SLUG.test(b?.id || '')) problems.push(`${at}.id must be a lowercase slug`);
    else if (seen.has(b.id)) problems.push(`${at}.id "${b.id}" is listed twice`);
    seen.add(b?.id);
    if (!b?.title?.bn || !b?.title?.en) problems.push(`${at}.title needs "bn" and "en"`);
    for (const [j, c] of (b?.chapters || []).entries()) {
      if (!Number.isInteger(c?.number) || c.number < 1) problems.push(`${at}.chapters[${j}].number must be a whole number`);
      if (!c?.title?.bn) problems.push(`${at}.chapters[${j}].title needs "bn"`);
    }
  });
  return problems;
}

export const findBook = (id, books = loadBooks()) => books.find((b) => b.id === id) || null;

/** The chapter a topic belongs to ("1.6.1" → chapter 1), if books.json names it. */
export function chapterOf(book, topic) {
  const n = Number(String(topic || '').split('.')[0]);
  return (n && book?.chapters?.find((c) => c.number === n)) || null;
}

/** The short reference shown everywhere: "physics-9-10 › 1.6.1 › p21". Missing parts are left out. */
export function bookRef({ book, topic, page }) {
  return [book, topic, page != null && page !== '' ? `p${page}` : ''].filter(Boolean).join(' › ');
}

/** Position of a book in books.json (unknown books sort last). */
export function bookIndex(id, books = loadBooks()) {
  const i = books.findIndex((b) => b.id === id);
  return i < 0 ? books.length : i;
}
