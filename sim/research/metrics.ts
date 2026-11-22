/**
 * The research instruments (docs/research/charter.md, section 3) over one or more arena run directories:
 * I1 outcome variability per group of replays (a fixed scenario, or a roster's coarse games), I2 vote concentration,
 * I3 judge scores and the agreement between judges, I4 the degeneracy screen, plus diagnostics (talk, random votes,
 * cost, time). Groups are table labels without the "#k" suffix.
 *   npx tsx sim/research/metrics.ts <runDir> [<runDir> ...] [--json out.json]
 */
import { writeFileSync } from "node:fs";
import { loadGames, seatOf, type Game } from "./game";

const argv = process.argv.slice(2);
const ji = argv.indexOf("--json");
const dirs = argv.filter((a, i) => !a.startsWith("--") && (ji < 0 || i !== ji + 1));
const games = loadGames(dirs);

const entropy = (xs: string[]) => { const c = counts(xs), n = xs.length; return -Object.values(c).reduce((a, k) => a + (k / n) * Math.log2(k / n), 0); };
const counts = (xs: string[]) => xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});
const fmt = (c: Record<string, number>) => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(" · ");
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const r1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "-");
const r2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : "-");

/** Per-game vote measures. */
function votes(g: Game) {
  const tally = new Array(g.players).fill(0);
  for (const s of g.seats) { const t = seatOf(s.votedFor); if (t !== null) tally[t]++; }
  const sorted = [...tally].sort((a, b) => b - a);
  const c = sorted[0] / (g.players - 1), margin = (sorted[0] - (sorted[1] ?? 0)) / (g.players - 1);
  const band = !g.eliminated.length || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous";
  return { tally, c, margin, band, random: g.seats.filter(s => s.voteWasRandom).length };
}
function whoWon(g: Game) {
  const extra = g.seats.filter(s => s.won && !s.endedOnTeam.startsWith(g.winningTeam === "centaur" ? "Centaur" : g.winningTeam === "werewolf" ? "Werewolf" : "~")).length;
  return g.winningTeam + (extra && g.notes.length ? "+side" : "");
}
function diag(g: Game) {
  const ph = g.timeline.phases ?? {};
  const discussion = ph.vote !== undefined && ph.day !== undefined ? (ph.vote - ph.day) / 1000 : NaN;
  const daySecs = g.table.config?.timers?.day ?? NaN;
  return {
    messages: g.chat.filter(m => m.phase === "day").length, discussion, endedByReady: Number.isFinite(discussion) && discussion < daySecs - 5,
    cost: g.agents.reduce((a, x) => a + (x.costUsd ?? 0), 0), wall: (g.timeline.endedAt ?? NaN) / 1000,
    forced: g.nightLog.filter(l => l.includes("random: out of time")).length,
  };
}

const report: Record<string, unknown>[] = [];
const L: string[] = [];
const say = (s = "") => { L.push(s); console.log(s); };
const groups = new Map<string, Game[]>();
for (const g of games) groups.set(g.group, [...(groups.get(g.group) ?? []), g]);

for (const [group, gs] of groups) {
  const fps = counts(gs.map(g => g.fingerprint ?? "none"));
  const winners = gs.map(whoWon), elim = gs.map(g => g.eliminated.map(e => e.replace(/ \(seat \d+\)/, "")).sort().join("+") || "nobody");
  const js = gs.flatMap(g => g.judges);
  const how = js.map(j => j.howWon);
  const modal = Math.max(...Object.values(counts(winners)));
  const vs = gs.map(votes), ds = gs.map(diag);
  const pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const agree = (k: "tomRequired" | "deceptionCleverness" | "pathDependence" | "noise") => mean(pairs.map(p => Math.abs(p[0][k] - p[1][k])));
  const path = mean(js.map(j => j.pathDependence));
  say(`## ${group}  (${gs.length} game${gs.length > 1 ? "s" : ""}, ${gs[0].players} players, ${gs[0].center} centre)`);
  say(`  scenario fingerprints: ${Object.keys(fps).length === 1 ? (Object.keys(fps)[0] === "none" ? "none recorded" : "all identical") : `${Object.keys(fps).length} different (varied deals or a broken replay)`}`);
  say(`  I1 winners: ${fmt(counts(winners))}  | minority ${gs.length - modal} of ${gs.length} | H(win) ${r2(entropy(winners))} bits`);
  say(`     eliminated: ${fmt(counts(elim))} | H(elim) ${r2(entropy(elim))} bits`);
  if (how.length) say(`     how won (judges): ${fmt(counts(how))} | H ${r2(entropy(how))} bits`);
  say(`  I2 concentration c: ${vs.map(v => r2(v.c)).join(" ")} | bands ${fmt(counts(vs.map(v => v.band)))} | margins ${vs.map(v => r2(v.margin)).join(" ")} | random votes ${vs.reduce((a, v) => a + v.random, 0)}`);
  if (js.length) {
    say(`  I3 judges (${js.length} verdicts): ToM ${r1(mean(js.map(j => j.tomRequired)))} · deception ${r1(mean(js.map(j => j.deceptionCleverness)))} · path ${r1(path)} · noise ${r1(mean(js.map(j => j.noise)))}`);
    if (pairs.length) say(`     agreement (mean |diff| over ${pairs.length} pairs): ToM ${r2(agree("tomRequired"))} · deception ${r2(agree("deceptionCleverness"))} · path ${r2(agree("pathDependence"))} · noise ${r2(agree("noise"))} · howWon exact ${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}`);
  }
  const fixed = gs.length >= 2 && Object.keys(fps).length === 1 && Object.keys(fps)[0] !== "none";
  if (fixed && js.length) say(`  I4 ${gs.length - modal === 0 && path < 2 ? "DEGENERATE: one team won every replay and the judges say talk did not decide it" : gs.length - modal === 0 ? "one team won every replay, but the judges say the talk mattered" : "talk-live by the charter's test: " + (path >= 2 ? "yes" : "no (low path dependence)")}`);
  say(`  diag: messages ${ds.map(d => d.messages).join(" ")} · discussion s ${ds.map(d => r1(d.discussion)).join(" ")} (ended by ready ${ds.filter(d => d.endedByReady).length}/${gs.length}) · forced night moves ${ds.reduce((a, d) => a + d.forced, 0)} · cost $${ds.map(d => d.cost.toFixed(2)).join(" $")} · wall s ${ds.map(d => r1(d.wall)).join(" ")}`);
  for (const g of gs) say(`    ${g.label} ${g.code}: ${g.headline} [${elim[gs.indexOf(g)]}]${g.judges.length ? ` | ${g.judges.map(j => `${j.howWon}: ${j.howWonLabel}`).join(" / ")}` : ""}`);
  say();
  report.push({ group, games: gs.map(g => ({ label: g.label, code: g.code, winner: whoWon(g), eliminated: g.eliminated, votes: votes(g), diag: diag(g), fingerprint: g.fingerprint, judges: g.judges })) });
}
if (ji >= 0) writeFileSync(argv[ji + 1], JSON.stringify(report, null, 1));
