/**
 * Reads a tournament played by arena.ts and reports, per deck (or deck/arm) and overall:
 * winners, wolves caught, moved cards, forced moves and votes, talk, claim honesty, what decided games, the
 * Werewolf team's wins and losses with the chat around the vote, agent cost and timing, and the agents' confusions.
 *   npx tsx sim/analyze.ts <outDir>
 * Writes <outDir>/analysis.json and prints a readable report.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { ROLE } from "../shared/roles";

const out = process.argv[2];
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "n/a");
const fp = (x: number) => (Number.isFinite(x) ? `${Math.round(100 * x)}%` : "n/a");
const roleId = (name: string) => Object.values(ROLE).find(r => r.name === name)?.id ?? name.toLowerCase();
const isWolf = (name: string) => ROLE[roleId(name)]?.tags.includes("wolf") ?? false;
const teamOf = (name: string) => ROLE[roleId(name)]?.team ?? "?";
const isWolfId = (id: string) => ROLE[id]?.tags.includes("wolf") ?? false;
const choose = (n: number, k: number): number => (k < 0 || k > n ? 0 : k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k);

interface Seat { seat: number; name: string; dealt: string; endedHolding: string; endedOnTeam: string; votedFor: string; voteWasRandom: boolean; votesReceived: number; eliminated: boolean; won: boolean }
interface Debrief { dealt: string; believedFinalCard: string; finalCard: string; won: boolean; nightPlan: string; planRanAsIntended: boolean; claims: { claim: string; wasTrue: boolean }[]; vote: { seat: number | null; name: string; reasoning: string }; changedVote: boolean; decidedBy: string; tension: number; tensionWhy: string; fun: number; funWhy: string; confusions: string[] }
interface Game {
  label: string; deck: string; code: string; players: number; center: number; cards: string[];
  headline: string; notes: string[]; winningTeam: string; eliminated: string[]; seats: Seat[]; centre: string[]; nightLog: string[];
  chat: { from: string; text: string; phase: string }[]; timeline: any; agents: any[]; debriefs: Record<string, Debrief>; run?: any; timers: unknown;
  branched: number; chosenMoves: number; planSteps: number;
}

const games: Game[] = [];
for (const d of readdirSync(out, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()) {
  const dir = `${out}/${d}`;
  if (!existsSync(`${dir}/result.json`)) { console.log(`${d}: no result`); continue; }
  const v = read(`${dir}/result.json`), table = read(`${dir}/table.json`);
  const debriefs: Record<string, Debrief> = {};
  // From the transcripts: plan steps queued, how many used conditional branches (last plan per step counts).
  const lastPlan: Record<string, unknown> = {};
  for (const s of table.seats) if (existsSync(`${dir}/${s.name}.jsonl`)) for (const l of readFileSync(`${dir}/${s.name}.jsonl`, "utf8").split("\n")) {
    let e: any; try { e = JSON.parse(l); } catch { continue; }
    if (e.type === "assistant") for (const c of e.message?.content ?? []) if (c.type === "tool_use" && c.name.endsWith("night_planStep")) lastPlan[`${s.name}/${c.input.step}`] = c.input.plan;
  }
  const plans = Object.values(lastPlan) as { branches?: unknown[] }[];
  for (const s of table.seats) if (existsSync(`${dir}/${s.name}.debrief.json`)) debriefs[s.name] = read(`${dir}/${s.name}.debrief.json`);
  games.push({
    label: table.config.label, deck: table.config.label.replace(/#\d+$/, ""), code: table.code, players: table.seats.length, center: table.config.center, cards: table.config.deck,
    ...v.result, chat: v.chat, timeline: existsSync(`${dir}/timeline.json`) ? read(`${dir}/timeline.json`) : {}, agents: existsSync(`${dir}/agents.json`) ? read(`${dir}/agents.json`) : [], debriefs,
    run: existsSync(`${dir}/run.json`) ? read(`${dir}/run.json`) : undefined, timers: table.config.timers,
    planSteps: plans.length, branched: plans.filter(p => (p?.branches ?? []).length > 0).length,
    // A player's card moved by a choice (Rustler trade, Farrier shoe, Spooker stampede through a seat), not a forced random move.
    chosenMoves: (v.result.nightLog as string[]).filter(l => !l.includes("random: out of time") && (/ swapped /.test(l) || / stampeded /.test(l)) && /'s card|their own card/.test(l)).length,
  });
}

const lines: string[] = [];
const say = (s = "") => { lines.push(s); console.log(s); };
const measures = (gs: Game[]) => {
  const withWolf = gs.filter(g => g.seats.some(s => isWolf(s.endedHolding)));
  const day = (g: Game) => g.chat.filter(m => m.phase === "day");
  return {
    games: gs.length,
    win: { centaur: gs.filter(g => g.winningTeam === "centaur").length, werewolf: gs.filter(g => g.winningTeam === "werewolf").length, nobody: gs.filter(g => g.winningTeam === "nobody").length },
    extraWins: gs.flatMap(g => g.notes).length,
    wolfAtTable: withWolf.length, wolfEliminated: withWolf.filter(g => g.seats.some(s => isWolf(s.endedHolding) && s.eliminated)).length,
    nobodyEliminated: gs.filter(g => !g.eliminated.length).length,
    eliminatedHeldMoved: gs.filter(g => g.seats.some(s => s.eliminated && s.dealt !== s.endedHolding)).length,
    movedPerGame: gs.reduce((a, g) => a + g.seats.filter(s => s.dealt !== s.endedHolding).length, 0) / (gs.length || 1),
    forcedMoves: gs.reduce((a, g) => a + g.nightLog.filter(l => l.includes("random: out of time")).length, 0),
    randomVotes: gs.reduce((a, g) => a + g.seats.filter(s => s.voteWasRandom).length, 0),
    messagesPerGame: gs.reduce((a, g) => a + day(g).length, 0) / (gs.length || 1),
  };
};

say(`# ${games.length} games from ${out}\n`);
say("## Per deck (or deck/arm)");
const decks = [...new Set(games.map(g => g.deck))];
const perDeck: Record<string, unknown> = {};
for (const deck of decks) {
  const gs = games.filter(g => g.deck === deck), m = measures(gs);
  perDeck[deck] = m;
  say(`\n### ${deck} (${m.games} games, ${gs[0].players} players, ${gs[0].center} centre)`);
  say(`  winners    played: Centaur ${m.win.centaur} · Werewolf ${m.win.werewolf} · nobody ${m.win.nobody} · extra wins ${m.extraWins}`);
  say(`  wolf eliminated when one held at the end: ${m.wolfEliminated}/${m.wolfAtTable}`);
  say(`  eliminated seat held a moved card: ${m.eliminatedHeldMoved}/${m.games} · cards moved/game ${m.movedPerGame.toFixed(1)}`);
  say(`  forced night moves ${m.forcedMoves} · random votes ${m.randomVotes} · day messages/game ${m.messagesPerGame.toFixed(0)} · conditional plans ${gs.reduce((a, g) => a + g.branched, 0)}/${gs.reduce((a, g) => a + g.planSteps, 0)} plan steps · chosen moves of a player's card ${gs.reduce((a, g) => a + g.chosenMoves, 0)}${gs[0].run?.redeal ? ` · deals discarded ${gs.reduce((a, g) => a + (g.run?.discardedDeals ?? 0), 0)}` : ""}`);
  for (const g of gs) say(`    ${g.label} ${g.code}: ${g.headline}${g.notes.length ? " " + g.notes.join(" ") : ""}`);
}
const all = measures(games);
say(`\n## Overall (${all.games} games)`);
say(`  winners: Centaur ${all.win.centaur} · Werewolf ${all.win.werewolf} · nobody ${all.win.nobody} · extra wins ${all.extraWins}`);
say(`  wolf eliminated when present: ${all.wolfEliminated}/${all.wolfAtTable} · eliminated held a moved card ${all.eliminatedHeldMoved}/${all.games} · forced moves ${all.forcedMoves} · random votes ${all.randomVotes} · messages/game ${all.messagesPerGame.toFixed(1)}`);

// ── split: was any wolf card DEALT to a player? (the server's deal is under suspicion; see sim/deal-check.ts) ──
say("\n## Games with and without a wolf dealt to a player");
for (const [name, gs] of [["wolf dealt to a player", games.filter(g => g.seats.some(s => isWolf(s.dealt)))], ["NO wolf dealt (all wolves in the centre)", games.filter(g => !g.seats.some(s => isWolf(s.dealt)))]] as const) {
  const m = measures(gs);
  say(`  ${name}: ${m.games} games · Centaur ${m.win.centaur} · Werewolf ${m.win.werewolf} · nobody ${m.win.nobody} · wolf eliminated when held at end ${m.wolfEliminated}/${m.wolfAtTable} · nobody eliminated ${m.nobodyEliminated} · messages/game ${m.messagesPerGame.toFixed(1)}`);
  for (const g of gs) say(`    ${g.label}: ${g.headline}`);
}
say(`  uniform deal would give 'no wolf dealt' in: ${decks.map(d => { const g = games.find(x => x.deck === d)!; const w = g.cards.filter(isWolfId).length, n = g.cards.length, p = g.players; return `${d} ${fp(choose(n - w, p) / choose(n, p))}`; }).join(" · ")}`);

say("\n## Provenance (deck, prompt version, timers, transport) per game");
for (const g of games) say(`  ${g.label} ${g.code}: deck ${g.cards.join(",")} · center ${g.center} · prompt ${g.run?.prompt ?? "(before run.json)"} · timers ${JSON.stringify(g.run?.timers ?? g.timers)} · ${g.run?.transport ?? "?"}`);

// ── claims, by DEALT team ──
say("\n## Claim honesty by dealt team (from debriefs)");
const honesty: Record<string, { claims: number; true: number; players: number; liars: number }> = {};
for (const g of games) for (const s of g.seats) {
  const d = g.debriefs[s.name]; if (!d) continue;
  const t = teamOf(s.dealt), h = (honesty[t] ??= { claims: 0, true: 0, players: 0, liars: 0 });
  h.players++; h.claims += d.claims.length; h.true += d.claims.filter(c => c.wasTrue).length; if (d.claims.some(c => !c.wasTrue)) h.liars++;
}
for (const [t, h] of Object.entries(honesty)) say(`  ${t}: ${h.players} players, ${h.claims} claims, ${pct(h.true, h.claims)} true; ${h.liars} players made at least one false claim`);

// ── per seat model results ──
say("\n## Agents");
const ag = games.flatMap(g => g.agents.map(a => ({ ...a, game: g })));
const byModel = new Map<string, typeof ag>();
for (const a of ag) byModel.set(`${a.model}/${a.effort}`, [...(byModel.get(`${a.model}/${a.effort}`) ?? []), a]);
for (const [m, as] of byModel) {
  const won = as.filter(a => a.game.seats.find((s: Seat) => s.name === a.name)?.won).length;
  say(`  ${m}: ${as.length} seats, won ${won}, cost $${as.reduce((x, a) => x + a.costUsd, 0).toFixed(2)}, turns/seat ${(as.reduce((x, a) => x + a.turns, 0) / as.length).toFixed(0)}, tool calls/seat ${(as.reduce((x, a) => x + a.toolCalls, 0) / as.length).toFixed(0)}, wall/seat ${(as.reduce((x, a) => x + (a.endedAt - a.startedAt), 0) / as.length / 1000).toFixed(0)}s, debriefs ${as.filter(a => a.debrief).length}, killed ${as.filter(a => a.killed).length}, resumed ${as.filter(a => a.segments > 1).length}, isolation ok ${as.filter(a => a.isolationOk).length}`);
}
const tok = ag.reduce((t, a) => ({ input: t.input + a.tokens.input, output: t.output + a.tokens.output, cacheRead: t.cacheRead + a.tokens.cacheRead, cacheWrite: t.cacheWrite + a.tokens.cacheWrite }), { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
say(`  total cost $${ag.reduce((x, a) => x + a.costUsd, 0).toFixed(2)}; tokens: input ${tok.input}, output ${tok.output}, cache read ${tok.cacheRead}, cache write ${tok.cacheWrite}`);

// ── timing ──
say("\n## Timing (seconds from table open)");
for (const g of games) {
  const t = g.timeline, p = t.phases ?? {};
  const q = Object.values(t.queuedAt ?? {}) as number[];
  const dusk = p.night !== undefined ? p.night : NaN;
  say(`  ${g.label}: night ${(p.night / 1000).toFixed(0)} · last plan queued ${q.length ? ((Math.max(...q) - dusk) / 1000).toFixed(0) + "s into dusk" : "-"} (${q.length}/${g.players} seats queued in time to be seen) · day ${(p.day / 1000).toFixed(0)} · ended ${(p.ended / 1000).toFixed(0)} (day lasted ${((p.ended - p.day) / 1000).toFixed(0)}s) · votes ${(t.votes ?? []).map((v: any) => ((v.at - p.day) / 1000).toFixed(0)).join(",")}${t.runnerStarted ? " · RUNNER STARTED" : ""}${t.runnerEndedDay ? " · RUNNER ENDED DAY" : ""}`);
}

// ── what decided games; wolves' wins ──
say("\n## Werewolf-team games (wolf held at the end)");
for (const g of games) {
  const wolves = g.seats.filter(s => isWolf(s.endedHolding)); if (!wolves.length) continue;
  const caught = wolves.some(w => w.eliminated);
  say(`\n### ${g.label} (${g.code}): ${g.headline}`);
  say(`  seats: ${g.seats.map(s => `${s.seat}:${s.name} ${s.dealt}${s.dealt !== s.endedHolding ? "→" + s.endedHolding : ""}${s.eliminated ? " [OUT]" : ""} votes ${s.votedFor}${s.voteWasRandom ? "(random)" : ""}`).join(" | ")}`);
  say(`  centre: ${g.centre.join(", ")}  · wolves ${caught ? "CAUGHT" : "ESCAPED"}`);
  say(`  night: ${g.nightLog.join(" / ")}`);
  for (const s of g.seats) { const d = g.debriefs[s.name]; if (d) say(`  ${s.name} (${s.dealt}): decided by: ${d.decidedBy} | vote: ${d.vote.reasoning}`); }
}
say("\n## What decided games (roles named in the debriefs' decidedBy; a game counts once per role)");
const named: Record<string, number> = {};
for (const g of games) {
  const text = Object.values(g.debriefs).map(d => d.decidedBy).join(" ").toLowerCase();
  for (const id of new Set(g.cards)) if (text.includes(ROLE[id].name.toLowerCase())) named[ROLE[id].name] = (named[ROLE[id].name] ?? 0) + 1;
}
say("  " + Object.entries(named).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(" · "));

say("\n## Results by DEALT team");
const byTeam: Record<string, { seats: number; won: number; eliminated: number; votesReceived: number }> = {};
for (const g of games) for (const s of g.seats) { const t = teamOf(s.dealt), b = (byTeam[t] ??= { seats: 0, won: 0, eliminated: 0, votesReceived: 0 }); b.seats++; if (s.won) b.won++; if (s.eliminated) b.eliminated++; b.votesReceived += s.votesReceived; }
for (const [t, b] of Object.entries(byTeam)) say(`  ${t}: ${b.seats} seats, won ${pct(b.won, b.seats)}, eliminated ${pct(b.eliminated, b.seats)}, votes received/seat ${(b.votesReceived / b.seats).toFixed(2)}`);

// Every game's day, readable, for quoting.
const chats: string[] = [];
for (const g of games) {
  chats.push(`\n=== ${g.label} (${g.code}): ${g.headline}${g.notes.length ? " " + g.notes.join(" ") : ""}`);
  chats.push(`seats: ${g.seats.map(s => `${s.seat}:${s.name} ${s.dealt}${s.dealt !== s.endedHolding ? "→" + s.endedHolding : ""}${s.eliminated ? " [OUT]" : ""} →${s.votedFor}${s.voteWasRandom ? "(random)" : ""}`).join(" | ")}`);
  chats.push(`centre: ${g.centre.join(", ")}`);
  for (const l of g.nightLog) chats.push(`  night: ${l}`);
  for (const m of g.chat.filter(m => m.phase === "day")) { const s = g.seats.find(x => x.name === m.from); chats.push(`  ${m.from}${s ? ` (${s.dealt})` : ""}: ${m.text}`); }
  for (const [n, d] of Object.entries(g.debriefs)) chats.push(`  [debrief ${n}] claims: ${d.claims.map(c => `${c.wasTrue ? "T" : "F"}:${c.claim}`).join(" ; ")} | decided by: ${d.decidedBy}`);
}
writeFileSync(`${out}/chats.txt`, chats.join("\n"));

say("\n## Interface / rules confusions reported");
for (const g of games) for (const [n, d] of Object.entries(g.debriefs)) for (const c of d.confusions) say(`  ${g.label} ${n}: ${c}`);
say("\n## Tension and fun");
const ds = games.flatMap(g => Object.values(g.debriefs));
say(`  tension ${(ds.reduce((a, d) => a + d.tension, 0) / (ds.length || 1)).toFixed(1)} · fun ${(ds.reduce((a, d) => a + d.fun, 0) / (ds.length || 1)).toFixed(1)} over ${ds.length} debriefs`);

say("\n## Deck × arm table");
say("  deck/arm | games | C/W/N wins | wolf elim when held | elim held moved card | cond. plans | chosen moves | msgs/game | $/game");
for (const deck of decks) {
  const gs = games.filter(g => g.deck === deck), m = measures(gs);
  const cost = gs.reduce((a, g) => a + g.agents.reduce((x: number, s: any) => x + s.costUsd, 0), 0) / gs.length;
  say(`  ${deck} | ${m.games} | ${m.win.centaur}/${m.win.werewolf}/${m.win.nobody} | ${m.wolfEliminated}/${m.wolfAtTable} | ${m.eliminatedHeldMoved} | ${gs.reduce((a, g) => a + g.branched, 0)} | ${gs.reduce((a, g) => a + g.chosenMoves, 0)} | ${m.messagesPerGame.toFixed(0)} | ${cost.toFixed(2)}`);
}
writeFileSync(`${out}/analysis.json`, JSON.stringify({ perDeck, overall: all, honesty, games: games.map(g => ({ label: g.label, code: g.code, headline: g.headline, winningTeam: g.winningTeam })) }, null, 1));
writeFileSync(`${out}/analysis.txt`, lines.join("\n"));
