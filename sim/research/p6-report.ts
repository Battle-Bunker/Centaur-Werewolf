/**
 * players-6 summary numbers: per group (fixed scenario or coarse roster), win counts by team (the Pyre counted when a
 * Pyre seat won), parity flag (wolf-team seats >= half the table at the count), vote concentration, judge means and
 * agreement, talk-live verdict. Writes JSON for docs/research/results/players-6.json.
 *   npx tsx sim/research/p6-report.ts <runDir> [...] --json out.json
 */
import { writeFileSync } from "node:fs";
import { loadGames, seatOf, type Game } from "./game";

const argv = process.argv.slice(2);
const ji = argv.indexOf("--json");
const dirs = argv.filter((a, i) => !a.startsWith("--") && (ji < 0 || i !== ji + 1));
const games = loadGames(dirs);
const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null);
const winner = (g: Game) => {
  if (g.seats.some(s => s.won && s.endedOnTeam.startsWith("Pyre"))) return g.winningTeam === "centaur" ? "centaur+pyre" : "pyre";
  return g.winningTeam;
};
const parity = (g: Game) => g.seats.filter(s => s.endedOnTeam.startsWith("Werewolf")).length * 2 >= g.players;
const conc = (g: Game) => {
  const t = new Array(g.players).fill(0);
  for (const s of g.seats) { const x = seatOf(s.votedFor); if (x !== null) t[x]++; }
  return +(Math.max(...t) / (g.players - 1)).toFixed(2);
};
const groups = new Map<string, Game[]>();
for (const g of games) groups.set(g.group, [...(groups.get(g.group) ?? []), g]);
const out = [...groups].map(([group, gs]) => {
  const js = gs.flatMap(g => g.judges);
  const wins: Record<string, number> = {};
  for (const g of gs) wins[winner(g)] = (wins[winner(g)] ?? 0) + 1;
  const modal = Math.max(...Object.values(wins));
  const pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const agree = (k: "tomRequired" | "deceptionCleverness" | "pathDependence" | "noise") => mean(pairs.map(p => Math.abs(p[0][k] - p[1][k])));
  const path = mean(js.map(j => j.pathDependence)) ?? 0;
  const fps = new Set(gs.map(g => g.fingerprint));
  return {
    group, games: gs.length, fixedScenario: fps.size === 1 && gs.length > 1, wins, minority: gs.length - modal,
    talkLive: fps.size === 1 && gs.length > 1 ? (gs.length - modal >= 1 && path >= 2) : null,
    parityGames: gs.filter(parity).length,
    concentration: gs.map(conc),
    judges: { n: js.length, tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path, noise: mean(js.map(j => j.noise)),
      agreement: { tom: agree("tomRequired"), deception: agree("deceptionCleverness"), path: agree("pathDependence"), noise: agree("noise"), howWonExact: `${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}` } },
    perGame: gs.map(g => ({ label: g.label, winner: winner(g), parity: parity(g), eliminated: g.eliminated, c: conc(g), howWon: g.judges.map(j => j.howWon), cost: +g.agents.reduce((a, x) => a + (x.costUsd ?? 0), 0).toFixed(2) })),
  };
});
for (const o of out) console.log(`${o.group}: ${o.games} games ${JSON.stringify(o.wins)} minority ${o.minority} parity ${o.parityGames} c ${o.concentration.join(" ")} | ToM ${o.judges.tom} dec ${o.judges.deception} path ${o.judges.path} noise ${o.judges.noise}${o.talkLive === null ? "" : o.talkLive ? " TALK-LIVE" : " talk-dead"}`);
if (ji >= 0) writeFileSync(argv[ji + 1], JSON.stringify(out, null, 1));
