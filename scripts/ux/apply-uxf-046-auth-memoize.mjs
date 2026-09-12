#!/usr/bin/env node
/**
 * apply-uxf-046-auth-memoize.mjs — UXF-046: /api/auth/me memoisieren.
 *
 * auth-client.js rief /me 2–3× pro Seitenlast (init + 200ms-Retry + alle
 * Consumer wie home-recommendation). Jetzt: Promise-Cache — 1 Call pro
 * Seitenlast; login()/logout() invalidieren.
 *
 * Idempotent: Edit nur wenn Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const JS = path.join(ROOT, 'myhugoapp/static/js/auth-client.js');

const LOGIN_OLD = `    /** Login */
    login: function (email, password) {
      return apiFetch('POST', '/login', { email: email, password: password });
    },`;
const LOGIN_NEW = `    /** Login */
    login: function (email, password) {
      return apiFetch('POST', '/login', { email: email, password: password }).then(function (data) {
        /* UXF-046: Auth-State geändert — Memo verwerfen */
        currentUserPromise = null;
        return data;
      });
    },`;

const LOGOUT_OLD = `    /** Logout */
    logout: function () {
      return apiFetch('POST', '/logout').then(function () {
        window.location.href = '/';
      });
    },`;
const LOGOUT_NEW = `    /** Logout */
    logout: function () {
      currentUserPromise = null; /* UXF-046: Memo verwerfen */
      return apiFetch('POST', '/logout').then(function () {
        window.location.href = '/';
      });
    },`;

const ME_OLD = `    /** Get current user (null if not logged in) */
    me: function () {
      return apiFetch('GET', '/me')
        .then(function (data) {
          return data.user || null;
        })
        .catch(function () {
          return null;
        });
    },`;
const ME_NEW = `    /** Get current user (null if not logged in) */
    me: function () {
      return this.getUser();
    },`;

const GETUSER_OLD = `    /** Check if user is logged in and return their info */
    getUser: function () {
      return apiFetch('GET', '/me')
        .then(function (data) {
          return data.user || null;
        })
        .catch(function () {
          return null;
        });
    },`;
const GETUSER_NEW = `    /** Check if user is logged in and return their info */
    getUser: function () {
      /* UXF-046: memoized — 1x /me pro Seitenlast statt 2-3x */
      if (!currentUserPromise) {
        currentUserPromise = apiFetch('GET', '/me')
          .then(function (data) {
            return data.user || null;
          })
          .catch(function () {
            return null;
          });
      }
      return currentUserPromise;
    },`;

const DECL_OLD = '  window.AuthClient = {';
const DECL_NEW = `  /* UXF-046: memoized /me — jeder Besucher lud /auth/me 2-3x pro Seitenlast */
  var currentUserPromise = null;

  window.AuthClient = {`;

export function applyMemoize(src) {
  if (src.includes('UXF-046')) return { changed: false, src };
  const anchors = [
    ['login', LOGIN_OLD, LOGIN_NEW],
    ['logout', LOGOUT_OLD, LOGOUT_NEW],
    ['me', ME_OLD, ME_NEW],
    ['getUser', GETUSER_OLD, GETUSER_NEW],
    ['decl', DECL_OLD, DECL_NEW],
  ];
  let out = src;
  for (const [name, old, neu] of anchors) {
    if (!out.includes(old)) return { changed: false, error: `Anker nicht gefunden: ${name}` };
    out = out.replace(old, neu);
  }
  return { changed: true, src: out };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-046-auth-memoize.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(JS, 'utf8');
  const { changed, src, error } = applyMemoize(before);
  if (error) {
    console.error(`apply-uxf-046-auth-memoize: ${error}`);
    process.exit(1);
  }
  if (changed) fs.writeFileSync(JS, src);
  console.log(
    `apply-uxf-046-auth-memoize: ${changed ? 'Memoization eingebaut' : 'bereits vorhanden'}`
  );
}
