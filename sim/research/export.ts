/**
 * Exports run directories as result groups in the shared shape (the same as docs/research/results/players-7.json):
 * one group per table label (a fixed scenario's replays, or a roster's coarse games), with winners, eliminated sets,
 * concentration, judge means and agreement, the talk-live verdict, cost and per-game rows (incl. strategies if tagged).
 *   npx tsx sim/research/export.ts <out.json> <name> <runDir> [<runDir> ...]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadGames, seatOf, type Game } from "./game";

const [out, name, ...dirs] = process.argv.slice(2);
const counts = (xs: string[]) => xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const H = (xs: string[]) => { const c = counts(xs), n = xs.length; return Math.round(-Object.values(c).reduce((a, k) => a + (k / n) * Math.log2(k / n), 0) * 100) / 100; };
const winner = (g: Game) => (g.winningTeam === "nobody" && g.seats.some(s => s.won && s.endedOnTeam.startsWith("Pyre")) ? "pyre" : g.winningTeam) + (g.winningTeam !== "nobody" && g.seats.some(s => s.won && s.endedOnTeam.startsWith("Pyre")) ? "+pyre" : "");
function conc(g: Game) {
  const tally = new Array(g.players).fill(0);
  for (const s of g.seats) { const t = seatOf(s.votedFor); if (t !== null) tally[t]++; }
  const top = Math.max(...tally), c = Math.round((top / (g.players - 1)) * 100) / 100;
  return { c, band: !g.eliminated.length || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous" };
}
const roster = (label: string) => (/^(S\d+[a-z]?)-([A-Z]\d)/.exec(label)?.[2]) ?? (/^X1/.test(label) ? "X1" : /^P6/.test(label) ? "P6" : label.replace(/#\d+$/, "").replace(/^P5-spooker$/, "A5"));
const games = loadGames(dirs);
const groups = new Map<string, Game[]>();
for (const g of games) groups.set(g.group, [...(groups.get(g.group) ?? []), g]);
const rows = [...groups].map(([group, gs]) => {
  const fps = new Set(gs.map(g => g.fingerprint ?? "none"));
  const fixed = !!gs[0].run?.scenario;
  const w = gs.map(winner), js = gs.flatMap(g => g.judges);
  const modal = Math.max(...Object.values(counts(w)));
  const pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const agree = (k: "tomRequired" | "deceptionCleverness" | "pathDependence" | "noise") => mean(pairs.map(p => Math.abs(p[0][k] - p[1][k])));
  const path = mean(js.map(j => j.pathDependence));
  const minority = gs.length - modal;
  return {
    group, roster: roster(group), fixedScenario: fixed, games: gs.length, deck: gs[0].deck, centre: gs[0].center, rules: gs[0].rules,
    fingerprints: fps.size, winners: counts(w), minority, entropyWinner: H(w), eliminated: counts(gs.map(g => g.eliminated.map(e => e.replace(/ \(seat \d+\)/, "")).sort().join("+") || "nobody")),
    concentration: gs.map(conc),
    judges: js.length ? { verdicts: js.length, tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path, noise: mean(js.map(j => j.noise)), howWon: counts(js.map(j => j.howWon)), agreement: { tom: agree("tomRequired"), deception: agree("deceptionCleverness"), path: agree("pathDependence"), noise: agree("noise"), howWonExact: `${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}` } } : null,
    talkLive: !fixed || gs.length < 2 || fps.size !== 1 ? null : minority >= 1 && (path ?? 0) >= 2 ? "talk-live" : minority === 0 && (path ?? 0) >= 2 ? "swept-by-argument" : "talk-dead",
    costUsd: Math.round(gs.reduce((a, g) => a + g.agents.reduce((b, x) => b + (x.costUsd ?? 0), 0), 0) * 100) / 100,
    perGame: gs.map(g => ({
      label: g.label, code: g.code, winner: winner(g), eliminated: g.eliminated, ...conc(g), messages: g.chat.filter(m => m.phase === "day").length,
      judges: g.judges.map(j => ({ tom: j.tomRequired, deception: j.deceptionCleverness, path: j.pathDependence, noise: j.noise, howWon: j.howWon, label: j.howWonLabel, pivot: j.pivot })),
      strategies: existsSync(`${g.dir}/strategies.json`) ? JSON.parse(readFileSync(`${g.dir}/strategies.json`, "utf8")).used : null,
    })),
  };
});
writeFileSync(out, JSON.stringify({ generatedBy: `sim/research/export.ts (${name})`, groups: rows }, null, 1));
console.log(`${rows.length} groups, ${games.length} games -> ${out}`);
for (const r of rows) console.log(`  ${r.group.padEnd(30)} ${r.roster.padEnd(4)} ${String(r.games).padStart(2)} ${JSON.stringify(r.winners)} ${r.talkLive ?? ""} path ${r.judges?.path ?? "-"} ToM ${r.judges?.tom ?? "-"}`);
