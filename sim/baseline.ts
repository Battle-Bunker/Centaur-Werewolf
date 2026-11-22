/**
 * The no-skill baseline for a deck: the same engine, with every night move, swap and vote chosen at random, under each
 * table's rules. It shows what the deck's mechanics do by themselves, so that play-test results can be read against
 * it (how much better than chance do talking players find a wolf; does a team win mostly whatever anyone does).
 *   npx tsx sim/baseline.ts <tournament.json> [games per arm = 20000] [--json out.json]
 * One line block per distinct (deck, rules) arm: tables whose labels differ only by "#n" are the same arm.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomPlay, type Baseline } from "./random-play";
import { ROLE } from "../shared/roles";

const args = process.argv.slice(2);
const ji = args.indexOf("--json"), jsonOut = ji >= 0 ? args.splice(ji, 2)[1] : undefined;
const [file, n = "20000"] = args;
const spec = JSON.parse(readFileSync(file, "utf8")) as { rules?: Record<string, unknown>; tables: { label: string; deck: string[]; center: number; players: string[]; rules?: Record<string, unknown> }[] };
const seen = new Set<string>();
const pct = (x: number) => (Number.isFinite(x) ? `${(100 * x).toFixed(0)}%` : "n/a");
const out: Record<string, Baseline & { players: number; center: number; rules: Record<string, unknown> }> = {};
for (const t of spec.tables) {
  const label = t.label.replace(/#\d+$/, "");
  if (seen.has(label)) continue;
  seen.add(label);
  const rules = { ...spec.rules, ...t.rules };
  const b = randomPlay(t.deck, t.players.length, Number(n), rules);
  out[label] = { ...b, players: t.players.length, center: t.center, rules };
  console.log(`${label}  (${t.players.length} players, ${t.center} centre${Object.keys(rules).length ? `, rules ${JSON.stringify(rules)}` : ""}) random play, ${b.games} games`);
  console.log(`  main result: Centaur ${pct(b.win.centaur)}  Werewolf ${pct(b.win.werewolf)}  nobody ${pct(b.win.nobody)}${t.deck.some(r => ROLE[r]?.team === "wild" || ROLE[r]?.tags.includes("wild")) ? ` · a creature won ${pct(b.creatureWins)} · cursed seats/game ${b.cursedPerGame.toFixed(2)}` : ""}`);
  console.log(`  wolf held ${pct(b.wolfAtTable)} · wolf eliminated when held ${pct(b.wolfDeadWhenPresent)} · nobody eliminated ${pct(b.nobodyDead)} · several eliminated ${pct(b.multiElim)} · Blood Price ties ${pct(b.bloodPriceTies)} · cards moved/game ${b.movedPerGame.toFixed(1)}${b.bitten ? ` · bitten ${pct(b.bitten)}` : ""}${b.imago ? ` · Imago ${pct(b.imago)}` : ""}`);
  const lifts = Object.entries(b.held).filter(([r]) => ROLE[r]?.team === "werewolf" && r !== "werewolf").map(([r, h]) => `${ROLE[r].name} held ${pct(h.held)}: wolf side ${pct(h.wolfWinWhenHeld)} vs ${pct(h.wolfWinWhenNot)} not held`);
  if (lifts.length) console.log(`  ${lifts.join(" · ")}`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 1));
