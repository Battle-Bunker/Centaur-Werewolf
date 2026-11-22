/**
 * Tags each judged game with the strategies (from a fixed list) that appeared in it, by which team, and whether that
 * team won, from the two judges' summaries and pivots plus the post-game truth (one neutral `claude -p` call per game).
 * Writes <game>/strategies.json (skips games already tagged) and prints a prevalence table.
 *   npx tsx sim/research/strategies-p5.ts <runDir> [<runDir> ...] [--concurrency 6] [--model opus]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { loadGames, truth, type Game } from "./game";

const argv = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const dirs = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const CONC = Number(flag("concurrency", "6")), MODEL = flag("model", "opus");

export const STRATEGIES: Record<string, string> = {
  censusClaim: "A Werewolf claims a role it knows (census) lies in the centre, so no player can contradict it",
  allyDecoy: "A wolf-side card that is not a Werewolf (Spooker, Moonsage, ...) draws the votes, so its elimination wins for the wolves",
  moverLie: "A player who moved cards lies about the target or direction of the move (swap/rotation) to relocate a card",
  turnedConfession: "A player dealt a Werewolf who has lost the card (or learns it moved) confesses and testifies for the Centaurs",
  mirrorClaim: "A counter-claim of the same information role (a duplicate, a twin or a plain lie) answers an accusation",
  censusSlip: "A wolf reveals knowledge only the census could give, and the table catches it",
  fakeLook: "A player invents a look (read, peek, glance) to accuse or clear someone",
  pyreBait: "The Phoenix or a Kindler steers votes onto the Phoenix (or a Kindler) by fake claims, feigned guilt or a dressed card",
  dominantVote: "A Centaur argues for the seat that is a Werewolf in every consistent world (or that eliminating X cannot win)",
  eliminateNobody: "Someone argues that nobody should be eliminated (the wolf may be in the centre)",
  tieEngineering: "Votes are deliberately split or a Blood Price tie is engineered",
  claimTiming: "Who claimed first / late copying of another's claim is used as decisive evidence",
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["used"],
  properties: { used: { type: "array", items: { type: "object", additionalProperties: false, required: ["strategy", "team", "decisive"],
    properties: { strategy: { type: "string", enum: Object.keys(STRATEGIES) }, team: { type: "string", enum: ["centaur", "werewolf", "pyre"] }, decisive: { type: "boolean" } } } } },
};
const SYSTEM = `You tag games of Centaur Werewolf (a one-night hidden-role game) with the strategies that appeared in them. Use ONLY this list:\n${Object.entries(STRATEGIES).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\nFor each strategy that clearly appeared, give the team of the player(s) who used it (centaur, werewolf or pyre; a player's team is that of the card they HELD at the end, or werewolf if bitten) and whether it was decisive for the result. Tag only what the summaries and truth support.`;

function tag(g: Game): Promise<void> {
  const out = `${g.dir}/strategies.json`;
  if (existsSync(out) || !g.judges.length) return Promise.resolve();
  const prompt = `POST-GAME TRUTH\n${truth(g)}\n\nJUDGES' ACCOUNTS\n${g.judges.map((j, k) => `Judge ${k + 1}: ${j.summary}\nPivot: ${j.pivot}`).join("\n\n")}\n\nTag the strategies now.`;
  const box = resolve(tmpdir(), "cw-tag", g.code);
  mkdirSync(box, { recursive: true });
  const env: Record<string, string> = { HOME: box };
  for (const v of ["PATH", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE"]) if (process.env[v]) env[v] = process.env[v]!;
  const args = ["-p", prompt, "--model", MODEL, "--output-format", "json", "--system-prompt", SYSTEM, "--json-schema", JSON.stringify(SCHEMA), "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--disable-slash-commands"];
  return new Promise(res => {
    const child = spawn("claude", args, { cwd: box, env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", d => (buf += d));
    child.on("exit", () => {
      try { const r = JSON.parse(buf); writeFileSync(out, JSON.stringify(r.structured_output ?? JSON.parse(r.result), null, 1)); } catch (e) { console.log(`${g.label}: FAILED ${String(e).slice(0, 200)}`); }
      res();
    });
  });
}

const games = loadGames(dirs);
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => { while (next < games.length) await tag(games[next++]); }));
// prevalence: games in which each strategy appeared (by team), and how often that team won
const rows: Record<string, { games: number; byTeam: Record<string, { games: number; won: number; decisive: number }> }> = {};
for (const g of games) {
  const f = `${g.dir}/strategies.json`;
  if (!existsSync(f)) continue;
  const used = (JSON.parse(readFileSync(f, "utf8")).used ?? []) as { strategy: string; team: string; decisive: boolean }[];
  const seen = new Set<string>();
  for (const u of used) {
    const r = (rows[u.strategy] ??= { games: 0, byTeam: {} });
    if (!seen.has(u.strategy)) { r.games++; seen.add(u.strategy); }
    const key = `${u.strategy}:${u.team}`;
    if (seen.has(key)) continue; seen.add(key);
    const t = (r.byTeam[u.team] ??= { games: 0, won: 0, decisive: 0 });
    t.games++; if (u.decisive) t.decisive++;
    const won = g.winningTeam === u.team || (u.team === "pyre" && /Pyre wins/.test(g.headline));
    if (won) t.won++;
  }
}
console.log(`strategies over ${games.length} games (games where used; by team: games / team won / decisive)`);
for (const [k, r] of Object.entries(rows).sort((a, b) => b[1].games - a[1].games)) console.log(`${k.padEnd(18)} ${String(r.games).padStart(3)}  ${Object.entries(r.byTeam).map(([t, x]) => `${t} ${x.games}/${x.won}/${x.decisive}`).join("  ")}`);
writeFileSync(`${dirs[0]}/../strategies-summary.json`, JSON.stringify({ games: games.length, rows }, null, 1));
