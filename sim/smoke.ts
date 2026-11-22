/**
 * End-to-end check of the assistant interface against a running server: authentication (pasted key and the full OAuth
 * 2.1 code flow), grants, and one whole game played only through MCP tools by scripted players who choose at random.
 *   npx tsx sim/smoke.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { MCP_URL, Refusal, rpc, run, setupTable, SITE_URL, tool } from "./lib";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "  ok  " : " FAIL "} ${name}${ok || !detail ? "" : `  →  ${detail}`}`); if (!ok) failed++; };
const refused = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { if (e instanceof Refusal) return e.message; throw e; } };
const b64 = (b: Buffer) => b.toString("base64url");
const pickRandom = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

const table = await setupTable({ label: "smoke", players: ["Ada", "Bo", "Cy", "Di", "Ed"], deck: ["werewolf", "tracker", "sage", "rustler", "farrier", "herald", "spooker", "augur", "herder", "sentry"], center: 5, timers: { dusk: 6, turn: 5, day: 30 } });
const [host, ...rest] = table.seats;
console.log(`room ${table.code}  MCP ${MCP_URL}`);

console.log("\nauthentication");
const anon = await rpc(null, "tools/list");
check("no key → 401 naming the protected-resource metadata", anon.status === 401 && (anon.headers.get("WWW-Authenticate") ?? "").includes("/.well-known/oauth-protected-resource/mcp"));
check("wrong key → 401", (await rpc("cwk_nope", "tools/list")).status === 401);
const init = await rpc(host.key, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
check("initialize names the seat and negotiates the version", init.body.result.protocolVersion === "2025-06-18" && init.body.result.instructions.includes(`Ada in room ${table.code}`));
check("a notification gets 202 and no body", (await fetch(MCP_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${host.key}` }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) })).status === 202);
check("GET /mcp → 405", (await fetch(MCP_URL)).status === 405);
check("a foreign browser origin is refused", (await fetch(MCP_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${host.key}`, Origin: "https://evil.example" }, body: "{}" })).status === 403);
const names = async (key: string) => ((await rpc(key, "tools/list")).body.result.tools as { name: string }[]).map(t => t.name);
const hostTools = await names(host.key), actTools = await names(rest[0].key);
check("host key lists game_start; play key does not", hostTools.includes("game_start") && !actTools.includes("game_start"));
check("no key lists connect_* or ui_* tools", ![...hostTools, ...actTools].some(n => /^(connect|ui)_/.test(n)));
check("play key calling a host tool is told what it needs", /host permission/.test((await refused(tool(rest[0].key, "game_start"))) ?? ""));
const readKey = ((await run("connect.createKey", rest[1].token, table.code, { permission: "read", label: "look only" })) as { key: string }).key;
check("look-only key can view but not chat", !!(await tool(readKey, "room_view")).version && /play permission/.test((await refused(tool(readKey, "chat_send", { text: "hi" }))) ?? ""));
check("a non-host cannot make a host key", await run("connect.createKey", rest[1].token, table.code, { permission: "host", label: "x" }).then(() => false, () => true));

console.log("\nOAuth 2.1 (dynamic registration, PKCE, rotating refresh)");
const meta = await (await fetch(`${SITE_URL}/.well-known/oauth-authorization-server`)).json();
const prm = await (await fetch(`${SITE_URL}/.well-known/oauth-protected-resource/mcp`)).json();
check("metadata documents agree", prm.resource === MCP_URL && prm.authorization_servers[0] === meta.issuer && meta.code_challenge_methods_supported[0] === "S256");
const redirectUri = "http://127.0.0.1:9/callback";
const reg = await (await fetch(meta.registration_endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "Smoke Client", redirect_uris: [redirectUri] }) })).json();
check("client registered", /^cwo_/.test(reg.client_id));
check("non-https redirect refused", (await fetch(meta.registration_endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redirect_uris: ["http://evil.example/cb"] }) })).status === 400);
const verifier = b64(randomBytes(32)), challenge = b64(createHash("sha256").update(verifier).digest());
const authorize = (extra = "") => fetch(`${meta.authorization_endpoint}?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256&scope=host&state=xyz&resource=${encodeURIComponent(MCP_URL)}${extra}`, { redirect: "manual" });
const sent = await authorize();
const request = /#\/connect\/(.+)$/.exec(sent.headers.get("Location") ?? "")?.[1] ?? "";
check("authorize sends the person to the app's Connect page", sent.status === 302 && request.startsWith("cwq_"));
check("unknown redirect URI is not redirected to", (await fetch(`${meta.authorization_endpoint}?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent("https://evil.example/cb")}&code_challenge=${challenge}&code_challenge_method=S256`, { redirect: "manual" })).status === 400);
const completion = b64(randomBytes(32));
// Cy (not host) approves; the client asked for host, so Cy can grant at most "act".
await run("connect.approve", rest[1].token, table.code, { request, permission: "act", completion });
check("another browser cannot collect the code", (await fetch(`${SITE_URL}/oauth/complete?request=${request}&completion=${b64(randomBytes(32))}`, { redirect: "manual" })).status === 403);
const back = new URL((await fetch(`${SITE_URL}/oauth/complete?request=${request}&completion=${completion}`, { redirect: "manual" })).headers.get("Location")!);
const code = back.searchParams.get("code")!;
check("approving browser is sent back with code, state and iss", back.origin + back.pathname === redirectUri && !!code && back.searchParams.get("state") === "xyz" && back.searchParams.get("iss") === meta.issuer);
const tokenCall = (body: Record<string, string>) => fetch(meta.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
check("wrong PKCE verifier is refused", (await tokenCall({ grant_type: "authorization_code", code, client_id: reg.client_id, redirect_uri: redirectUri, code_verifier: b64(randomBytes(32)) })).status === 400);
const tok = await (await tokenCall({ grant_type: "authorization_code", code, client_id: reg.client_id, redirect_uri: redirectUri, code_verifier: verifier })).json();
check("code exchanged for access and refresh tokens", tok.token_type === "Bearer" && tok.scope === "act" && tok.room_code === table.code && tok.expires_in === 3600);
const seen = await tool<{ you: { name: string } }>(tok.access_token, "room_view");
check("the access token acts as the approving player", seen.you.name === "Cy");
const fresh = await (await tokenCall({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: reg.client_id })).json();
check("refresh rotates: new token works, old access token does not", !!(await tool(fresh.access_token, "room_view")).version && (await rpc(tok.access_token, "tools/list")).status === 401);
check("replaying the code revokes nothing it should not, and is refused", (await tokenCall({ grant_type: "authorization_code", code, client_id: reg.client_id, redirect_uri: redirectUri, code_verifier: verifier })).status === 400);
await tokenCall({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: reg.client_id });
check("replaying a retired refresh token revokes the grant", (await rpc(fresh.access_token, "tools/list")).status === 401);

console.log("\na whole game over MCP, random players");
interface V { version: string; phase: string; you: { seat: number; dealt?: { name: string } }; yourNightSteps?: { step: string; status: string; choices?: { kind: string; targetsNeeded?: number; legalTargets?: { slot: unknown }[] }[] }[]; learned?: string[]; players: { seat: number; you: boolean; name: string }[]; chat: { text: string; from: string }[]; shownToEveryone?: unknown[]; result?: { headline: string; nightLog: string[]; seats: { name: string; dealt: string; endedHolding: string; won: boolean }[] }; night?: { now: { role: string; secondsLeft: number } }; day?: unknown }
const rules = await tool<{ rules: string; rolesInThisDeck: unknown[] }>(host.key, "rules_read");
check("rules_read explains the game and this deck", rules.rules.includes("night_planStep") && rules.rolesInThisDeck.length === 10);
check("chat works in the lobby", (await tool(host.key, "chat_send", { text: "Good luck all." })).ok === true);
await tool(host.key, "game_start");
check("chat is refused at night, with the reason", (await refused(tool(rest[0].key, "chat_send", { text: "psst" }))) === "The table is silent at night.");
// Everyone queues what they can during dusk; Ed deliberately decides nothing, to exercise the forced random move.
for (const s of table.seats) {
  const v = await tool<V>(s.key, "room_view");
  if (s.name === "Ed") continue;
  for (const step of v.yourNightSteps ?? []) {
    const choice = step.choices && pickRandom(step.choices);
    if (!choice) continue;
    const decision = choice.kind === "pick" ? { kind: "pick", targets: [...choice.legalTargets!].sort(() => Math.random() - 0.5).slice(0, choice.targetsNeeded).map(t => t.slot) } : { kind: choice.kind };
    await tool(s.key, "night_planStep", { step: step.step, plan: { branches: [], otherwise: decision } });
  }
}
const dealt = await Promise.all(table.seats.map(async s => `${s.name}=${(await tool<V>(s.key, "room_view")).you.dealt!.name}`));
console.log(`       dealt: ${dealt.join(", ")}`);
let v = await tool<V>(host.key, "room_view"), waits = 0;
while (v.phase === "night") { const w = await tool<{ version: string; changed: boolean }>(host.key, "room_wait", { version: v.version, seconds: 20 }); waits++; v = await tool<V>(host.key, "room_view"); if (!w.changed) break; }
check(`room_wait carried the host through the night (${waits} waits)`, v.phase === "day");
for (const s of table.seats) { const mine = await tool<V>(s.key, "room_view"); console.log(`       ${s.name} learned: ${(mine.learned ?? []).join(" | ") || "(nothing)"}`); }
await tool(rest[0].key, "chat_send", { text: "I am a simple Centaur, honest." });
check("chat is visible to others in the day", (await tool<V>(host.key, "room_view")).chat.some(m => m.text.includes("simple Centaur") && m.from === "Bo"));
check("voting for yourself is refused", (await refused(tool(host.key, "day_vote", { seat: v.you.seat }))) === "You cannot vote for yourself.");
for (const s of table.seats) { const mine = await tool<V>(s.key, "room_view"); await tool(s.key, "day_vote", { seat: pickRandom(mine.players.filter(p => !p.you)).seat }); }
v = await tool<V>(host.key, "room_view");
check("the day ends when everyone has voted", v.phase === "ended" && !!v.result);
console.log(`       ${v.result!.headline}`);
for (const line of v.result!.nightLog) console.log(`       ${line}`);
await tool(host.key, "game_playAgain");
check("host returns the table to the lobby", (await tool<V>(host.key, "room_view")).phase === "lobby");

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
