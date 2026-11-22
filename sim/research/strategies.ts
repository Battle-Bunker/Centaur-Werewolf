/**
 * Strategy tagger: one neutral `claude -p` call per finished game, given only the public transcript and the post-game
 * truth (as the judges are), tags which strategies from a FIXED list were used and by which team. Writes
 * <game>/strategies.json (skips games already tagged), then prints a prevalence table: games in which each strategy
 * appeared, by team, and how many of those games that team won.
 *   npx tsx sim/research/strategies.ts <runDir> [<runDir> ...] [--concurrency 5] [--json out.json]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { loadGames, publicTranscript, truth, type Game } from "./game";

const argv = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const dirs = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const CONC = Number(flag("concurrency", "5")), JSON_OUT = flag("json", "");

export const STRATEGIES: Record<string, string> = {
  "early-seer-accusation": "An honest information role names a defector (or a seat) as soon as the discussion opens.",
  "claim-count": "Players count claimed roles against the deck so the unclaimed roles box in the remaining seats.",
  "latency-tell": "A player's silence or late claim (claiming only after being named) is used as evidence against them.",
  "census-safe-claim": "A wolf-team player claims a role it knows (from the census or its own look) lies in the centre, so no one can contradict it.",
  "census-slip": "A wolf-team player reveals knowledge only the pack's census or a wolf look could give, and is caught by it.",
  "claim-collision": "Two defectors (or a defector and an honest player) claim the same single role, exposing one.",
  "twin-true-description": "A shadow twin (Moonsage, Hollow Sage, Dun Centaur) claims the original role and truthfully describes its night.",
  "frame-the-true-seer": "The defectors argue that the honest information role is the twin or a liar.",
  "fake-movement-story": "Someone claims a swap or rotation that did not happen (or misstates one) to make a look stale or explain a read.",
  "engineered-tie": "A side deliberately splits or concentrates votes to produce a tie (e.g. a Blood Price tie that takes down a Centaur).",
  "deliberate-centaur-split": "The Centaurs deliberately split their votes to eliminate two suspects at once.",
  "decoy-sacrifice": "A side pushes the table to eliminate a wolf ally who is not a Werewolf (Spooker, Moonsage, Counterfeiter, ...) or a Phoenix, so that the elimination wins for them.",
  "confession": "A defector admits their true card or side, to gain credibility or to redirect the vote.",
  "decision-theoretic-vote": "Players argue for the vote that wins in the most worlds (e.g. 'voting X can never win, so vote Y').",
  "pyre-double-bluff": "A Pyre player acts as a guilty wolf would (fights the vote) so the table eliminates the Phoenix.",
  "lure-or-glamour-frame": "A distortion makes an honest look show a false role and the table acts on it.",
  "phoenix-exposure": "Someone argues a player is the Phoenix (or a dressed Phoenix) to stop a burning.",
  "seal-use": "A sealed message (Signet or forged) is posted and used.",
  "hush-cut": "A Hush cuts a player off during the discussion.",
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["used"],
  properties: { used: { type: "array", items: { type: "object", additionalProperties: false, required: ["strategy", "team", "decisive", "evidence"], properties: {
    strategy: { type: "string", enum: Object.keys(STRATEGIES) }, team: { type: "string", enum: ["centaur", "werewolf", "pyre"] },
    decisive: { type: "boolean", description: "Did this use materially shape the outcome?" }, evidence: { type: "string", description: "At most 15 words." } } } } },
};
const SYSTEM = `You are a neutral analyst of games of Centaur Werewolf (one night of secret actions, one discussion, one secret vote; act by the card DEALT, win by the card HELD; Blood Price). You get the public transcript and the post-game truth of one game. List every strategy from the fixed list that was clearly USED in this game, each with the team that used it (the team of the card the user HELD at the end; for honest-looking Centaur arguments, "centaur"), whether it materially shaped the outcome, and a few words of evidence. Only list a strategy if you can point to it in the transcript. The list:\n${Object.entries(STRATEGIES).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;

function tag(g: Game): Promise<void> {
  const out = `${g.dir}/strategies.json`;
  if (existsSync(out)) return Promise.resolve();
  const box = resolve(tmpdir(), "cw-strat", g.code); mkdirSync(`${box}/home`, { recursive: true });
  const env: Record<string, string> = { HOME: `${box}/home` };
  for (const v of ["PATH", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE"]) if (process.env[v]) env[v] = process.env[v]!;
  const prompt = `PUBLIC TRANSCRIPT\n${publicTranscript(g)}\n\nPOST-GAME TRUTH\n${truth(g)}\n\nTag the strategies now.`;
  const args = ["-p", prompt, "--model", "opus", "--output-format", "json", "--system-prompt", SYSTEM, "--json-schema", JSON.stringify(SCHEMA), "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--disable-slash-commands"];
  return new Promise(res => {
    const child = spawn("claude", args, { cwd: `${box}/home`, env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = ""; child.stdout.on("data", d => (buf += d));
    child.on("exit", () => {
      try { const r = JSON.parse(buf); const so = r.structured_output ?? JSON.parse(r.result); writeFileSync(out, JSON.stringify({ costUsd: r.total_cost_usd, ...so }, null, 1)); }
      catch (e) { console.log(`${g.label}: FAILED ${String(e).slice(0, 200)}`); }
      res();
    });
  });
}

const games = loadGames(dirs);
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => { while (next < games.length) await tag(games[next++]); }));
const rows: Record<string, { games: number; byTeam: Record<string, { games: number; won: number; decisive: number }> }> = {};
for (const g of games) {
  const f = `${g.dir}/strategies.json`; if (!existsSync(f)) continue;
  const used = (JSON.parse(readFileSync(f, "utf8")).used ?? []) as { strategy: string; team: string; decisive: boolean }[];
  const seen = new Set<string>();
  for (const u of used) {
    const r = (rows[u.strategy] ??= { games: 0, byTeam: {} });
    if (!seen.has(u.strategy)) { r.games++; seen.add(u.strategy); }
    const k = `${u.strategy}|${u.team}`; if (seen.has(k)) continue; seen.add(k);
    const t = (r.byTeam[u.team] ??= { games: 0, won: 0, decisive: 0 });
    t.games++; if (g.winningTeam === u.team || (u.team === "pyre" && g.seats.some(s => s.won && s.endedOnTeam.startsWith("Pyre")))) t.won++; if (u.decisive) t.decisive++;
  }
}
const n = games.filter(g => existsSync(`${g.dir}/strategies.json`)).length;
console.log(`strategies over ${n} games (games used · by team: games, of which that team won, of which judged decisive)`);
for (const [s, r] of Object.entries(rows).sort((a, b) => b[1].games - a[1].games)) console.log(`${s.padEnd(26)} ${String(r.games).padStart(3)}  ${Object.entries(r.byTeam).map(([t, v]) => `${t} ${v.games} (won ${v.won}, decisive ${v.decisive})`).join(" · ")}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ games: n, rows }, null, 1));
process.exit(0);
