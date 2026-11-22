/**
 * Checks the harness's handling of a dropped connection (a Hush cut) without any AI player: a scripted client talks
 * to a play-test table through sim/mcp-shim.ts while another seat cuts it. During the cut every call must come back as
 * HTTP 200 with the fixed network-error wording (tool error for tools/call, JSON-RPC error otherwise), identical to a
 * genuine outage (a shim pointed at a dead port); after the window, calls work again.
 *   npx tsx sim/research/hush-check.mts
 */
import { run, setupTable, tool, MCP_URL } from "../lib";
import { startShim, UNREACHABLE } from "../mcp-shim";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
let failed = 0;
const ok = (n: string, x: boolean, d = "") => { console.log(`${x ? "ok  " : "FAIL"} ${n}${x ? "" : "  " + d}`); if (!x) failed++; };
const shim = await startShim(MCP_URL), dead = await startShim("http://127.0.0.1:9/mcp");
const post = async (url: string, key: string, method: string, params: Record<string, unknown> = {}) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${key}` }, body: JSON.stringify({ jsonrpc: "2.0", id: 7, method, params }) });
  return { status: r.status, body: await r.json().catch(() => null) as any };
};
const deck = ["hush", "werewolf", "sage", "centaur", "rustler", "sentry"];
const t = await setupTable({ label: "hush", deck, center: 3, players: ["A", "B", "C"], timers: { dusk: 1, turn: 1, day: 120, vote: 10 }, rules: { cutSeconds: 15 }, playtest: true });
await run("setup.fixDeal", t.seats[0].token, t.code, { seats: t.seats.map(s => s.id), cards: deck, nightSeed: 1 });
await run("game.start", t.seats[0].token, t.code);
const [a, b] = t.seats;
let v: any = await tool(a.key, "room_view"); for (let i = 0; i < 30 && v.phase !== "day"; i++) { await sleep(1000); v = await tool(a.key, "room_view"); }
ok("before the cut, a call through the shim works", (await post(shim.url, b.key, "tools/call", { name: "room_view", arguments: {} })).body?.result?.isError === false);
await tool(a.key, "day_cutLine", { seat: 1 });
const during = await post(shim.url, b.key, "tools/call", { name: "room_view", arguments: {} });
ok("during the cut: tools/call -> HTTP 200 + tool error with the fixed wording", during.status === 200 && during.body?.result?.isError === true && during.body.result.content[0].text === UNREACHABLE, JSON.stringify(during).slice(0, 200));
const wait = await post(shim.url, b.key, "tools/call", { name: "room_wait", arguments: { seconds: 2 } });
ok("during the cut: room_wait (served by the shim) -> the same error", wait.status === 200 && wait.body?.result?.content?.[0]?.text === UNREACHABLE, JSON.stringify(wait).slice(0, 200));
const list = await post(shim.url, b.key, "tools/list");
ok("during the cut: tools/list -> HTTP 200 + JSON-RPC error with the same wording", list.status === 200 && list.body?.error?.message === UNREACHABLE, JSON.stringify(list).slice(0, 200));
const outage = await post(dead.url, b.key, "tools/call", { name: "room_view", arguments: {} });
ok("a genuine outage gives the identical answer", JSON.stringify(outage.body) === JSON.stringify(during.body), JSON.stringify(outage).slice(0, 200));
const text = JSON.stringify([during.body, wait.body, list.body]);
ok("no answer names a cut or the Hush", !/cut|hush|silenc/i.test(text));
for (let i = 0; i < 40; i++) { await sleep(1000); const r = await post(shim.url, b.key, "tools/call", { name: "room_view", arguments: {} }); if (r.body?.result?.isError === false) { ok(`after the window the call works again (after ~${i + 1} s)`, true); break; } if (i === 39) ok("after the window the call works again", false); }
await run("game.abandon", a.token, t.code).catch(() => {});
console.log(failed ? `${failed} FAILED` : "all hush checks passed");
process.exit(failed ? 1 : 0);
