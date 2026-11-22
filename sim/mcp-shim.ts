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
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { versionKey } from "../shared/commands";

const POLL_MS = 1000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function startShim(upstream: string): Promise<{ url: string; close: () => void; stats: { forwarded: number; waits: number } }> {
  const stats = { forwarded: 0, waits: 0 };
  const forward = (req: IncomingMessage, body: string) => fetch(upstream, {
    method: req.method, body: req.method === "POST" ? body : undefined,
    headers: Object.fromEntries(["authorization", "content-type", "accept", "mcp-protocol-version", "x-api-key"].flatMap(h => (req.headers[h] ? [[h, String(req.headers[h])]] : []))),
  });
  const call = async (auth: string, name: string, args: Record<string, unknown>) => {
    const res = await fetch(upstream, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: auth }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) });
    return res.ok ? ((await res.json()) as { result?: { isError?: boolean; structuredContent?: { notice: string; data: { version: string; phase: string; chatCount: number } } } }).result : undefined;
  };

  async function wait(auth: string, id: unknown, args: Record<string, unknown>) {
    const seconds = args.seconds ?? 20, version = args.version, until = (args.until ?? "any") as string;
    const ok = Object.keys(args).every(k => k === "seconds" || k === "version" || k === "until") && Number.isInteger(seconds) && (seconds as number) >= 1 && (seconds as number) <= 25 && (version === undefined || typeof version === "string") && ["any", "phase", "chat", "turn"].includes(until);
    if (!ok) return null; // let the server refuse it in its own words
    stats.waits++;
    const look = () => call(auth, "room_view", { compact: true, chatSince: 1e9 });
    let now = await look();
    if (!now || now.isError || !now.structuredContent) return { jsonrpc: "2.0", id, result: now ?? { content: [{ type: "text", text: "That room no longer exists." }], isError: true } };
    const notice = now.structuredContent.notice, from = (version as string | undefined) ?? now.structuredContent.data.version;
    const same = () => !!now?.structuredContent && versionKey(now.structuredContent.data.version, until) === versionKey(from, until);
    for (const end = Date.now() + (seconds as number) * 1000; same() && Date.now() < end;) { await sleep(POLL_MS); now = await look(); }
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
      const up = await forward(req, body);
      const headers: Record<string, string> = {};
      for (const h of ["content-type", "www-authenticate", "allow"]) { const v = up.headers.get(h); if (v) headers[h] = v; }
      res.writeHead(up.status, headers); res.end(Buffer.from(await up.arrayBuffer()));
    } catch (e) { res.writeHead(502, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "shim", message: String(e) })); }
  });
  await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`, close: () => server.close(), stats };
}
