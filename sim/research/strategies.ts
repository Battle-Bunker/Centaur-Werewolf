/**
 * Strategy tagger: one neutral `claude -p` call per game (public transcript + post-game truth, as for the judges)
 * that marks which strategies from a FIXED taxonomy were used, by which team, and whether each was decisive.
 * Writes <game>/strategies.json; skips games already tagged. Then prints the prevalence table over all given runs
 * (games in which each strategy appeared, by team, and how often that team won those games).
 *   npx tsx sim/research/strategies.ts <runDir> [<runDir> ...] [--concurrency 4] [--table-only]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { loadGames, publicTranscript, truth, type Game } from "./game";

export const TAXONOMY: Record<string, string> = {
  "safe-centre-claim": "A defector claims a role it knows (census) or guesses lies in the centre, so nobody can counter-claim it.",
  "counter-claim-info-role": "A defector claims the same information role as an honest player (a Sage duel, a Herder duel...).",
  "fake-read": "A false report of a night look at a player (true role claimed or not).",
  "frame-ally": "A defector accuses or lets the table eliminate its own team-mate who is not a Werewolf (a decoy whose elimination wins).",
  "false-movement-story": "A false account of night card movement (a rotation's direction or targets, a swap that did not happen).",
  "fake-confession": "A player falsely admits to a role or a team to steer the vote.",
  "vote-split-or-tie-plan": "Someone proposes splitting votes or engineering a tie.",
  "phoenix-baiting": "A Pyre player acts or is presented as a wolf to draw the votes onto a Phoenix/Kindler.",
  "census-backward-induction": "Someone argues from what a wolf's census would have told it (\"a wolf would never claim X\").",
  "motive-analysis": "Someone argues from who benefits / why a player would lie (incentive reasoning beyond the mechanics).",
  "claim-timing-tell": "Someone argues from when or how a player claimed (late, hedged, changed claim).",
  "claim-count-collision": "A contradiction in role counts (two players claim a single card, more claims than copies) exposed someone.",
  "corroboration-chain": "Two or more honest results are lined up to confirm a player or a card.",
  "team-collision": "Two members of the same defecting team told incompatible stories, hurting their team.",
  "retarget-the-swapper": "The table chooses to eliminate a player who could act after the talk, rather than the obvious suspect.",
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["used"],
  properties: {
    used: {
      type: "array", items: {
        type: "object", additionalProperties: false, required: ["strategy", "team", "who", "decisive"],
        properties: {
          strategy: { type: "string", enum: Object.keys(TAXONOMY) },
          team: { type: "string", enum: ["centaur", "werewolf", "pyre", "loner"] },
          who: { type: "string" }, decisive: { type: "boolean" },
        },
      },
    },
  },
};
const SYSTEM = `You are a neutral analyst of games of Centaur Werewolf (a one-night hidden-role game). You get the public transcript of one game and the post-game truth. List every strategy from the taxonomy that a player clearly USED in the discussion (not merely possible), with the team the player was on at the count (centaur, werewolf, pyre or loner), the player's name, and whether it was decisive for the result. A strategy used by several players of one team is listed once per team. Taxonomy:\n${Object.entries(TAXONOMY).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;

function tag(g: Game): Promise<void> {
  const out = `${g.dir}/strategies.json`;
  if (existsSync(out)) return Promise.resolve();
  const box = resolve(tmpdir(), "cw-strat", g.code);
  mkdirSync(`${box}/home`, { recursive: true });
  const env: Record<string, string> = { HOME: `${box}/home` };
  for (const v of ["PATH", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE"]) if (process.env[v]) env[v] = process.env[v]!;
  const prompt = `PUBLIC TRANSCRIPT\n${publicTranscript(g)}\n\nPOST-GAME TRUTH\n${truth(g)}\n\nList the strategies used.`;
  const args = ["-p", prompt, "--model", "opus", "--output-format", "json", "--system-prompt", SYSTEM, "--json-schema", JSON.stringify(SCHEMA), "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--disable-slash-commands"];
  return new Promise(res => {
    const child = spawn("claude", args, { cwd: `${box}/home`, env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", d => (buf += d));
    child.on("exit", () => {
      try { const r = JSON.parse(buf); writeFileSync(out, JSON.stringify({ costUsd: r.total_cost_usd, ...(r.structured_output ?? JSON.parse(r.result)) }, null, 1)); }
      catch (e) { console.log(`${g.label}: tagging FAILED ${String(e).slice(0, 150)}`); }
      res();
    });
  });
}

const argv = process.argv.slice(2);
const ci = argv.indexOf("--concurrency"), CONC = ci >= 0 ? Number(argv[ci + 1]) : 4;
const dirs = argv.filter((a, i) => !a.startsWith("--") && !(ci >= 0 && i === ci + 1));
const games = loadGames(dirs);
if (!argv.includes("--table-only")) {
  let next = 0;
  await Promise.all(Array.from({ length: CONC }, async () => { while (next < games.length) await tag(games[next++]); }));
}
// Prevalence: per strategy and team, games used, games won by that team, games where marked decisive.
const rows = new Map<string, { games: number; won: number; decisive: number }>();
let tagged = 0;
for (const g of games) {
  const f = `${g.dir}/strategies.json`;
  if (!existsSync(f)) continue;
  tagged++;
  const used = (JSON.parse(readFileSync(f, "utf8")).used ?? []) as { strategy: string; team: string; decisive: boolean }[];
  const seen = new Set<string>();
  for (const u of used) {
    const k = `${u.strategy}|${u.team}`;
    if (seen.has(k)) continue; seen.add(k);
    const won = g.seats.some(s => s.won && s.endedOnTeam.toLowerCase().startsWith(u.team === "werewolf" ? "werewolf" : u.team));
    const r = rows.get(k) ?? { games: 0, won: 0, decisive: 0 };
    r.games++; if (won) r.won++; if (u.decisive) r.decisive++;
    rows.set(k, r);
  }
}
console.log(`strategy prevalence over ${tagged} tagged games (games used / of which that team won / marked decisive)`);
for (const [k, r] of [...rows].sort((a, b) => b[1].games - a[1].games)) { const [s, t] = k.split("|"); console.log(`  ${s.padEnd(26)} ${t.padEnd(9)} ${String(r.games).padStart(3)} / won ${String(r.won).padStart(3)} / decisive ${r.decisive}`); }
