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

/** The room in the address bar: `#/ABCD`. */
export const codeFromHash = () => { const m = /^#\/([A-Za-z]{4})$/.exec(location.hash); return m ? m[1].toUpperCase() : null; };
