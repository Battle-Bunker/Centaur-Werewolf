/**
 * Confirmation session report: aggregates the confirmation runs (sim/runs/confirm/<batch>) per scenario and arm,
 * merges the exploring sessions' earlier replays of the same scenario (from their committed JSON), writes
 * docs/research/results/confirm.json and replaces the auto-generated block of docs/research/results/confirm.md.
 *   npx tsx sim/research/confirm-report.ts
 * Labels are "<scenario>~<arm>#k" (arm: off | open | spares).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadGames, type Game } from "./game";

const RUNS = ["c7", "c5", "c6", "c7k", "c5b", "cx", "c7b"].map(b => `sim/runs/confirm/${b}`).filter(existsSync);
const games = loadGames(RUNS);
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const p5 = read("docs/research/results/players-5.json"), p6 = read("docs/research/results/players-6.json"), p7 = read("docs/research/results/players-7.json");

const ROSTER: Record<string, { roster: string; players: number; scenarios: string[] }> = {
  P7: { roster: "P7 Pyre (7 players): werewolf x2, phoenix, lure, embercarrier, sage, rustler, sentry, centaur, pickpocket; 3 centre", players: 7, scenarios: ["F-P7-ember", "F-P7-inversion"] },
  K7: { roster: "K7 Shadow Court (7 players, two-team control): werewolf x2, moonsage, strayherder, sage, herder, rustler, sentry, centaur x2; 3 centre", players: 7, scenarios: ["F-K7-duel"] },
  Q3: { roster: "Q3 Little Pyre (5 players): werewolf x2, phoenix, lure, sage, rustler, sentry, centaur; 3 centre", players: 5, scenarios: ["F6-Q3-two-wolves-lure", "F5-Q3-pyre-burn", "F8-Q3-dressed-phoenix"] },
  PY6: { roster: "PY6 Pyre with a twin (6 players): werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket; 3 centre; bloodPriceCondemned on in this session", players: 6, scenarios: ["PY6-S1-fakesage", "PY6-S2-twowolfreads"] },
};

// Earlier replays (the exploring sessions'), per scenario~arm: winners, c values, judge means, n.
interface Prior { source: string; n: number; winners: Record<string, number>; c: number[]; judges?: { tom: number; deception: number; path: number; noise: number }; eliminated?: Record<string, number>; note?: string }
const g6 = (name: string) => p6.groups.find((g: any) => g.group === name);
const g7 = (name: string) => p7.groups.find((g: any) => g.group === name);
const fromGroup = (src: string, g: any, note?: string): Prior => ({ source: src, n: g.games, winners: g.winners, c: g.concentration.map((x: any) => x.c), judges: { tom: g.judges.tom, deception: g.judges.deception, path: g.judges.path, noise: g.judges.noise }, eliminated: g.eliminated, note });
const q3 = p5.rosters.Q3.scenarios;
const fromP5 = (name: string, note?: string): Prior => { const s = q3[name]; return { source: "players-5.json", n: s.replays, winners: s.winners, c: s.concentration, judges: s.judges, note }; };
const PRIOR: Record<string, Prior> = {
  "F-P7-ember~off": fromGroup("players-7.json", g7("F-P7-ember")),
  "F6-Q3-two-wolves-lure~off": fromP5("F6-Q3-two-wolves-lure", "players-5 session's own n=10 (its fine1 + fine3 extension; it reports 2 fingerprints, tie-decided 2)"),
  "F8-Q3-dressed-phoenix~off": fromP5("F8-Q3-dressed-phoenix"),
  "F5-Q3-pyre-burn~off": fromP5("F5-Q3-pyre-burn"),
  "F-K7-duel~off": fromGroup("players-7.json", g7("F-K7-duel")),
  "PY6-S1-fakesage~off": fromGroup("players-6.json", g6("PY6-S1-fakesage"), "bloodPriceCondemned off in the earlier games"),
  "PY6-S1-fakesage~open": fromGroup("players-6.json", g6("PY6-S1-open"), "bloodPriceCondemned off in the earlier games"),
  "PY6-S2-twowolfreads~off": fromGroup("players-6.json", g6("PY6-S2-twowolfreads"), "bloodPriceCondemned off in the earlier games"),
  "PY6-S2-twowolfreads~open": fromGroup("players-6.json", g6("PY6-S2-open"), "bloodPriceCondemned off in the earlier games"),
  "F-P7-inversion~off": { source: "players-7-predictions.md (batch 3 note)", n: 5, winners: { centaur: 5 }, c: [], note: "only the count is recorded (5-0 Centaurs, ToM 1.4)" },
};

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const band = (c: number, elim: boolean) => (!elim || c <= 0.4 ? "scattered" : c <= 0.6 ? "plurality" : c < 1 ? "majority" : "unanimous");
const count = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
const minority = (w: Record<string, number>) => { const n = Object.values(w).reduce((a, b) => a + b, 0); return n - Math.max(0, ...Object.values(w)); };
const entropy = (w: Record<string, number>) => { const n = Object.values(w).reduce((a, b) => a + b, 0); return Math.round(-Object.values(w).reduce((a, k) => a + (k / n) * Math.log2(k / n), 0) * 100) / 100 || 0; };

/** Winning team(s) from the seats that won: centaur / werewolf / pyre (a Pyre burning reports winningTeam "nobody"). */
function whoWon(g: Game) {
  const t = (s: string) => (s.startsWith("Centaur") ? "centaur" : s.startsWith("Werewolf") ? "werewolf" : s.startsWith("Pyre") ? "pyre" : s.toLowerCase());
  const teams = [...new Set(g.seats.filter(s => s.won).map(s => t(s.endedOnTeam)))].sort();
  return teams.join("+") || "nobody";
}
function perGame(g: Game) {
  const n = g.seats.length;
  const tally = g.seats.map(s => g.seats.filter(v => (v.votedFor ?? "").replace(/ \(seat \d+\)\.?$/, "") === s.name).length);
  const sorted = [...tally].sort((a, b) => b - a);
  const c = Math.round((sorted[0] / (n - 1)) * 100) / 100;
  const elimNames = g.seats.filter(s => s.eliminated).map(s => `${s.name}(${s.endedHolding})`);
  const tie = g.seats.filter(s => s.eliminated).length >= 2;
  const strat = existsSync(`${g.dir}/strategies-confirm.json`) ? read(`${g.dir}/strategies-confirm.json`).used ?? [] : null;
  const j = g.judges;
  return {
    label: g.label, code: g.code, fingerprint: g.fingerprint, winner: whoWon(g), eliminated: elimNames.join("+") || "nobody", c, band: band(c, elimNames.length > 0),
    tieDecided: tie, randomVotes: g.seats.filter(s => s.voteWasRandom).length, messages: g.chat.filter(m => m.phase !== "vote").length,
    costUsd: Math.round(g.agents.reduce((a, x) => a + (x.costUsd ?? 0), 0) * 100) / 100,
    judges: j.map(x => ({ tom: x.tomRequired, deception: x.deceptionCleverness, path: x.pathDependence, noise: x.noise, howWon: x.howWon, label: x.howWonLabel, pivot: x.pivot })),
    strategies: strat,
  };
}

const groups = new Map<string, Game[]>();
for (const g of games) { const k = g.label.replace(/#\d+$/, ""); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(g); }

const out: any = { generatedBy: "sim/research/confirm-report.ts", generated: new Date().toISOString(), rosters: {} as any, spendUsd: 0 };
let spend = 0;
for (const [rk, r] of Object.entries(ROSTER)) {
  const ro: any = { roster: r.roster, scenarios: {} };
  for (const sc of r.scenarios) for (const arm of ["off", "open", "cond", "spares"]) {
    const key = `${sc}~${arm}`;
    const gs = groups.get(key) ?? [];
    const prior = PRIOR[key];
    if (!gs.length && (!prior || /F8-|inversion/.test(key))) continue; // deferred scenarios appear once played
    const pg = gs.map(perGame);
    spend += pg.reduce((a, x) => a + x.costUsd, 0);
    const js = pg.flatMap(x => x.judges);
    const winners = count(pg.map(x => x.winner));
    const pairs = pg.filter(x => x.judges.length >= 2);
    const agree = (k: "tom" | "deception" | "path" | "noise") => mean(pairs.map(x => Math.abs(x.judges[0][k] - x.judges[1][k])));
    const strat: Record<string, { games: number; won: number; decisive: number }> = {};
    for (const x of pg) if (x.strategies) { const seen = new Set<string>(); for (const u of x.strategies) { const k2 = `${u.strategy}|${u.team}`; if (seen.has(k2)) continue; seen.add(k2); const e = (strat[k2] ??= { games: 0, won: 0, decisive: 0 }); e.games++; if (x.winner.split("+").includes(u.team)) e.won++; if (u.decisive) e.decisive++; } }
    const newJ = { tom: mean(js.map(x => x.tom)), deception: mean(js.map(x => x.deception)), path: mean(js.map(x => x.path)), noise: mean(js.map(x => x.noise)) };
    const pooledW: Record<string, number> = { ...(prior?.winners ?? {}) };
    for (const [t, k] of Object.entries(winners)) pooledW[t] = (pooledW[t] ?? 0) + k;
    const pn = (prior?.n ?? 0) + pg.length;
    const pooledPath = prior?.judges && newJ.path !== null ? Math.round(((prior.judges.path * prior.n + newJ.path * pg.length) / pn) * 100) / 100 : newJ.path ?? prior?.judges?.path ?? null;
    const pooledC = [...(prior?.c ?? []), ...pg.map(x => x.c)];
    ro.scenarios[key] = {
      scenario: sc, arm, rules: gs[0]?.rules ?? null, fingerprints: [...new Set(pg.map(x => x.fingerprint))],
      new: {
        n: pg.length, winners, minority: minority(winners), entropyWinner: entropy(winners), eliminated: count(pg.map(x => x.eliminated)),
        c: pg.map(x => x.c), cMedian: median(pg.map(x => x.c)), bands: count(pg.map(x => x.band)), tieDecided: pg.filter(x => x.tieDecided).length,
        randomVotes: pg.reduce((a, x) => a + x.randomVotes, 0), judges: { verdicts: js.length, ...newJ, agreementMeanAbsDiff: { tom: agree("tom"), deception: agree("deception"), path: agree("path"), noise: agree("noise") }, howWonExact: `${pairs.filter(x => x.judges[0].howWon === x.judges[1].howWon).length}/${pairs.length}`, howWon: count(js.map(x => x.howWon)) },
        strategies: Object.entries(strat).sort((a, b) => b[1].games - a[1].games).map(([k2, v]) => ({ strategy: k2.split("|")[0], team: k2.split("|")[1], ...v })),
        costUsd: Math.round(pg.reduce((a, x) => a + x.costUsd, 0) * 100) / 100,
      },
      prior: prior ?? null,
      pooled: prior ? { n: pn, winners: pooledW, minority: minority(pooledW), entropyWinner: entropy(pooledW), path: pooledPath, cMedian: median(pooledC), talkLive: minority(pooledW) >= 1 && (pooledPath ?? 0) >= 2 } : null,
      talkLiveNew: pg.length >= 2 ? minority(winners) >= 1 && (newJ.path ?? 0) >= 2 : null,
      games: pg,
    };
  }
  out.rosters[rk] = ro;
}
out.spendUsd = Math.round(spend * 100) / 100;
writeFileSync("docs/research/results/confirm.json", JSON.stringify(out, null, 1));

// Markdown block
const w = (o: Record<string, number> | undefined) => (o ? Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k === "werewolf" ? "W" : k === "centaur" ? "C" : k === "pyre" ? "P" : k} ${v}`).join(", ") : "–");
const f = (x: number | null | undefined) => (x === null || x === undefined ? "–" : x.toFixed(2).replace(/0$/, ""));
let md = `<!-- auto:start (sim/research/confirm-report.ts; do not edit by hand) -->\n_Generated ${out.generated.slice(0, 16)} UTC; session spend on counted games so far: $${out.spendUsd}._\n\n`;
for (const [rk, ro] of Object.entries<any>(out.rosters)) {
  md += `### ${ro.roster}\n\n| Scenario ~ arm | New n | New winners | Earlier (n) | Pooled winners (n) | Talk-live (new / pooled) | c new (median) | Judges new ToM / dec / path / noise | Agreement \\|diff\\| t/d/p/n · howWon | Ties |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const [k, s] of Object.entries<any>(ro.scenarios)) {
    const n = s.new, j = n.judges, a = j.agreementMeanAbsDiff;
    md += `| ${k} | ${n.n} | ${w(n.winners)} | ${s.prior ? `${w(s.prior.winners)} (${s.prior.n})` : "–"} | ${s.pooled ? `${w(s.pooled.winners)} (${s.pooled.n})` : "–"} | ${s.talkLiveNew === null ? "–" : s.talkLiveNew ? "yes" : "no"} / ${s.pooled ? (s.pooled.talkLive ? "yes" : "no") : "–"} | ${n.c.join(" ")} (${f(n.cMedian)}) | ${f(j.tom)} / ${f(j.deception)} / ${f(j.path)} / ${f(j.noise)} | ${f(a.tom)}/${f(a.deception)}/${f(a.path)}/${f(a.noise)} · ${j.howWonExact} | ${n.tieDecided} |\n`;
  }
  md += `\nEliminated (new games): ${Object.entries<any>(ro.scenarios).map(([k, s]) => `**${k}**: ${Object.entries(s.new.eliminated).map(([e, c]) => `${e} ${c}`).join(", ") || "–"}`).join("; ")}\n\n`;
  const st: Record<string, { games: number; won: number; decisive: number }> = {};
  let tagged = 0;
  for (const s of Object.values<any>(ro.scenarios)) { tagged += s.games.filter((g: any) => g.strategies).length; for (const x of s.new.strategies) { const e = (st[`${x.strategy}|${x.team}`] ??= { games: 0, won: 0, decisive: 0 }); e.games += x.games; e.won += x.won; e.decisive += x.decisive; } }
  if (tagged) {
    md += `Strategies observed (${tagged} tagged new games; games used / that team won / tagged decisive):\n\n| Strategy | Team | Games | Won | Decisive |\n| --- | --- | --- | --- | --- |\n`;
    for (const [k, v] of Object.entries(st).sort((a, b) => b[1].games - a[1].games)) md += `| ${k.split("|")[0]} | ${k.split("|")[1]} | ${v.games} | ${v.won} | ${v.decisive} |\n`;
    md += "\n";
  }
}
md += "<!-- auto:end -->";
const mdPath = "docs/research/results/confirm.md";
const doc = existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "<!-- auto:start --><!-- auto:end -->";
writeFileSync(mdPath, doc.replace(/<!-- auto:start[\s\S]*?<!-- auto:end -->/, md));
console.log(md);
