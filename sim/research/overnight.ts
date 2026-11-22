/**
 * Builds docs/research/overnight-summary.json from every results file (docs/research/results/hub.json and
 * players-N.json, all in the shared group shape): per roster, its fixed scenarios and coarse games, win counts,
 * vote-concentration distribution, judge means with agreement, the talk-live verdicts, and a ranking on the owner's
 * primary target. Prints the ranking.
 *   npx tsx sim/research/overnight.ts [--out docs/research/overnight-summary.json]
 *
 * Ranking (primary target first): (1) share of the roster's fixed scenarios that are talk-live (a minority outcome AND
 * judges' path >= 2); (2) mean judge ToM over its fixed-scenario games; (3) share of its games with concentration in
 * the target band (0.6 <= c < 1); (4) mean judge noise (lower is better). Rosters with no fixed scenario are listed
 * but not ranked.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const OUT = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : "docs/research/overnight-summary.json";
const DIR = "docs/research/results";
interface Group { group: string; roster: string; fixedScenario: boolean; games: number; deck: string[]; centre: number; rules: Record<string, unknown>; winners: Record<string, number>; minority: number; concentration: { c: number; band: string }[]; judges: null | { verdicts: number; tom: number | null; deception: number | null; path: number | null; noise: number | null; agreement: Record<string, unknown> }; talkLive: string | null; costUsd: number; perGame?: unknown[] }
const sources: { file: string; groups: Group[] }[] = readdirSync(DIR).filter(f => /^(hub|players-\d)\.json$/.test(f)).map(f => ({ file: f, groups: JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")).groups }));

const key = (g: Group, file: string) => `${file.replace(".json", "")}:${g.roster}`;
const rosters = new Map<string, { source: string; roster: string; players: number; deck: string[]; centre: number; rulesSeen: Record<string, unknown>[]; groups: Group[] }>();
for (const s of sources) for (const g of s.groups) {
  const k = key(g, s.file);
  const r = rosters.get(k) ?? { source: s.file, roster: g.roster, players: g.deck.length - g.centre, deck: g.deck, centre: g.centre, rulesSeen: [], groups: [] };
  r.groups.push(g); r.rulesSeen.push(g.rules ?? {});
  rosters.set(k, r);
}
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
const sumCounts = (cs: Record<string, number>[]) => cs.reduce<Record<string, number>>((a, c) => { for (const [k, v] of Object.entries(c)) a[k] = (a[k] ?? 0) + v; return a; }, {});
const out = [...rosters.values()].map(r => {
  const fixed = r.groups.filter(g => g.fixedScenario && g.games >= 2);
  const fixedGames = fixed.reduce((a, g) => a + g.games, 0);
  const allC = r.groups.flatMap(g => g.concentration.map(x => x.c));
  const bands = sumCounts(r.groups.map(g => g.concentration.reduce<Record<string, number>>((a, x) => ((a[x.band] = (a[x.band] ?? 0) + 1), a), {})));
  const w = (sel: Group[], f: (j: NonNullable<Group["judges"]>) => number | null) => mean(sel.filter(g => g.judges).flatMap(g => Array(g.judges!.verdicts).fill(f(g.judges!)).filter(x => x !== null)));
  return {
    source: r.source, roster: r.roster, players: r.players, centre: r.centre, deck: r.deck,
    ruleVariants: [...new Set(r.rulesSeen.map(x => JSON.stringify(x)))],
    games: r.groups.reduce((a, g) => a + g.games, 0), coarseGames: r.groups.filter(g => !g.fixedScenario).reduce((a, g) => a + g.games, 0),
    fixedScenarios: fixed.length, fixedReplays: fixedGames,
    winsAll: sumCounts(r.groups.map(g => g.winners)), winsFixed: sumCounts(fixed.map(g => g.winners)),
    talkLive: fixed.filter(g => g.talkLive === "talk-live").length, swept: fixed.filter(g => g.talkLive !== "talk-live").map(g => `${g.group} (${g.talkLive})`),
    concentration: { values: allC, bands, median: allC.length ? [...allC].sort((a, b) => a - b)[Math.floor(allC.length / 2)] : null, inBand: allC.filter(c => c >= 0.6 && c < 1).length },
    judgesFixed: { tom: w(fixed, j => j.tom), deception: w(fixed, j => j.deception), path: w(fixed, j => j.path), noise: w(fixed, j => j.noise) },
    judgesAll: { tom: w(r.groups, j => j.tom), deception: w(r.groups, j => j.deception), path: w(r.groups, j => j.path), noise: w(r.groups, j => j.noise) },
    scenarios: fixed.map(g => ({ group: g.group, rules: g.rules, games: g.games, winners: g.winners, talkLive: g.talkLive, path: g.judges?.path, tom: g.judges?.tom, deception: g.judges?.deception, noise: g.judges?.noise, c: g.concentration.map(x => x.c), agreement: g.judges?.agreement })),
    costUsd: Math.round(r.groups.reduce((a, g) => a + (g.costUsd ?? 0), 0)),
  };
});
const ranked = out.filter(r => r.fixedScenarios > 0).sort((a, b) =>
  b.talkLive / b.fixedScenarios - a.talkLive / a.fixedScenarios || (b.judgesFixed.tom ?? 0) - (a.judgesFixed.tom ?? 0) ||
  b.concentration.inBand / b.games - a.concentration.inBand / a.games || (a.judgesFixed.noise ?? 9) - (b.judgesFixed.noise ?? 9));
writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: sources.map(s => s.file), rankingRule: "talk-live share of fixed scenarios, then judge ToM, then share of games with 0.6 <= c < 1, then lower noise", ranked: ranked.map(r => `${r.source}:${r.roster}`), rosters: out }, null, 1));
console.log(`sources: ${sources.map(s => s.file).join(", ")}`);
for (const r of ranked) console.log(`${(r.source.replace(".json", "") + ":" + r.roster).padEnd(16)} ${r.players}p  fixed ${r.talkLive}/${r.fixedScenarios} talk-live (${r.fixedReplays} replays)  ToM ${r.judgesFixed.tom} path ${r.judgesFixed.path} dec ${r.judgesFixed.deception} noise ${r.judgesFixed.noise}  c-in-band ${r.concentration.inBand}/${r.games}  wins ${JSON.stringify(r.winsFixed)}`);
for (const r of out.filter(r => !r.fixedScenarios)) console.log(`  (unranked, coarse only) ${r.source}:${r.roster} ${r.players}p ${r.games} games ${JSON.stringify(r.winsAll)}`);
