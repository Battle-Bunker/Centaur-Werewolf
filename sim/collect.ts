/**
 * Gathers the results of a tournament's tables through MCP (each host's own view after the game) and prints the
 * measures used to judge a deck: who wins, how, and how much the night's movement and the day's talk mattered.
 *   npx tsx sim/collect.ts <outDir>
 * Writes <outDir>/results.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tool, type Table } from "./lib";

interface Seat { seat: number; name: string; dealt: string; endedHolding: string; endedOnTeam: string; votedFor: string; voteWasRandom: boolean; votesReceived: number; eliminated: boolean; won: boolean }
interface Result { headline: string; notes: string[]; winningTeam: string; eliminated: string[]; seats: Seat[]; centre: string[]; nightLog: string[] }
interface View { phase: string; chat: { from: string; text: string; phase: string }[]; result?: Result }

const out = process.argv[2];
const tables = JSON.parse(readFileSync(`${out}/tables.json`, "utf8")) as Table[];
const WOLF = new Set(["Werewolf", "Tracker"]);
const rows = [];
for (const t of tables) {
  const v = await tool<View>(t.seats[0].key, "room_view");
  if (v.phase !== "ended" || !v.result) { console.log(`${t.config.label} (${t.code}): not finished, phase ${v.phase}`); continue; }
  const r = v.result, day = v.chat.filter(m => m.phase === "day");
  const wolvesAtTable = r.seats.filter(s => WOLF.has(s.endedHolding));
  rows.push({
    label: t.config.label, code: t.code, deck: t.config.deck, center: t.config.center, players: t.seats.length,
    winningTeam: r.winningTeam, headline: r.headline, notes: r.notes, eliminated: r.eliminated,
    wolvesAtTable: wolvesAtTable.length, wolfEliminated: wolvesAtTable.some(s => s.eliminated),
    cardsMoved: r.seats.filter(s => s.dealt !== s.endedHolding).length,
    eliminatedHeldMovedCard: r.seats.some(s => s.eliminated && s.dealt !== s.endedHolding),
    wolfCardEndedInCentre: r.centre.some(c => WOLF.has(c)) && r.seats.some(s => WOLF.has(s.dealt) && !WOLF.has(s.endedHolding)),
    randomVotes: r.seats.filter(s => s.voteWasRandom).length,
    forcedNightMoves: r.nightLog.filter(l => l.includes("random: out of time")).length,
    messages: day.length, seats: r.seats, centre: r.centre, nightLog: r.nightLog, chat: day,
  });
}
writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 1));

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "n/a");
const byDeck = new Map<string, typeof rows>();
for (const r of rows) { const k = r.label.replace(/#\d+$/, ""); byDeck.set(k, [...(byDeck.get(k) ?? []), r]); }
console.log(`\n${rows.length} of ${tables.length} games finished\n`);
for (const [deck, gs] of byDeck) {
  const wins = (team: string) => gs.filter(g => g.winningTeam === team).length;
  console.log(`${deck}  (${gs.length} games, ${gs[0].players} players, ${gs[0].center} centre)`);
  console.log(`  winners: Centaur ${wins("centaur")}  Werewolf ${wins("werewolf")}  nobody ${wins("nobody")}  | extra wins: ${gs.flatMap(g => g.notes).length}`);
  console.log(`  wolf at table ${pct(gs.filter(g => g.wolvesAtTable > 0).length, gs.length)} · wolf eliminated when present ${pct(gs.filter(g => g.wolfEliminated).length, gs.filter(g => g.wolvesAtTable > 0).length)} · nobody eliminated ${pct(gs.filter(g => !g.eliminated.length).length, gs.length)}`);
  console.log(`  cards moved per game ${(gs.reduce((a, g) => a + g.cardsMoved, 0) / gs.length).toFixed(1)} · eliminated seat held a moved card ${pct(gs.filter(g => g.eliminatedHeldMovedCard).length, gs.length)} · messages per game ${(gs.reduce((a, g) => a + g.messages, 0) / gs.length).toFixed(0)} · forced moves ${gs.reduce((a, g) => a + g.forcedNightMoves, 0)} · random votes ${gs.reduce((a, g) => a + g.randomVotes, 0)}`);
  for (const g of gs) console.log(`    ${g.code}: ${g.headline}${g.notes.length ? " " + g.notes.join(" ") : ""}`);
}
