/**
 * Compiles docs/research/results/players-5.json from the 5-player run directories (metrics recomputed from the game
 * files) and the hand-written roster notes below.
 *   npx tsx sim/research/p5-report.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadGames, seatOf, type Game } from "./game";

const DIRS = ["sim/runs/p5/coarse", "sim/runs/p5/fine1", "sim/runs/p5/fine2", "sim/runs/p5/coarse2", "sim/runs/p5/fine3"].filter(existsSync);
const games = loadGames(DIRS);
const ROSTERS: Record<string, { name: string; deck: string[]; groups: RegExp; rules: string }> = {
  Q3: { name: "Little Pyre", deck: ["werewolf", "werewolf", "phoenix", "lure", "sage", "rustler", "sentry", "centaur"], groups: /^(Q3|Q3-n|F5-|F6-|F8-)/, rules: "defaults" },
  Q2: { name: "Three Hands", deck: ["werewolf", "werewolf", "cutpurse", "pickpocket", "latecomer", "sage", "sentry", "centaur"], groups: /^(Q2|Q2-n|F3-|F4-|F7-)/, rules: "defaults" },
  Q1D: { name: "Moon and Drover", deck: ["werewolf", "moonsage", "spooker", "sage", "drover", "sentry", "centaur", "centaur"], groups: /^(Q1D-n|D1-|D2-)/, rules: "defaults" },
  Q1: { name: "Moon and Stampede", deck: ["werewolf", "moonsage", "spooker", "sage", "rustler", "sentry", "centaur", "centaur"], groups: /^(Q1$|F1-|F2-)/, rules: "defaults" },
  Q4: { name: "Echo Chamber", deck: ["werewolf", "werewolf", "gleaner", "echo", "sage", "rustler", "sentry", "centaur"], groups: /^Q4$/, rules: "defaults" },
  Q5: { name: "Open Book (control)", deck: ["werewolf", "werewolf", "sage", "sage", "centaur", "centaur", "sentry", "herder"], groups: /^Q5$/, rules: "defaults" },
};
const winner = (g: Game) => (/Pyre wins/.test(g.headline) ? "pyre" : g.winningTeam);
const conc = (g: Game) => { const t = new Array(g.players).fill(0); for (const s of g.seats) { const x = seatOf(s.votedFor); if (x !== null) t[x]++; } return Math.max(...t) / (g.players - 1); };
const band = (g: Game, c: number) => (!g.eliminated.length || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous");
const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null);
const count = (xs: string[]) => xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});

const out: Record<string, unknown> = { generated: new Date().toISOString(), players: 5, center: 3, timers: { dusk: "60 natural / 8 fixed", turn: "8 natural / 2 fixed", day: 240, vote: 60 }, agents: "all seats Opus, medium effort", openingStatements: "off in every game", rosters: {} };
for (const [id, r] of Object.entries(ROSTERS)) {
  const gs = games.filter(g => r.groups.test(g.group));
  const natural = gs.filter(g => !g.fingerprint || !/^[DF]\d/.test(g.group));
  const fixed = gs.filter(g => /^[DF]\d/.test(g.group));
  const scen: Record<string, unknown> = {};
  for (const grp of [...new Set(fixed.map(g => g.group))]) {
    const fg = fixed.filter(g => g.group === grp), js = fg.flatMap(g => g.judges), w = count(fg.map(winner));
    const minority = fg.length - Math.max(...Object.values(w)), path = mean(js.map(j => j.pathDependence)) ?? 0;
    scen[grp] = { replays: fg.length, fingerprints: new Set(fg.map(g => g.fingerprint)).size, tieDecided: fg.filter(g => /Blood Price/.test(g.headline) && g.eliminated.length > 1).length, winners: w, minority, talkLive: minority >= 1 && path >= 2, degenerate: minority === 0 && path < 2,
      judges: { tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path, noise: mean(js.map(j => j.noise)) }, concentration: fg.map(g => +conc(g).toFixed(2)) };
  }
  const js = gs.flatMap(g => g.judges), pairs = gs.filter(g => g.judges.length >= 2).map(g => g.judges);
  const agree = (k: "tomRequired" | "deceptionCleverness" | "pathDependence" | "noise") => mean(pairs.map(p => Math.abs(p[0][k] - p[1][k])));
  (out.rosters as Record<string, unknown>)[id] = {
    name: r.name, deck: r.deck, center: 3, rules: r.rules,
    games: { total: gs.length, natural: natural.length, fixedScenario: fixed.length },
    winsNatural: count(natural.map(winner)), winsAll: count(gs.map(winner)),
    concentration: { values: gs.map(g => +conc(g).toFixed(2)), bands: count(gs.map(g => band(g, conc(g)))) },
    judges: { verdicts: js.length, tom: mean(js.map(j => j.tomRequired)), deception: mean(js.map(j => j.deceptionCleverness)), path: mean(js.map(j => j.pathDependence)), noise: mean(js.map(j => j.noise)),
      agreementMeanAbsDiff: { tom: agree("tomRequired"), deception: agree("deceptionCleverness"), path: agree("pathDependence"), noise: agree("noise") }, howWonExact: `${pairs.filter(p => p[0].howWon === p[1].howWon).length}/${pairs.length}` },
    scenarios: scen,
    costUsd: +gs.reduce((a, g) => a + g.agents.reduce((b, x) => b + (x.costUsd ?? 0), 0), 0).toFixed(2),
  };
}
const strat = "sim/runs/p5/strategies-summary.json";
if (existsSync(strat)) out.strategies = JSON.parse(readFileSync(strat, "utf8"));
out.totalGames = games.length;
out.totalCostUsd = +games.reduce((a, g) => a + g.agents.reduce((b, x) => b + (x.costUsd ?? 0), 0), 0).toFixed(2);
writeFileSync("docs/research/results/players-5.json", JSON.stringify(out, null, 1));
for (const [id, r] of Object.entries(out.rosters as Record<string, any>)) console.log(id, JSON.stringify({ g: r.games, nat: r.winsNatural, all: r.winsAll, bands: r.concentration.bands, j: r.judges, scen: Object.fromEntries(Object.entries(r.scenarios).map(([k, v]: any) => [k, `${JSON.stringify(v.winners)} live=${v.talkLive} dead=${v.degenerate}`])) }));
console.log("total", out.totalGames, "games $", out.totalCostUsd);
