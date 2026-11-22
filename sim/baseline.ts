/**
 * The no-skill baseline for a deck: the same engine, with every night move and every vote chosen at random. It shows
 * what the deck's mechanics do by themselves, so that play-test results can be read against it (how much better than
 * chance do talking players find a wolf; does a team win mostly whatever anyone does).
 *   npx tsx sim/baseline.ts <tournament.json> [games per deck = 20000]
 */
import { readFileSync } from "node:fs";
import { randomPlay } from "./random-play";

const [file, n = "20000"] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(file, "utf8")) as { tables: { label: string; deck: string[]; center: number; players: string[] }[] };
const seen = new Set<string>();
const pct = (x: number) => (Number.isFinite(x) ? `${(100 * x).toFixed(0)}%` : "n/a");
for (const t of spec.tables) {
  const label = t.label.replace(/#\d+$/, "");
  if (seen.has(label)) continue;
  seen.add(label);
  const b = randomPlay(t.deck, t.players.length, Number(n));
  console.log(`${label}  (${t.players.length} players, ${t.center} centre) random play, ${b.games} games`);
  console.log(`  winners: Centaur ${pct(b.win.centaur)}  Werewolf ${pct(b.win.werewolf)}  nobody ${pct(b.win.nobody)} · prophecy wins ${pct(b.prophecyWins)}`);
  console.log(`  wolf at table ${pct(b.wolfAtTable)} · wolf eliminated when present ${pct(b.wolfDeadWhenPresent)} · nobody eliminated ${pct(b.nobodyDead)} · cards moved per game ${b.movedPerGame.toFixed(1)}`);
}
