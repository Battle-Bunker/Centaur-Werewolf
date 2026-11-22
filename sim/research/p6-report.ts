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
const roster = (group: string) => group.replace(/-S\d.*$/, "").replace(/#.*$/, "");
const band = (c: number, elim: boolean) => (!elim || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous");
const H = (c: Record<string, number>, n: number) => +(-Object.values(c).reduce((a, k) => a + (k / n) * Math.log2(k / n), 0)).toFixed(2);
const out = [...groups].map(([group, gs]) => {
  const js = gs.flatMap(g => g.judges);
  const wins: Record<string, number> = {}, elim: Record<string, number> = {}, how: Record<string, number> = {};
  for (const g of gs) { wins[winner(g)] = (wins[winner(g)] ?? 0) + 1; const e = g.eliminated.map(x => x.replace(/ \(seat \d+\)/, "")).sort().join("+") || "nobody"; elim[e] = (elim[e] ?? 0) + 1; }
  for (const j of js) how[j.howWon] = (how[j.howWon] ?? 0) + 1;
  const modal = Math.max(...Object.values(wins));
  const pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const agree = (k: "tomRequired" | "deceptionCleverness" | "pathDependence" | "noise") => mean(pairs.map(p => Math.abs(p[0][k] - p[1][k])));
  const path = mean(js.map(j => j.pathDependence)) ?? 0;
  const fps = new Set(gs.map(g => g.fingerprint));
  const fixed = fps.size === 1 && gs.length > 1;
  return {
    group, roster: roster(group), fixedScenario: fixed, games: gs.length, deck: [...gs[0].deck].sort(), centre: gs[0].center,
    rules: gs[0].rules ?? {}, openingStatements: !!(gs[0].rules as any)?.openingStatements, fingerprints: fps.size,
    winners: wins, minority: gs.length - modal, entropyWinner: H(wins, gs.length), eliminated: elim,
    parityGames: gs.filter(parity).length,
    concentration: gs.map(g => ({ c: conc(g), band: band(conc(g), g.eliminated.length > 0) })),
    judges: js.length ? { verdicts: js.length, tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path, noise: mean(js.map(j => j.noise)), howWon: how,
      agreement: { tom: agree("tomRequired"), deception: agree("deceptionCleverness"), path: agree("pathDependence"), noise: agree("noise"), howWonExact: `${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}` } } : null,
    talkLive: fixed ? (gs.length - modal >= 1 && path >= 2 ? "talk-live" : gs.length - modal === 0 && path < 2 ? "degenerate" : "talk-dead") : null,
    costUsd: +gs.reduce((a, g) => a + g.agents.reduce((b, x) => b + (x.costUsd ?? 0), 0), 0).toFixed(2),
    perGame: gs.map(g => ({ label: g.label, code: g.code, winner: winner(g), parity: parity(g), eliminated: g.eliminated, c: conc(g), messages: g.chat.filter(m => m.phase === "day").length,
      judges: g.judges.map(j => ({ tom: j.tomRequired, deception: j.deceptionCleverness, path: j.pathDependence, noise: j.noise, howWon: j.howWon, label: j.howWonLabel })) })),
  };
});
for (const o of out) console.log(`${o.group}: ${o.games} games ${JSON.stringify(o.winners)} minority ${o.minority} parity ${o.parityGames} c ${o.concentration.map(x => x.c).join(" ")} | ToM ${o.judges?.tom} dec ${o.judges?.deception} path ${o.judges?.path} noise ${o.judges?.noise} ${o.talkLive ?? ""}`);
if (ji >= 0) writeFileSync(argv[ji + 1], JSON.stringify({ generatedBy: "sim/research/p6-report.ts", players: 6, groups: out }, null, 1));
