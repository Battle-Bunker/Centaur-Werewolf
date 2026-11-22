/**
 * A pass-through in front of the game's MCP server, used by arena.ts (unless --direct).
 *
 * Why: the server's `room_wait` is an HTTP action that sleeps in a loop for up to 25 s, and the local Convex backend
 * runs only about four HTTP actions at a time. With a table's worth of agents waiting, every other call (planning a
 * night move, chatting, voting, other people's traffic) queues behind them for many seconds.
 *
 * What it does: forwards every request unchanged (same body, same bearer key, same answers, same tool list), except a
 * `tools/call` of `room_wait`, which it answers itself by polling the server's own `room_view` with the caller's key
 * once a second until the parts of `version` its `until` mode watches differ (shared/commands.ts `versionKey`, the
 * server's own rule), and returns the same shape the server's `room_wait` returns. Arguments the
 * shim does not accept are forwarded, so the server's own refusal comes back. It holds no keys and keeps no state.
 *
 * Connection drops: a headless AI client drops an MCP server for good after an HTTP failure (a 503, a refused
 * connection). A Hush's cut answers the cut player with a bare 503 for the cut window, exactly as a real outage. So the
 * shim turns ANY upstream failure (non-2xx, or no answer) into an HTTP 200 carrying a retryable error: a tool-level
 * error result for `tools/call`, a JSON-RPC error for other methods, with one fixed wording that says only that the
 * game server could not be reached. A genuine outage and a cut produce the identical answer; nothing names a cause.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { versionKey } from "../shared/commands";

const POLL_MS = 1000;
export const UNREACHABLE = "Network error: the game server could not be reached (your connection may have dropped). Nothing you sent in this call went through. Wait a few seconds and try again; keep calling room_wait or room_view until it answers.";
const unreachable = (id: unknown, method: string | undefined) => method === "tools/call"
  ? { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: UNREACHABLE }], isError: true } }
  : { jsonrpc: "2.0", id, error: { code: -32000, message: UNREACHABLE } };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function startShim(upstream: string): Promise<{ url: string; close: () => void; stats: { forwarded: number; waits: number } }> {
  const stats = { forwarded: 0, waits: 0 };
  const forward = (req: IncomingMessage, body: string) => fetch(upstream, {
    method: req.method, body: req.method === "POST" ? body : undefined,
    headers: Object.fromEntries(["authorization", "content-type", "accept", "mcp-protocol-version", "x-api-key"].flatMap(h => (req.headers[h] ? [[h, String(req.headers[h])]] : []))),
  });
  const call = async (auth: string, name: string, args: Record<string, unknown>) => {
    const res = await fetch(upstream, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: auth }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) });
    if (!res.ok) return "unreachable" as const;
    return ((await res.json()) as { result?: { isError?: boolean; structuredContent?: { notice: string; data: { version: string; phase: string; chatCount: number } } } }).result;
  };

  async function wait(auth: string, id: unknown, args: Record<string, unknown>) {
    const seconds = args.seconds ?? 20, version = args.version, until = (args.until ?? "any") as string;
    const ok = Object.keys(args).every(k => k === "seconds" || k === "version" || k === "until") && Number.isInteger(seconds) && (seconds as number) >= 1 && (seconds as number) <= 25 && (version === undefined || typeof version === "string") && ["any", "phase", "chat", "turn"].includes(until);
    if (!ok) return null; // let the server refuse it in its own words
    stats.waits++;
    type View = { isError?: boolean; structuredContent?: { notice: string; data: { version: string; phase: string; chatCount: number } } } | undefined;
    const look = async (): Promise<View | "unreachable"> => { try { return await call(auth, "room_view", { compact: true, chatSince: 1e9 }); } catch { return "unreachable"; } };
    const first = await look();
    if (first === "unreachable") return unreachable(id, "tools/call");
    if (!first || first.isError || !first.structuredContent) return { jsonrpc: "2.0", id, result: first ?? { content: [{ type: "text", text: "That room no longer exists." }], isError: true } };
    let now: View = first;
    const notice = first.structuredContent.notice, from = (version as string | undefined) ?? first.structuredContent.data.version;
    const same = () => !!now?.structuredContent && versionKey(now.structuredContent.data.version, until) === versionKey(from, until);
    for (const end = Date.now() + (seconds as number) * 1000; same() && Date.now() < end;) {
      await sleep(POLL_MS);
      const n = await look();
      if (n === "unreachable") return unreachable(id, "tools/call");
      now = n;
    }
    if (!now?.structuredContent) return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "That room no longer exists." }], isError: true } };
    const v = now.structuredContent.data, changed = !same();
    const data = { changed, version: v.version, phase: v.phase, chatCount: v.chatCount, until, next: changed ? "Call room_view to see what changed (room_view { \"compact\": true, \"chatSince\": <your last chatCount> } for only what is new)." : "Nothing changed yet. Call room_wait again with this version." };
    return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `${notice}\n${JSON.stringify(data)}` }], structuredContent: { untrusted: true, notice, data }, isError: false } };
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks).toString();
    try {
      let rpc: any; try { rpc = JSON.parse(body); } catch { /* forwarded as is */ }
      const auth = String(req.headers.authorization ?? "");
      if (req.method === "POST" && auth && rpc && !Array.isArray(rpc) && rpc.method === "tools/call" && rpc.params?.name === "room_wait") {
        const answer = await wait(auth, rpc.id, rpc.params.arguments ?? {});
        if (answer) { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(answer)); return; }
      }
      stats.forwarded++;
      const rpcId = rpc && !Array.isArray(rpc) ? rpc.id : null, rpcMethod = rpc && !Array.isArray(rpc) ? rpc.method : undefined;
      const up = await forward(req, body).catch(() => null);
      // Any upstream failure on a JSON-RPC request becomes a retryable error the client keeps the server for.
      // (A notification has no id and expects no body: answer 202 as the server would.)
      if (req.method === "POST" && rpc && !Array.isArray(rpc) && (!up || !up.ok) && !(up && up.status === 401)) {
        if (rpcId === undefined) { res.writeHead(202); res.end(); return; }
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(unreachable(rpcId, rpcMethod))); return;
      }
      if (!up) { res.writeHead(502, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "shim", message: "upstream unreachable" })); return; }
      const headers: Record<string, string> = {};
      for (const h of ["content-type", "www-authenticate", "allow"]) { const v = up.headers.get(h); if (v) headers[h] = v; }
      res.writeHead(up.status, headers); res.end(Buffer.from(await up.arrayBuffer()));
    } catch (e) { res.writeHead(502, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "shim", message: String(e) })); }
  });
  await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`, close: () => server.close(), stats };
}
