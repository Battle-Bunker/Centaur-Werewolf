/**
 * Neutral judges: for each finished game, JUDGES independent `claude -p` calls (default 2), each given only the public
 * transcript and the post-game truth (never the players' private reasoning or debriefs) and a fixed rubric
 * (docs/research/charter.md, I3). Writes <game>/judge-<k>.json. Skips games already judged.
 *   npx tsx sim/research/judge.ts <runDir> [<runDir> ...] [--judges 2] [--concurrency 4] [--model opus] [--only label,...]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { loadGames, publicTranscript, truth, type Game } from "./game";

const argv = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const dirs = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const JUDGES = Number(flag("judges", "2")), CONC = Number(flag("concurrency", "4")), MODEL = flag("model", "opus");
const ONLY = argv.includes("--only") ? flag("only", "").split(",") : null;

const CATEGORIES = ["honest-info-converged", "lie-believed", "framing-or-decoy", "split-vote-no-consensus", "unseen-night-movement", "blunder", "creature-or-side-win", "other"];
const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["summary", "tomRequired", "deceptionCleverness", "pathDependence", "pivot", "noise", "howWon", "howWonLabel", "counterfactual"],
  properties: {
    summary: { type: "string", description: "Three to five sentences: what happened and why the winners won." },
    tomRequired: { type: "integer", minimum: 0, maximum: 3 },
    deceptionCleverness: { type: "integer", minimum: 0, maximum: 4 },
    pathDependence: { type: "integer", minimum: 0, maximum: 4 },
    pivot: { type: "string", description: "The message(s) or exchange that decided it, quoted briefly; empty if none." },
    noise: { type: "integer", minimum: 0, maximum: 4 },
    howWon: { type: "string", enum: CATEGORIES },
    howWonLabel: { type: "string", description: "At most 8 words." },
    counterfactual: { type: "string", description: "One sentence: what the losing side would have had to say differently to win." },
  },
};
const SYSTEM = `You are a neutral evaluator of games of Centaur Werewolf, a one-night hidden-role game (one night of secret actions, one discussion, one secret vote). You are given the PUBLIC transcript of one game (everything every player could see) and the post-game TRUTH (the deal, the night's actions, the final cards, every vote). You did not play. Judge the game with the rubric below, carefully and without favouring either side. Reason from the transcript; quote it where useful.

Key rules: players act at night by the card they were DEALT but win by the card they HOLD at the count (cards can move at night). The Werewolf team wins unless more Werewolf cards than Centaur-team players are eliminated (Blood Price; when no Werewolf card is held by a player, the Centaurs win only if nobody is eliminated). At least 2 votes are needed to eliminate; everyone tied on most votes is eliminated. Chat is closed during the vote, ballots are secret.

RUBRIC
- tomRequired (0-3): depth of theory of mind the WINNING side needed to win. 0 = none (won by default, by luck, or by the other side's blunder); 1 = mechanical elimination of possibilities from the claims; 2 = first-order modelling (what would a player holding role X claim, want or fear); 3 = second order or more (modelling what others believe about one's own claims; baiting; anticipating a counter-claim; reasoning about how a liar would construct a lie).
- deceptionCleverness (0-4): quality of the DECISIVE deception, if the deceivers won, or of the best deception attempted if they lost. 0 = none or clumsy; 2 = competent and plausible; 4 = a lie that needed a deep model of the table to construct and was very hard to see through.
- pathDependence (0-4): did the outcome turn on something SAID? 0 = fixed by the deal and the night: any reasonable discussion ends the same; 2 = the discussion mattered but this was the likely result; 4 = a specific message or exchange flipped the result, and a different but reasonable discussion would plausibly have ended differently. Give the pivot.
- noise (0-4): how arbitrary the result felt: random votes, unreasoned choices, coin flips nobody could reason about, a result nobody could have foreseen from what was said. 0 = none.
- howWon: one category: honest-info-converged (the honest information added up and the table followed it), lie-believed (a lie or misdirection was believed), framing-or-decoy (an innocent was framed, or a decoy drew the vote), split-vote-no-consensus (the table failed to concentrate its votes), unseen-night-movement (a night move nobody could detect decided it), blunder (a player's clear mistake decided it), creature-or-side-win (a creature's or other side condition decided it), other. Plus a free label of at most 8 words.
- counterfactual: one sentence on what the losing side would have had to say differently.`;

function runJudge(g: Game, k: number): Promise<void> {
  const out = `${g.dir}/judge-${k}.json`;
  if (existsSync(out)) return Promise.resolve();
  const prompt = `PUBLIC TRANSCRIPT\n=================\n${publicTranscript(g)}\n\nPOST-GAME TRUTH\n===============\n${truth(g)}\n\nJudge this game now with the rubric, returning the structured output.`;
  const box = resolve(tmpdir(), "cw-judge", `${g.code}-${k}`);
  mkdirSync(`${box}/home`, { recursive: true });
  const env: Record<string, string> = { HOME: `${box}/home` };
  for (const v of ["PATH", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "NO_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE"]) if (process.env[v]) env[v] = process.env[v]!;
  const args = ["-p", prompt, "--model", MODEL, "--output-format", "json", "--system-prompt", SYSTEM, "--json-schema", JSON.stringify(SCHEMA), "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--disable-slash-commands"];
  return new Promise(res => {
    const child = spawn("claude", args, { cwd: `${box}/home`, env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "", err = "";
    child.stdout.on("data", d => (buf += d)); child.stderr.on("data", d => (err += d));
    child.on("exit", () => {
      try {
        const r = JSON.parse(buf);
        const so = r.structured_output ?? JSON.parse(r.result);
        writeFileSync(out, JSON.stringify({ judge: `${MODEL}#${k}`, costUsd: r.total_cost_usd, ...so }, null, 1));
        console.log(`${g.label} judge ${k}: tom ${so.tomRequired} decept ${so.deceptionCleverness} path ${so.pathDependence} noise ${so.noise} ${so.howWon} ($${(r.total_cost_usd ?? 0).toFixed(2)})`);
      } catch (e) { console.log(`${g.label} judge ${k}: FAILED ${String(e).slice(0, 200)} ${err.slice(0, 300)} ${buf.slice(0, 300)}`); }
      res();
    });
  });
}

const games = loadGames(dirs).filter(g => !ONLY || ONLY.some(o => g.label === o || g.group === o));
const jobs = games.flatMap(g => Array.from({ length: JUDGES }, (_, k) => () => runJudge(g, k + 1)));
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => { while (next < jobs.length) await jobs[next++](); }));
