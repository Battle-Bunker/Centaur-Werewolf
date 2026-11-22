/**
 * Shared pieces of the play-test harness. It drives a real server the way real clients do: table setup goes through
 * the app's `commands:run` mutation with browser-style tokens, and every player action goes through the MCP endpoint
 * with that player's own key. Nothing here reaches into the database or the engine.
 */
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "node:fs";
import { api } from "../convex/_generated/api";

const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => l.split("=").map(s => s.trim()) as [string, string]));
export const CONVEX_URL = process.env.CONVEX_URL ?? env.VITE_CONVEX_URL;
export const SITE_URL = process.env.CONVEX_SITE_URL ?? env.VITE_CONVEX_SITE_URL;
export const MCP_URL = `${SITE_URL}/mcp`;

const convex = new ConvexHttpClient(CONVEX_URL);
export const token = () => crypto.randomUUID() + crypto.randomUUID();
/** One app command, as the browser sends it. */
export const run = (id: string, tok: string, code: string | undefined, args: Record<string, unknown> = {}) => convex.mutation(api.commands.run, { id, token: tok, code, args }) as Promise<Record<string, unknown> | null>;
export const view = (code: string, tok: string) => convex.query(api.rooms.view, { code, token: tok });

let rpcId = 1;
export async function rpc(key: string | null, method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(MCP_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }) });
  return { status: res.status, headers: res.headers, body: res.status === 202 ? null : await res.json().catch(() => null) };
}
/** One MCP tool call. Returns the tool's data, or throws its refusal. */
export async function tool<T = Record<string, unknown>>(key: string, name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { status, body } = await rpc(key, "tools/call", { name, arguments: args });
  if (status !== 200 || body?.error) throw new Error(`MCP ${status}: ${JSON.stringify(body?.error ?? body)}`);
  if (body.result.isError) throw new Refusal(body.result.content[0].text);
  return body.result.structuredContent.data as T;
}
export class Refusal extends Error {}

export interface TableConfig { label: string; players: string[]; deck: string[]; center: number; timers: { dusk: number; turn: number; day: number } }
export interface Table { code: string; config: TableConfig; seats: { name: string; token: string; key: string; host: boolean }[] }

/** Opens a room, seats the players, sets the table up, and makes each player an MCP key. Does not start the game. */
export async function setupTable(config: TableConfig): Promise<Table> {
  const [hostName, ...others] = config.players;
  const hostToken = token();
  const { code } = (await run("room.create", hostToken, undefined, { name: hostName })) as { code: string };
  const seats = [{ name: hostName, token: hostToken, key: "", host: true }];
  for (const name of others) { const t = token(); await run("room.join", t, undefined, { code, name }); seats.push({ name, token: t, key: "", host: false }); }
  await run("setup.setCenter", hostToken, code, { count: config.center });
  const current = (await view(code, hostToken))!.settings.deck;
  for (const role of current) await run("setup.removeRole", hostToken, code, { role });
  for (const role of config.deck) await run("setup.addRole", hostToken, code, { role });
  for (const [timer, seconds] of Object.entries(config.timers)) await run("setup.setTimer", hostToken, code, { timer, seconds });
  for (const s of seats) s.key = ((await run("connect.createKey", s.token, code, { permission: s.host ? "host" : "act", label: `play-test ${config.label}` })) as { key: string }).key;
  return { code, config, seats };
}
