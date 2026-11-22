/**
 * Plays a tournament with AI players: one headless `claude` process per seat, each connected DIRECTLY to the game's
 * MCP server with that player's own key, exactly as a person would connect their assistant.
 *
 *   npx tsx sim/arena.ts <tournament.json> [--out sim/runs/<name>] [--concurrency 2] [--only A-information#1,B-movement]
 *                        [--model opus] [--effort medium] [--timers dusk,turn,day[,vote]] [--direct] [--dry]
 *
 * Every seat defaults to Opus (medium effort). A table may carry:
 *   "replays": R            expands into R tables labelled <label>#1..#R (fresh agents each time)
 *   "redeal": "wolfDealt" | { "dealtAnyOf": ["werewolf", "tag:wolf", "team:werewolf", ...] }
 *                           the runner deals before any agent exists and redeals until a player was dealt a match
 *   "scenario": { "cards": [...], "seed"?: n, "plans": { "<player name>": [{ "step": "...", "plan": {...} }] } }
 *                           FIXED SCENARIO: the deal is fixed (cards[i] to the i-th player of "players", the rest to
 *                           the centre, in order), the runner queues every seat's night plan itself during Dusk, and
 *                           the agents join already holding it and cannot change it (night_planStep/night_clearStep are
 *                           not given to them). Only the day can differ between replays. Each result records a
 *                           scenario fingerprint (the deal and the night log) so replays can be checked to match.
 *
 * The tournament file is the one tables.ts reads, plus optional `agents` (at top level, or per table to override):
 *   "agents": { "model": "sonnet", "effort": "medium",
 *               "seats":  { "Alder": { "model": "opus", "effort": "high" } },          // by player name
 *               "byTeam": { "werewolf": { "model": "haiku" }, "centaur": { "model": "opus" } } }
 * With `byTeam` the runner starts the game itself and launches each agent after the deal, configured by the team of
 * the card it was DEALT (agents then skip the lobby). Otherwise the agents play the lobby (ready, host starts).
 *
 * Isolation (the point of the scaffold): each agent runs with NO built-in tools (--tools ""), only this MCP server
 * (--strict-mcp-config), no settings/CLAUDE.md/skills/slash commands, a replacement system prompt (arena-player.md),
 * from an empty working directory and an empty HOME outside the repo, with an environment scrubbed to what the API
 * connection needs. The tool list each agent was given is recorded from its init event and checked.
 *
 * Transport: by default agents reach the server through sim/mcp-shim.ts, a pass-through that forwards every call with
 * the agent's own key and serves only `room_wait` itself (by polling the server's room_view), because the server's
 * room_wait holds one of the local backend's ~4 HTTP action slots for up to 25 s and a table of waiting agents starves
 * every other call. --direct connects agents to the server's /mcp with no shim.
 *
 * Writes, per table, under <out>/<label>/: table.json (room, keys), timeline.json (phase times, when each seat's
 * night steps were all queued, votes), result.json (the host's view after the game: result, chat, log), and per seat
 * <name>.jsonl (full stream transcript), <name>.debrief.json, plus agents.json (model, cost, tokens, turns, wall time).
 * <out>/tables.json lists every table, so `npx tsx sim/collect.ts <out>` works too. Then `npx tsx sim/analyze.ts <out>`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { basename, resolve } from "node:path";
import { tmpdir } from "node:os";
import { nightTurns } from "../shared/engine";
import { ROLE } from "../shared/roles";
import { MCP_URL, run, setupTable, tool, type Table, type TableConfig } from "./lib";
import { startShim } from "./mcp-shim";

// ── configuration ──
interface AgentSpec { model?: string; effort?: string }
interface AgentsConfig extends AgentSpec { seats?: Record<string, AgentSpec>; byTeam?: Record<string, AgentSpec> }
/** redeal "wolfDealt": the runner starts each game itself and, before launching any agent, abandons and reopens the table until at least one wolf card was dealt to a player. rules/seed/playtest: see sim/lib.ts TableConfig. */
type Redeal = "wolfDealt" | { dealtAnyOf: string[] };
/** seed: the night seed (every random draw of the night and the count). */
interface Scenario { cards: string[]; seed?: number; plans: Record<string, { step: string; plan: unknown }[]> }
interface TableSpec { label: string; deck: string[]; center: number; players: string[]; timers?: TableConfig["timers"]; agents?: AgentsConfig; redeal?: Redeal; rules?: TableConfig["rules"]; seed?: number; playtest?: boolean; scenario?: Scenario; replays?: number }
/** prompt: another player-prompt file in sim/ (default arena-player.md). rules: rule variants for every table (a table's own rules override them). */
interface Tournament { timers: TableConfig["timers"]; agents?: AgentsConfig; redeal?: Redeal; prompt?: string; rules?: TableConfig["rules"]; tables: TableSpec[] }

const argv = process.argv.slice(2);
const flag = (name: string, dflt?: string) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt; };
const file = argv[0];
if (!file || file.startsWith("--")) { console.error("usage: tsx sim/arena.ts <tournament.json> [--out dir] [--concurrency n] [--only labels] [--model m] [--effort e]"); process.exit(2); }
const spec = JSON.parse(readFileSync(file, "utf8")) as Tournament;
const OUT = resolve(flag("out", `sim/runs/${basename(file, ".json")}`)!);
const CONCURRENCY = Number(flag("concurrency", "2"));
const ONLY = flag("only")?.split(",");
const DEFAULT: Required<AgentSpec> = { model: flag("model", spec.agents?.model ?? "opus")!, effort: flag("effort", spec.agents?.effort ?? "medium")! };
const TIMERS = flag("timers") ? (([dusk, turn, day, vote]) => ({ dusk, turn, day, ...(vote ? { vote } : {}) }))(flag("timers")!.split(",").map(Number)) : undefined; // --timers dusk,turn,day[,vote] overrides the file
const LOBBY_MAX = 100; // seconds before the runner starts a game the host agent has not started
const DEBRIEF_MAX = 180; // seconds after the game ends for agents to finish their debrief
const RELAUNCHES = 2; // times an agent that stops before the game ends is resumed
const PROMPT_FILE = spec.prompt ?? "arena-player.md";
const SYSTEM = readFileSync(new URL(`./${PROMPT_FILE}`, import.meta.url), "utf8");
const PROMPT_VERSION = createHash("sha256").update(SYSTEM).digest("hex").slice(0, 12); // recorded per table in run.json
const SANDBOX = resolve(tmpdir(), "cw-arena", basename(OUT)); // working dirs and HOMEs of the agents: outside the repo
const ALLOWED = "mcp__werewolf__*";
const DENIED = ["room_create", "room_join", "room_leave", "game_abandon", "day_endDiscussion"].map(t => `mcp__werewolf__${t}`);
const NIGHT_TOOLS = ["night_planStep", "night_clearStep"].map(t => `mcp__werewolf__${t}`);
const ENV_KEEP = ["PATH", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE"];

const DEBRIEF_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["dealt", "believedFinalCard", "finalCard", "won", "nightPlan", "planRanAsIntended", "claims", "vote", "changedVote", "decidedBy", "tension", "tensionWhy", "fun", "funWhy", "confusions"],
  properties: {
    dealt: { type: "string" }, believedFinalCard: { type: "string" }, finalCard: { type: "string" }, won: { type: "boolean" },
    nightPlan: { type: "string" }, planRanAsIntended: { type: "boolean" },
    claims: { type: "array", items: { type: "object", additionalProperties: false, required: ["claim", "wasTrue"], properties: { claim: { type: "string" }, wasTrue: { type: "boolean" } } } },
    vote: { type: "object", additionalProperties: false, required: ["seat", "name", "reasoning"], properties: { seat: { type: ["integer", "null"] }, name: { type: "string" }, reasoning: { type: "string" } } },
    changedVote: { type: "boolean" }, decidedBy: { type: "string" },
    tension: { type: "integer", minimum: 1, maximum: 5 }, tensionWhy: { type: "string" }, fun: { type: "integer", minimum: 1, maximum: 5 }, funWhy: { type: "string" },
    confusions: { type: "array", items: { type: "string" } },
  },
};

// ── processes: every child is its own process group, killed on any exit of the runner ──
const live = new Set<ChildProcess>();
const killAll = (sig: NodeJS.Signals = "SIGKILL") => { for (const c of live) { try { process.kill(-c.pid!, sig); } catch { /* gone */ } } };
process.on("exit", () => killAll());
for (const s of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.on(s, () => { console.log(`\n${s}: stopping every agent`); killAll(); process.exit(130); });
process.on("uncaughtException", e => { console.error(e); killAll(); process.exit(1); });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const log = (label: string, msg: string) => console.log(`${new Date().toISOString().slice(11, 19)} [${label}] ${msg}`);

interface SeatRun { name: string; seat?: number; dealt?: string; model: string; effort: string; segments: number; exits: (number | null)[]; killed: boolean; startedAt: number; endedAt?: number; sessionId?: string; tools?: string[]; isolationOk?: boolean; costUsd: number; turns: number; toolCalls: number; tokens: { input: number; output: number; cacheRead: number; cacheWrite: number }; debrief?: unknown; error?: string }

function agentSpec(cfg: AgentsConfig | undefined, name: string, team?: string): Required<AgentSpec> {
  const pick = { ...DEFAULT };
  const apply = (s?: AgentSpec) => { if (s?.model) pick.model = s.model; if (s?.effort) pick.effort = s.effort; };
  apply(cfg); if (team) apply(cfg?.byTeam?.[team]); apply(cfg?.seats?.[name]);
  if (flag("model")) pick.model = flag("model")!; if (flag("effort")) pick.effort = flag("effort")!;
  return pick;
}

/** Runs one agent segment (a fresh session, or a resume); resolves when the process exits. */
function launch(dir: string, sr: SeatRun, key: string, prompt: string, deadline: () => number, fixedNight = false): Promise<number | null> {
  const box = resolve(SANDBOX, basename(dir), sr.name);
  mkdirSync(`${box}/home`, { recursive: true }); mkdirSync(`${box}/work`, { recursive: true });
  const env: Record<string, string> = { HOME: `${box}/home` };
  for (const k of ENV_KEEP) if (process.env[k]) env[k] = process.env[k]!;
  const mcp = JSON.stringify({ mcpServers: { werewolf: { type: "http", url: AGENT_MCP_URL, headers: { Authorization: `Bearer ${key}` } } } });
  const args = ["-p", prompt, "--model", sr.model, "--effort", sr.effort, "--output-format", "stream-json", "--verbose",
    "--system-prompt", SYSTEM, "--json-schema", JSON.stringify(DEBRIEF_SCHEMA), "--tools", "", "--strict-mcp-config", "--mcp-config", mcp,
    "--allowedTools", ALLOWED, "--disallowedTools", ...DENIED, ...(fixedNight ? NIGHT_TOOLS : []), "--setting-sources", "", "--disable-slash-commands",
    ...(sr.sessionId ? ["--resume", sr.sessionId] : [])];
  const child = spawn("claude", args, { cwd: `${box}/work`, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  live.add(child);
  sr.segments++;
  const out = createWriteStream(`${dir}/${sr.name}.jsonl`, { flags: "a" }), err = createWriteStream(`${dir}/${sr.name}.stderr`, { flags: "a" });
  let buf = "";
  child.stdout!.on("data", (d: Buffer) => {
    buf += d.toString();
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      let ev: any; try { ev = JSON.parse(line); } catch { out.write(line + "\n"); continue; }
      out.write(JSON.stringify({ _t: now(), ...ev }) + "\n"); // arrival time, for measuring pace
      if (ev.type === "system" && ev.subtype === "init") {
        sr.sessionId = ev.session_id; sr.tools = ev.tools;
        sr.isolationOk = ev.tools.every((t: string) => t === "StructuredOutput" || t.startsWith("mcp__werewolf__")) && (ev.mcp_servers ?? []).every((m: { name: string }) => m.name === "werewolf");
        if (!sr.isolationOk) { log(basename(dir), `ISOLATION BREACH for ${sr.name}: ${ev.tools.join(",")}; killing`); try { process.kill(-child.pid!, "SIGKILL"); } catch { /* */ } }
      }
      if (ev.type === "assistant") for (const c of ev.message?.content ?? []) if (c.type === "tool_use") { sr.toolCalls++; if (c.name === "StructuredOutput") sr.debrief = c.input; }
      if (ev.type === "result") {
        sr.costUsd += ev.total_cost_usd ?? 0; sr.turns += ev.num_turns ?? 0;
        const u = ev.usage ?? {};
        sr.tokens.input += u.input_tokens ?? 0; sr.tokens.output += u.output_tokens ?? 0; sr.tokens.cacheRead += u.cache_read_input_tokens ?? 0; sr.tokens.cacheWrite += u.cache_creation_input_tokens ?? 0;
        if (ev.structured_output) sr.debrief = ev.structured_output;
        if (ev.is_error) sr.error = String(ev.result ?? ev.subtype);
      }
    }
  });
  child.stderr!.pipe(err);
  const timer = setInterval(() => { if (now() > deadline()) { sr.killed = true; log(basename(dir), `${sr.name} timed out: killing`); try { process.kill(-child.pid!, "SIGTERM"); } catch { /* */ } setTimeout(() => { try { process.kill(-child.pid!, "SIGKILL"); } catch { /* */ } }, 5000); } }, 2000);
  return new Promise(res => child.on("exit", code => { clearInterval(timer); live.delete(child); out.end(); err.end(); res(code); }));
}

interface View { version: string; phase: string; you: { seat: number | null; dealt?: { id: string; team: string } }; players: { seat: number; name: string }[]; chat: { from: string; text: string; phase: string }[]; yourNightSteps?: { step: string; status: string }[]; night?: { now: { role: string } | null }; day?: { ready: string[] } | null; vote?: { haveVoted: string[] } | null; result?: { nightLog: string[]; seats: { dealt: string }[]; dealtCentre: string[]; scenario?: { fingerprint: string } } | null }

async function playTable(t: TableSpec) {
  const label = t.label, dir = `${OUT}/${label.replace(/[^\w#-]/g, "_")}`;
  if (existsSync(`${dir}/result.json`)) { log(label, "already played: skipping"); return; }
  mkdirSync(dir, { recursive: true });
  const timers = TIMERS ?? t.timers ?? spec.timers, cfg = t.agents ?? spec.agents;
  const redeal = t.scenario ? undefined : t.redeal ?? spec.redeal, prestart = !!cfg?.byTeam || !!redeal || !!t.scenario;
  const config: TableConfig = { label, deck: t.deck, center: t.center, players: t.players, timers, rules: { ...spec.rules, ...t.rules }, seed: t.seed, playtest: t.playtest };
  let table: Table = await setupTable(config);
  if (t.scenario) await fixScenario(table, t.scenario);
  // With a pre-start, the runner deals before any agent exists; with redeal it keeps only deals that put a wolf card in a player's hand.
  const dealt: Record<string, { id: string; team: string }> = {};
  let discarded = 0;
  if (prestart) for (;;) {
    await run("game.start", table.seats[0].token, table.code);
    for (const s of table.seats) dealt[s.name] = (await tool<View>(s.key, "room_view")).you.dealt!;
    if (!redeal || Object.values(dealt).some(d => matchesRedeal(redeal, d.id))) break;
    if (++discarded > 40) throw new Error("40 deals without a match for the redeal rule");
    log(label, `room ${table.code}: no player dealt ${JSON.stringify(redeal)}, discarded`);
    table = await setupTable(config);
  }
  if (t.scenario) await queuePlans(label, table, t.scenario);
  writeFileSync(`${dir}/table.json`, JSON.stringify(table, null, 1));
  writeFileSync(`${dir}/run.json`, JSON.stringify({ tournament: file, prompt: PROMPT_VERSION, promptFile: PROMPT_FILE, redeal: redeal ?? null, discardedDeals: discarded, scenario: t.scenario ?? null, timers, transport: DIRECT ? "direct" : "shim", agents: cfg ?? null, default: DEFAULT, cli: argv.join(" "), at: new Date().toISOString() }, null, 1));
  registerTable(table);
  const host = table.seats[0];
  const turns = nightTurns(t.deck).length;
  const t0 = now(), budget = (LOBBY_MAX + timers.dusk + turns * timers.turn + timers.day + (timers.vote ?? 20) + DEBRIEF_MAX + 60) * 1000;
  log(label, `room ${table.code}: ${t.players.length} players, ${turns} night turns, budget ${Math.round(budget / 1000)}s`);
  const timeline: Record<string, unknown> & { phases: Record<string, number>; queuedAt: Record<string, number | null>; votes: { at: number; who: string[] }[]; ready: { at: number; who: string[] }[]; messagesAt: number[] } = { code: table.code, startedAt: t0, phases: {}, queuedAt: {}, votes: [], ready: [], messagesAt: [] };
  let endedAt: number | null = null;
  const deadline = () => Math.min(t0 + budget, endedAt ? endedAt + DEBRIEF_MAX * 1000 : Infinity);

  const runs: SeatRun[] = [];
  const startAgent = (seat: Table["seats"][number], spec: Required<AgentSpec>, started: boolean) => {
    const fixedNight = !!t.scenario;
    const sr: SeatRun = { name: seat.name, model: spec.model, effort: spec.effort, segments: 0, exits: [], killed: false, startedAt: now(), costUsd: 0, turns: 0, toolCalls: 0, tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
    runs.push(sr);
    const first = `You are ${seat.name} at table ${table.code}${seat.host ? ", and you are the host" : ""}. ${started ? "The game has already started: skip the lobby step and go straight to the night." : "The game is in the lobby."}${fixedNight ? " Your night decisions were already made for you and queued (this table replays a fixed night): you cannot change them, so do not plan anything; just wait for the day. At day, `learned` tells you what you did and saw, and you play the day as your own." : ""} Play now, following your instructions, until the phase is ended; then give your debrief.`;
    return (async () => {
      let prompt = first;
      for (let i = 0; i <= RELAUNCHES; i++) {
        const code = await launch(dir, sr, seat.key, prompt, deadline, fixedNight);
        sr.exits.push(code);
        if (sr.killed || !sr.isolationOk && sr.tools) break;
        const phase = (await tool<View>(host.key, "room_view").catch(() => null))?.phase;
        if (phase === "ended" && sr.debrief) break;
        if (now() > deadline() - 20_000) break;
        log(label, `${sr.name} stopped (exit ${code}) in phase ${phase}${sr.debrief ? "" : ", no debrief"}: resuming`);
        prompt = phase === "ended" ? "The game has ended. Call room_view for the result, then give your debrief with StructuredOutput." : `The game is still in progress (phase ${phase}); your participation is not over. Call room_view and carry on following your instructions until the phase is ended, then give your debrief.`;
      }
      sr.endedAt = now();
    })();
  };

  const agents: Promise<void>[] = [];
  if (prestart) {
    for (const s of table.seats) { const d = dealt[s.name]; agents.push(startAgent(s, agentSpec(cfg, s.name, d.team.startsWith("Werewolf") ? "werewolf" : d.team.startsWith("Centaur") ? "centaur" : "wild"), true)); }
  } else for (const s of table.seats) agents.push(startAgent(s, agentSpec(cfg, s.name), false));

  // Watch the table through the host's view (and, at night, each seat's own view of its plan) to measure timing.
  let phase = "lobby", lastVotes = 0, lastMsgs = 0, lastReady = 0;
  const all = Promise.all(agents);
  let agentsDone = false; all.then(() => { agentsDone = true; });
  while (!agentsDone) {
    const v = await tool<View>(host.key, "room_view").catch(() => null);
    if (v) {
      if (v.phase !== phase) { phase = v.phase; timeline.phases[phase] = now() - t0; log(label, `phase ${phase} at ${Math.round((now() - t0) / 1000)}s`); if (phase === "ended") endedAt = now(); }
      if (phase === "lobby" && now() - t0 > LOBBY_MAX * 1000) { log(label, "host agent has not started the game: the runner starts it"); timeline.runnerStarted = true; await run("game.start", host.token, table.code).catch(e => log(label, String(e))); }
      if (phase === "night") for (const s of table.seats) {
        if (timeline.queuedAt[s.name]) continue;
        const mine = await tool<View>(s.key, "room_view").catch(() => null);
        if (!mine?.yourNightSteps) continue;
        if (mine.yourNightSteps.every(st => !st.status.startsWith("NOT DECIDED"))) timeline.queuedAt[s.name] = now() - t0;
      }
      const msgs = v.chat.filter(m => m.phase === "day").length;
      for (let i = lastMsgs; i < msgs; i++) timeline.messagesAt.push(now() - t0);
      lastMsgs = msgs;
      const ready = v.day?.ready ?? [];
      if (ready.length !== lastReady) { lastReady = ready.length; timeline.ready.push({ at: now() - t0, who: ready }); }
      const voted = v.vote?.haveVoted ?? [];
      if (voted.length !== lastVotes) { lastVotes = voted.length; timeline.votes.push({ at: now() - t0, who: voted }); }
      if (phase === "ended" && !timeline.result) { timeline.result = true; writeFileSync(`${dir}/result.json`, JSON.stringify(await tool(host.key, "room_view"), null, 1)); }
    }
    if (now() > t0 + budget + 30_000) { log(label, "table over budget: killing its agents"); break; }
    await Promise.race([all, sleep(3000)]);
  }
  for (const sr of runs) { if (sr.endedAt === undefined) sr.killed = true; }
  // A game that has not ended by now is finished by the host's "end the day" (absent votes are random).
  let v = await tool<View>(host.key, "room_view");
  if (v.phase === "day") { log(label, "day still open after every agent stopped: ending it"); timeline.runnerEndedDay = true; await run("day.endDiscussion", host.token, table.code); v = await tool<View>(host.key, "room_view"); }
  for (let i = 0; i < 40 && v.phase === "vote"; i++) { await sleep(3000); v = await tool<View>(host.key, "room_view"); }
  if (v.phase === "ended") { writeFileSync(`${dir}/result.json`, JSON.stringify(v, null, 1)); timeline.fingerprint = fingerprint(v); }
  else log(label, `table did not finish: phase ${v.phase}`);
  // Each seat's final view says which seat and card it had.
  for (const s of table.seats) {
    const sr = runs.find(r => r.name === s.name)!;
    const mine = await tool<View>(s.key, "room_view").catch(() => null);
    sr.seat = mine?.you.seat ?? undefined; sr.dealt = mine?.you.dealt?.id;
    if (sr.debrief) writeFileSync(`${dir}/${s.name}.debrief.json`, JSON.stringify(sr.debrief, null, 1));
  }
  timeline.endedAt = now() - t0;
  writeFileSync(`${dir}/timeline.json`, JSON.stringify(timeline, null, 1));
  writeFileSync(`${dir}/agents.json`, JSON.stringify(runs, null, 1));
  const cost = runs.reduce((a, r) => a + r.costUsd, 0);
  log(label, `done in ${Math.round((now() - t0) / 1000)}s, cost $${cost.toFixed(2)}, debriefs ${runs.filter(r => r.debrief).length}/${runs.length}${runs.some(r => r.killed) ? `, killed: ${runs.filter(r => r.killed).map(r => r.name).join(",")}` : ""}`);
}

/** Does a dealt role match the redeal rule? Entries: a role id, "tag:<tag>" or "team:<team>". */
function matchesRedeal(r: Redeal, id: string): boolean {
  if (r === "wolfDealt") return !!ROLE[id]?.tags.includes("wolf");
  return r.dealtAnyOf.some(m => m.startsWith("tag:") ? !!ROLE[id]?.tags.includes(m.slice(4) as never) : m.startsWith("team:") ? ROLE[id]?.team === m.slice(5) : id === m);
}
/** Fixed scenario: seat the players in the listed order and fix the exact deal (and seed) on the play-test table. */
async function fixScenario(table: Table, sc: Scenario) {
  if (sc.cards.length !== table.config.deck.length) throw new Error(`scenario has ${sc.cards.length} cards, deck has ${table.config.deck.length}`);
  await run("setup.fixDeal", table.seats[0].token, table.code, { seats: table.seats.map(s => s.id), cards: sc.cards, nightSeed: sc.seed ?? 1 });
}
/** Fixed scenario: queue every seat's night plan with that seat's own key during Dusk, and check each is queued. */
async function queuePlans(label: string, table: Table, sc: Scenario) {
  for (const s of table.seats) for (const p of sc.plans[s.name] ?? []) await tool(s.key, "night_planStep", { step: p.step, plan: p.plan });
  for (const s of table.seats) {
    const steps = (await tool<View>(s.key, "room_view")).yourNightSteps ?? [];
    const open = steps.filter(st => st.status.startsWith("NOT DECIDED"));
    if (open.length) throw new Error(`${label}: ${s.name} has undecided night steps ${open.map(o => o.step).join(",")}`);
  }
  log(label, `room ${table.code}: scenario deal fixed and every night plan queued`);
}
/** What identifies a scenario's night: the deal and the full night log (random draws included). */
function fingerprint(v: View): string {
  const r = v.result!;
  if (r.scenario?.fingerprint) return r.scenario.fingerprint; // the server's canonical scenario fingerprint (seeded replay hook)
  return createHash("sha256").update(JSON.stringify([r.seats.map(s => s.dealt), r.dealtCentre, r.nightLog.filter(l => !l.startsWith("[Day]"))])).digest("hex").slice(0, 16);
}

const opened: Table[] = existsSync(`${OUT}/tables.json`) ? JSON.parse(readFileSync(`${OUT}/tables.json`, "utf8")) : [];
function registerTable(t: Table) { const i = opened.findIndex(o => o.config.label === t.config.label); if (i >= 0) opened[i] = t; else opened.push(t); writeFileSync(`${OUT}/tables.json`, JSON.stringify(opened, null, 1)); }

mkdirSync(OUT, { recursive: true });
// Agents reach the server through the room_wait shim (see mcp-shim.ts) unless --direct.
const DIRECT = argv.includes("--direct");
const shim = DIRECT ? null : await startShim(MCP_URL);
const AGENT_MCP_URL = shim?.url ?? MCP_URL;
spec.tables = spec.tables.flatMap(t => (t.replays ? Array.from({ length: t.replays }, (_, k) => ({ ...t, label: `${t.label}#${k + 1}` })) : [t]));
const queue = spec.tables.filter(t => !ONLY || ONLY.some(o => t.label === o || t.label.replace(/#\d+$/, "") === o));
console.log(`${queue.length} table(s) → ${OUT}, ${CONCURRENCY} at a time, default agent ${DEFAULT.model}/${DEFAULT.effort}, MCP ${MCP_URL}${shim ? ` via room_wait shim ${shim.url}` : " (direct)"}`);
if (argv.includes("--dry")) process.exit(0);
let next = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (next < queue.length) { const t = queue[next++]; try { await playTable(t); } catch (e) { log(t.label, `FAILED: ${(e as Error).stack}`); } }
}));
console.log(`all tables done${shim ? ` (shim: ${shim.stats.waits} room_waits served, ${shim.stats.forwarded} calls forwarded)` : ""}`);
process.exit(0);
