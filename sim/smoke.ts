/**
 * End-to-end check of the assistant interface against a running server: authentication (pasted key and the full OAuth
 * 2.1 code flow), grants, and one whole game played only through MCP tools by scripted players who choose at random.
 *   npx tsx sim/smoke.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { MCP_URL, Refusal, rpc, run, setupTable, SITE_URL, token, tool, view } from "./lib";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "  ok  " : " FAIL "} ${name}${ok || !detail ? "" : `  →  ${detail}`}`); if (!ok) failed++; };
const refused = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { if (e instanceof Refusal) return e.message; throw e; } };
const b64 = (b: Buffer) => b.toString("base64url");

// A play-test table with a fixed deal, so every new mechanic is exercised on purpose: the Moon-Thief (Ada), Glamour
// (Bo), Sage (Cy), Biter (Di) and Eavesdropper (Ed, who decides nothing and gets forced random moves); in the centre the
// Herald, Forger, Cuckoo (its egg is laid at random at dawn), Sporeling and Elderbark.
const DECK = ["moonthief", "glamour", "sage", "biter", "eavesdropper", "herald", "forger", "cuckoo", "sporeling", "elderbark"];
const table = await setupTable({ label: "smoke", players: ["Ada", "Bo", "Cy", "Di", "Ed"], deck: DECK, center: 5, timers: { dusk: 15, turn: 5, day: 60 }, playtest: true });
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

console.log("\nrule settings and the play-test hooks");
check("the deck is refused until the Moon-Thief table size allows 5 players", /Moon-Thief needs 7/.test((await refused(tool(host.key, "game_start"))) ?? ""));
check("a bad rule value is refused with the reason", /one of/.test((await refused(tool(host.key, "setup_setRule", { rule: "census", value: "most" }))) ?? ""));
await tool(host.key, "setup_setRule", { rule: "thiefMinPlayers", value: 5 });
const ruleView = await tool<{ table: { rules: { rule: string; value: unknown; means: string }[] } }>(rest[0].key, "room_view");
check("every player sees the table rules with what they mean", ruleView.table.rules.find(r => r.rule === "thiefMinPlayers")?.value === 5 && ruleView.table.rules.find(r => r.rule === "bloodPrice")?.means.includes("more Werewolves than Centaurs") === true);
check("the play-test hooks are not tools for a play key", !actTools.includes("setup_fixDeal") && !actTools.includes("game_abandon") && hostTools.includes("setup_fixDeal"));
const plain = token();
const { code: plainCode } = (await run("room.create", plain, undefined, { name: "Zed" })) as { code: string };
check("an ordinary table cannot fix the deal", await run("setup.fixDeal", plain, plainCode, { seed: 1 }).then(() => false, e => /play-test table/.test(String(e))));
await run("setup.fixDeal", host.token, table.code, { seats: table.seats.map(s => s.id), cards: DECK });
const hostApp = await view(table.code, host.token), boApp = await view(table.code, rest[0].token);
check("everyone sees the play-test badge; only the host sees the fixed deal", hostApp!.playtest === true && boApp!.playtest === true && !!hostApp!.settings.fixedDeal?.cards && !boApp!.settings.fixedDeal && boApp!.fixedDeal === true);

console.log("\na whole game over MCP");
interface Step { step: string; status: string; legalRoles: { id: string }[] | null; choices?: { kind: string; targetsNeeded?: number; legalTargets?: { slot: unknown }[] }[] }
interface V {
  version: string; phase: string; chatCount: number; table: unknown; you: { seat: number; dealt?: { id: string; name: string }; status?: { bitten?: { by: string }; winsBy: string } };
  yourNightSteps: Step[] | null; learned: string[] | null; players: { seat: number; you: boolean; name: string; label: string }[]; chat: { n: number; text: string; from: string }[];
  proclamations: unknown[] | null; marks: { what: string; seat: number }[] | null; night: { now: unknown; yourTurn: { state: string; startsInSeconds?: number } } | null;
  day: { yourSwap: unknown; warning: string | null } | null;
  result: { headline: string; nightLog: string[]; daySwap: { swapped: string[] } | null; seats: { name: string; dealt: string; endedHolding: string; endedOnTeam: string; won: boolean; why: string; bitten: boolean }[] } | null;
}
const rules = await tool<{ rules: string; rolesInThisDeck: unknown[]; thisTable: { ruleSettings: unknown[]; caveats: string[] } }>(host.key, "rules_read");
check("rules_read explains the resolution order, this deck, its rules and its caveats", rules.rules.includes("How the game is decided") && rules.rolesInThisDeck.length === 10 && rules.thisTable.ruleSettings.length >= 8 && rules.thisTable.caveats.some(c => c.includes("Glamour")));
check("chat works in the lobby", (await tool(host.key, "chat_send", { text: "Good luck all." })).ok === true);
await tool(host.key, "game_start");
const [ada, bo, cy, di, ed] = table.seats;
const hostDeal = (await view(table.code, host.token))!.game!.playtestDeal;
check("the host's app view shows the fixed deal; nobody else's does", JSON.stringify(hostDeal?.dealt) === JSON.stringify(DECK.slice(0, 5)) && (await view(table.code, bo.token))!.game!.playtestDeal === null);
check("chat is refused at night, with the reason", (await refused(tool(bo.key, "chat_send", { text: "psst" }))) === "The table is silent at night.");
check("the day swap is refused at night, with the reason", /Only during the day/.test((await refused(tool(ada.key, "day_queueSwap", { a: 1, b: 2 }))) ?? ""));
const keys = Object.fromEntries((await Promise.all(table.seats.map(async s => [s.name, await tool<V>(s.key, "room_view")] as const))));
check("every top-level key is present in every phase", ["learned", "yourNightSteps", "night", "proclamations", "marks", "day", "result"].every(k => k in keys.Bo));
check("the night counts down to your own turn", keys.Cy.night?.yourTurn.state === "upcoming" && (keys.Cy.night?.yourTurn.startsInSeconds ?? 0) > 0);
const glam = keys.Bo.yourNightSteps!.find(s => s.step === "glamour")!, listen = keys.Ed.yourNightSteps!.find(s => s.step === "listen")!;
check("a naming step lists its legal roles", glam.legalRoles!.some(r => r.id === "sage") && listen.legalRoles!.every(r => !["glamour", "biter", "moonthief", "eavesdropper"].includes(r.id)) && listen.choices![0].kind === "name");
check("a role the step cannot name is refused with the legal ones", /cannot name/.test((await refused(tool(bo.key, "night_planStep", { step: "glamour", plan: { branches: [], otherwise: { kind: "pick", targets: [{ k: "p", i: 1 }], role: "moth" } } }))) ?? ""));
await tool(bo.key, "night_planStep", { step: "glamour", plan: { branches: [], otherwise: { kind: "pick", targets: [{ k: "p", i: 1 }], role: "sage" } } });
await tool(cy.key, "night_planStep", { step: "read", plan: { branches: [], otherwise: { kind: "pick", targets: [{ k: "p", i: 1 }] } } });
await tool(di.key, "night_planStep", { step: "sniff", plan: { branches: [], otherwise: { kind: "pick", targets: [{ k: "p", i: 2 }] } } });
await tool(di.key, "night_planStep", { step: "bite", plan: { branches: [{ roles: ["sage", "herald"], decision: { kind: "do" } }], otherwise: { kind: "skip" } } });
let v = await tool<V>(host.key, "room_view", { compact: true }), waits = 0;
check("compact view leaves out the deck, rules and timetable", v.table === null);
while (v.phase === "night") { const w = await tool<{ version: string; changed: boolean }>(host.key, "room_wait", { version: v.version, until: "phase", seconds: 25 }); waits++; v = await tool<V>(host.key, "room_view", { compact: true }); if (!w.changed && waits > 6) break; }
check(`room_wait { until: "phase" } carried the host to the day (${waits} waits)`, v.phase === "day");
const views = Object.fromEntries((await Promise.all(table.seats.map(async s => [s.name, await tool<V>(s.key, "room_view")] as const))));
for (const s of table.seats) console.log(`       ${s.name} (${views[s.name].you.dealt!.name}) learned: ${(views[s.name].learned ?? []).join(" | ") || "(nothing)"}`);
check("the glamour fooled the Sage's read", views.Cy.learned!.some(l => /looked at Bo \(seat 1\)'s card: Sage/.test(l)));
check("the Biter's conditional bite took, and the Sage is told at dawn by whom", views.Cy.learned!.some(l => /you were bitten by Di \(seat 3\)/.test(l)) && !!views.Cy.you.status?.bitten && /Werewolf team/.test(views.Cy.you.status!.winsBy));
check("the plan's branch is confirmed in the Biter's journal", views.Di.learned!.some(l => /plan for having seen Sage: the branch for Sage/.test(l)));
check("the Eavesdropper's forced choice ran", views.Ed.learned!.some(l => /overheard|listened/.test(l)));
check("the unheld Cuckoo's egg is public at dawn", views.Bo.marks?.length === 1 && views.Bo.marks[0].what === "The egg");
check("nobody else learns of the glamour or the bite", !views.Ada.learned!.some(l => /glamour|bit/i.test(l)) && !views.Ed.learned!.some(l => /truly/.test(l)));
check("the day warns about the Sporeling's curse", /Sporeling/.test(views.Bo.day?.warning ?? ""));
check("only the player dealt the Moon-Thief may queue a swap", /Moon-Thief/.test((await refused(tool(bo.key, "day_queueSwap", { a: 2, b: 3 }))) ?? ""));
check("the Moon-Thief cannot swap their own card", /own card/.test((await refused(tool(ada.key, "day_queueSwap", { a: 0, b: 2 }))) ?? ""));
await tool(ada.key, "day_queueSwap", { a: 1, b: 2 });
check("the queued swap is shown to its owner only", !!(await tool<V>(ada.key, "room_view")).day?.yourSwap && (await tool<V>(bo.key, "room_view")).day?.yourSwap === null);
// room_wait { until: "chat" } returns when someone talks, not on votes.
const before = await tool<V>(cy.key, "room_view", { compact: true });
const waiting = tool<{ changed: boolean; chatCount: number }>(cy.key, "room_wait", { version: before.version, until: "chat", seconds: 20 });
await tool(di.key, "day_vote", { seat: 2 });
await tool(bo.key, "chat_send", { text: "I am a simple Centaur, honest. Cy (seat 2) is lying." });
const woke = await waiting;
check("room_wait { until: \"chat\" } wakes on a new message", woke.changed && woke.chatCount === before.chatCount + 1);
const since = await tool<V>(cy.key, "room_view", { compact: true, chatSince: before.chatCount });
check("room_view { chatSince } returns only the new message, numbered", since.chat.length === 1 && since.chat[0].n === before.chatCount && since.chat[0].from === "Bo (seat 1)");
check("voting for yourself is refused", (await refused(tool(host.key, "day_vote", { seat: 0 }))) === "You cannot vote for yourself.");
for (const [s, target] of [[ada, 2], [bo, 2], [cy, 1], [ed, 2]] as const) await tool(s.key, "day_vote", { seat: target });
v = await tool<V>(host.key, "room_view");
check("the day ends when everyone has voted", v.phase === "ended" && !!v.result);
console.log(`       ${v.result!.headline}`);
for (const s of v.result!.seats) console.log(`       ${s.name}: dealt ${s.dealt}, held ${s.endedHolding}, ${s.endedOnTeam}. ${s.why}`);
for (const line of v.result!.nightLog) console.log(`       ${line}`);
check("the result says, per seat, dealt, held, team, won and why", v.result!.seats.every(s => s.dealt && s.endedHolding && s.endedOnTeam && /^(Won|Lost): /.test(s.why)));
check("the Moon-Thief's swap happened before the count: Bo and Cy traded cards", v.result!.daySwap?.swapped.join() === "Bo (seat 1),Cy (seat 2)" && v.result!.seats[1].endedHolding === "Sage" && v.result!.seats[2].endedHolding === "Glamour");
check("the bitten Sage ended on the Werewolf team", v.result!.seats[2].bitten && v.result!.seats[2].endedOnTeam === "Werewolf team");
check("the post-game log reveals the glamour's truth", v.result!.nightLog.some(l => /truly Glamour/.test(l)));
await tool(host.key, "game_playAgain");
check("host returns the table to the lobby", (await tool<V>(host.key, "room_view")).phase === "lobby");
await tool(host.key, "game_start");
await tool(host.key, "game_abandon");
check("the host of a play-test table can abandon a round", (await tool<V>(host.key, "room_view")).phase === "lobby");

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
