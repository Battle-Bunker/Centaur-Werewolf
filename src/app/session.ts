/** This browser's identity: a secret token (there are no accounts yet) and the last name used. */
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode: the session lasts for the tab */ } };

let token = read("cw.token");
if (!token) { token = crypto.randomUUID() + crypto.randomUUID(); write("cw.token", token); }
export const TOKEN = token;

export const savedName = () => read("cw.name") ?? "";
export const saveName = (name: string) => write("cw.name", name);
export const readNumber = (k: string, fallback: number) => { const n = Number(read(k)); return Number.isFinite(n) && n > 0 ? n : fallback; };
export const saveNumber = (k: string, n: number) => write(k, String(Math.round(n)));

/** Where the address bar points: a room (`#/ABCD`), an assistant's request to connect (`#/connect/<key>`), or the front page. */
export type Route = { kind: "home" } | { kind: "room"; code: string } | { kind: "connect"; request: string };
export function routeFromHash(): Route {
  const room = /^#\/([A-Za-z]{4})$/.exec(location.hash);
  if (room) return { kind: "room", code: room[1].toUpperCase() };
  const connect = /^#\/connect\/([A-Za-z0-9_\-.~]+)$/.exec(location.hash);
  if (connect) return { kind: "connect", request: connect[1] };
  return { kind: "home" };
}

/** 32 random bytes, base64url: the secret only this browser holds while it answers an assistant's request. */
export function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A request this browser was answering when it went off to create or join a table first. */
export const pendingConnect = { get: () => read("cw.connect") || null, set: (k: string | null) => write("cw.connect", k ?? "") };
