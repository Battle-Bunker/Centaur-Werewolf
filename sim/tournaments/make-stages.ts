/**
 * Writes the play-test decks of docs/design/synthesis.md section 5 as tournament files, one per stage:
 *   stage1-controls.json   C1 (5/3 and 5/6) and C2 (7/4), each in three rule arms: legacy, +Blood Price, +Blood Price and Census
 *   stage2-mechanics.json  T1 to T6, one mechanic per deck, default rules
 *   stage3-combos.json     X1 (5/3) and X2 (7/6), default rules
 * Every arm of a deck gets the same deal seeds (seed 1000*deck + n), so arms differ only in their rules. A table with a
 * seed is a play-test table (its host sees the deal). Run:  npx tsx sim/tournaments/make-stages.ts [tables per arm = 4]
 * For the strong/weak pairings of the test plan, add "agents": { "byTeam": { ... } } to a file or table (see arena.ts).
 */
import { writeFileSync } from "node:fs";
import { recommendedDeck } from "../../shared/roles";
import { LEGACY_RULES } from "../../shared/settings";

const PER_ARM = Number(process.argv[2] ?? 4);
const FIVE = ["Alder", "Bryn", "Cass", "Dov", "Esme"], SEVEN = [...FIVE, "Fen", "Greer"];
const timers = { dusk: 120, turn: 12, day: 420 };
interface Arm { label: string; deck: string[]; center: number; players: string[]; rules?: Record<string, unknown> }
const ARMS_RULES: [string, Record<string, unknown>][] = [["legacy", { ...LEGACY_RULES }], ["bp", { ...LEGACY_RULES, bloodPrice: true }], ["bp-census", {}]];

function tables(arms: Arm[], deckNo: (a: Arm) => number) {
  return arms.flatMap(a => Array.from({ length: PER_ARM }, (_, n) => ({ ...a, label: `${a.label}#${n + 1}`, seed: 1000 * deckNo(a) + n + 1, ...(a.rules && Object.keys(a.rules).length ? {} : { rules: undefined }) })));
}
const write = (name: string, about: string, ts: unknown[]) => writeFileSync(new URL(`./${name}.json`, import.meta.url), JSON.stringify({ about, timers, tables: ts }, null, 1) + "\n");

// ── stage 1: controls ──
const c1 = ["werewolf", "werewolf", "sage", "centaur", "centaur", "herald", "rustler", "sentry"];
const controls: [string, string[], number, string[]][] = [
  ["C1-control5x3", c1, 3, FIVE],
  ["C1-control5x6", [...c1, "centaur", "farrier", "herder"], 6, FIVE],
  ["C2-control7x4", recommendedDeck(7, 4), 4, SEVEN],
];
const stage1: Arm[] = controls.flatMap(([label, deck, center, players]) => ARMS_RULES.map(([arm, rules]) => ({ label: `${label}-${arm}`, deck, center, players, rules })));
write("stage1-controls", "Control decks in three rule arms (legacy; +Blood Price; +Blood Price and Census, i.e. the defaults). Same deal seeds across arms.", tables(stage1, a => controls.findIndex(c => a.label.startsWith(c[0])) + 1));

// ── stage 2: one mechanic per deck ──
const stage2: Arm[] = [
  { label: "T1-horse5x3", center: 3, players: FIVE, deck: ["werewolf", "stalkinghorse", "sage", "centaur", "centaur", "rustler", "sentry", "herder"] },
  { label: "T2-glamour5x4", center: 4, players: FIVE, deck: ["glamour", "werewolf", "sage", "centaur", "centaur", "herald", "rustler", "farrier", "sentry"] },
  { label: "T3-eavesdropper7x4", center: 4, players: SEVEN, deck: ["werewolf", "eavesdropper", "tracker", "sage", "centaur", "centaur", "herald", "rustler", "farrier", "herder", "sentry"] },
  { label: "T4-biter7x3", center: 3, players: SEVEN, deck: ["werewolf", "biter", "sage", "herald", "centaur", "centaur", "rustler", "farrier", "herder", "sentry"] },
  { label: "T5-thief-forger5x5", center: 5, players: FIVE, deck: ["werewolf", "moonthief", "forger", "herald", "sage", "centaur", "centaur", "rustler", "farrier", "sentry"], rules: { thiefMinPlayers: 5 } },
  { label: "T6-wildwood5x4", center: 4, players: FIVE, deck: ["werewolf", "werewolf", "sage", "centaur", "rustler", "sentry", "sporeling", "cuckoo", "elderbark"] },
];
write("stage2-mechanics", "One defector mechanic (or the Wildwood) per deck, default rules. T5 lowers the Moon-Thief table size to 5.", tables(stage2, a => 10 + stage2.indexOf(a)));

// ── stage 3: combinations ──
const stage3: Arm[] = [
  { label: "X1-combo5x3", center: 3, players: FIVE, deck: ["werewolf", "glamour", "stalkinghorse", "sage", "centaur", "herald", "sentry", "sporeling"] },
  { label: "X2-combo7x6", center: 6, players: SEVEN, deck: ["werewolf", "eavesdropper", "biter", "stalkinghorse", "sage", "herald", "centaur", "centaur", "farrier", "sentry", "moth", "cuckoo", "oxpecker"] },
];
write("stage3-combos", "Combinations: X1 at 5/3 and the full ecosystem X2 at 7/6, default rules.", tables(stage3, a => 20 + stage3.indexOf(a)));
console.log("wrote stage1-controls.json, stage2-mechanics.json, stage3-combos.json");
