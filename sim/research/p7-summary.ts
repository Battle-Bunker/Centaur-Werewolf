/**
 * players-7 deliverable data: aggregates every game of the given run directories per roster (natural-deal coarse games)
 * and per fixed scenario (replays), with the charter's instruments, into one JSON (docs/research/results/players-7.json).
 *   npx tsx sim/research/p7-summary.ts <out.json> <runDir> [<runDir> ...]
 * Roster of a game: the label prefix before "#" for coarse games (K7, P7, ...); for fixed scenarios "F-<roster>-<name>".
 */
import { writeFileSync } from "node:fs";
import { loadGames, seatOf, type Game } from "./game";

const [out, ...dirs] = process.argv.slice(2);
const games = loadGames(dirs);
const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null);
const counts = (xs: string[]) => xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});
const entropy = (xs: string[]) => { const c = counts(xs), n = xs.length; return +(-Object.values(c).reduce((a, k) => a + (k / n) * Math.log2(k / n), 0)).toFixed(2); };

function conc(g: Game) {
  const tally = new Array(g.players).fill(0);
  for (const s of g.seats) { const t = seatOf(s.votedFor); if (t !== null) tally[t]++; }
  const c = Math.max(...tally) / (g.players - 1);
  return { c: +c.toFixed(2), band: !g.eliminated.length || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous" };
}
/** Winner label: the main team, plus "+pyre" when a burning gave the Pyre a win (alone it reads "pyre"). */
function winner(g: Game) {
  const pyre = g.seats.some(s => s.won && s.endedOnTeam.startsWith("Pyre"));
  const main = g.winningTeam === "nobody" ? "" : g.winningTeam;
  return pyre ? (main ? `${main}+pyre` : "pyre") : main || "nobody";
}
const roster = (g: Game) => (g.group === "P7-setup" ? "S7" : g.group.startsWith("F-") ? g.group.split("-")[1] : g.group.replace(/-.*/, "")); // the setup-check game was roster S7

const groups = new Map<string, Game[]>();
for (const g of games) { const k = g.group.startsWith("F-") ? g.group : `${roster(g)} natural deals`; groups.set(k, [...(groups.get(k) ?? []), g]); }

const result = [...groups].map(([group, gs]) => {
  const w = gs.map(winner), js = gs.flatMap(g => g.judges), pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const modal = Math.max(...Object.values(counts(w)));
  const fixed = group.startsWith("F-");
  const path = mean(js.map(j => j.pathDependence));
  return {
    group, roster: roster(gs[0]), fixedScenario: fixed, games: gs.length, deck: gs[0].deck, centre: gs[0].center, rules: gs[0].rules,
    fingerprints: [...new Set(gs.map(g => g.fingerprint))].length,
    winners: counts(w), minority: gs.length - modal, entropyWinner: entropy(w),
    eliminated: counts(gs.map(g => g.eliminated.map(e => e.replace(/ \(seat \d+\)/, "")).sort().join("+") || "nobody")),
    concentration: gs.map(conc),
    judges: js.length ? { verdicts: js.length, tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path, noise: mean(js.map(j => j.noise)), howWon: counts(js.map(j => j.howWon)),
      agreement: pairs.length ? { tom: mean(pairs.map(p => Math.abs(p[0].tomRequired - p[1].tomRequired))), deception: mean(pairs.map(p => Math.abs(p[0].deceptionCleverness - p[1].deceptionCleverness))), path: mean(pairs.map(p => Math.abs(p[0].pathDependence - p[1].pathDependence))), noise: mean(pairs.map(p => Math.abs(p[0].noise - p[1].noise))), howWonExact: `${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}` } : null } : null,
    talkLive: fixed && gs.length >= 2 && path !== null ? (gs.length - modal >= 1 && path >= 2 ? "talk-live" : gs.length - modal === 0 && path < 2 ? "talk-dead (degenerate)" : gs.length - modal === 0 ? "swept, but talk mattered" : "varied, low path") : null,
    costUsd: +gs.reduce((a, g) => a + g.agents.reduce((b, x) => b + (x.costUsd ?? 0), 0), 0).toFixed(2),
    perGame: gs.map(g => ({ label: g.label, code: g.code, winner: winner(g), eliminated: g.eliminated, ...conc(g), messages: g.chat.filter(m => m.phase === "day").length, judges: g.judges.map(j => ({ tom: j.tomRequired, deception: j.deceptionCleverness, path: j.pathDependence, noise: j.noise, howWon: j.howWon, label: j.howWonLabel })) })),
  };
});
writeFileSync(out, JSON.stringify({ generatedBy: "sim/research/p7-summary.ts", players: 7, groups: result }, null, 1));
for (const r of result) console.log(`${r.group}: ${r.games} games, winners ${JSON.stringify(r.winners)}, minority ${r.minority}, c ${r.concentration.map(c => c.c).join(" ")}, judges ${r.judges ? `${r.judges.tom}/${r.judges.deception}/${r.judges.path}/${r.judges.noise}` : "-"} ${r.talkLive ?? ""} $${r.costUsd}`);
