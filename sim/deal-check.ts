/**
 * Measures the server's deal: opens and starts tables through the app's own commands (no agents), reads each seat's
 * dealt card from that player's own view, and compares where cards land with a uniform shuffle.
 *   npx tsx sim/deal-check.ts [tables = 200] [outFile]
 * Half the tables list the deck with the wolves first (as tables.ts does), half with the wolves last, so a bias that
 * follows deck position shows up as a difference between the halves. Also records the seating (join order → seat)
 * and whether whole deals repeat (a fixed seed would repeat them).
 * The rooms are left to finish by themselves (very short timers, forced random play).
 */
import { writeFileSync } from "node:fs";
import { run, token, view } from "./lib";

const N = Number(process.argv[2] ?? 200), outFile = process.argv[3];
const DECK = ["werewolf", "werewolf", "sage", "centaur", "centaur", "herald", "herder", "sentry"]; // round1 deck A
const PLAYERS = 5, NAMES = ["P0", "P1", "P2", "P3", "P4"];
const rows: { order: string; deckOrder: string[]; dealt: string[]; center: string[]; seating: number[] }[] = [];

for (let n = 0; n < N; n++) {
  const order = n % 2 ? "wolves-last" : "wolves-first";
  const deckOrder = order === "wolves-first" ? DECK : [...DECK.slice(2), "werewolf", "werewolf"];
  const toks = NAMES.map(() => token());
  const { code } = (await run("room.create", toks[0], undefined, { name: NAMES[0] })) as { code: string };
  for (let i = 1; i < PLAYERS; i++) await run("room.join", toks[i], undefined, { code, name: NAMES[i] });
  await run("setup.setCenter", toks[0], code, { count: DECK.length - PLAYERS });
  for (const role of (await view(code, toks[0]))!.settings.deck) await run("setup.removeRole", toks[0], code, { role });
  for (const role of deckOrder) await run("setup.addRole", toks[0], code, { role });
  for (const [timer, seconds] of Object.entries({ dusk: 5, turn: 5, day: 30 })) await run("setup.setTimer", toks[0], code, { timer, seconds });
  const stored = (await view(code, toks[0]))!.settings.deck as string[];
  await run("game.start", toks[0], code);
  const dealt: string[] = Array(PLAYERS), seating: number[] = Array(PLAYERS);
  for (let i = 0; i < PLAYERS; i++) { const v = (await view(code, toks[i]))!; const mine = v.game!.mine!; dealt[mine.seat] = mine.dealt; seating[mine.seat] = i; }
  const center = [...stored]; for (const d of dealt) center.splice(center.indexOf(d), 1);
  rows.push({ order, deckOrder: stored, dealt, center, seating });
  if ((n + 1) % 25 === 0) console.log(`${n + 1} tables`);
}
if (outFile) writeFileSync(outFile, JSON.stringify(rows, null, 1));

const pct = (x: number, d: number) => `${((100 * x) / d).toFixed(1)}%`;
for (const order of ["wolves-first", "wolves-last"]) {
  const rs = rows.filter(r => r.order === order), n = rs.length;
  const noWolf = rs.filter(r => !r.dealt.includes("werewolf")).length, both = rs.filter(r => r.dealt.filter(x => x === "werewolf").length === 2).length;
  console.log(`\n${order} (stored deck ${rs[0].deckOrder.join(",")}), ${n} tables`);
  console.log(`  no wolf dealt to a player: ${noWolf} = ${pct(noWolf, n)} (uniform 10.7%) · both wolves at the table ${pct(both, n)} (uniform 35.7%)`);
  for (const role of [...new Set(DECK)]) {
    const atSeat = Array.from({ length: PLAYERS }, (_, s) => rs.filter(r => r.dealt[s] === role).length);
    const inCentre = rs.reduce((a, r) => a + r.center.filter(c => c === role).length, 0);
    const copies = DECK.filter(x => x === role).length;
    console.log(`  ${role.padEnd(9)} per seat ${atSeat.map(x => (x / n).toFixed(2)).join(" ")} · centre ${(inCentre / n).toFixed(2)}  (uniform: per seat ${(copies / 8).toFixed(2)}, centre ${((3 * copies) / 8).toFixed(2)})`);
  }
  const seatOf = Array.from({ length: PLAYERS }, (_, j) => Array.from({ length: PLAYERS }, (_, s) => rs.filter(r => r.seating[s] === j).length));
  console.log(`  seating: share of games each join position sits in seat 0..4 (uniform 0.20):`);
  seatOf.forEach((row, j) => console.log(`    joined ${j}: ${row.map(x => (x / n).toFixed(2)).join(" ")}`));
  const keys = new Map<string, number>(); for (const r of rs) { const k = r.dealt.join(",") + "|" + r.seating.join(","); keys.set(k, (keys.get(k) ?? 0) + 1); }
  console.log(`  distinct (deal, seating) outcomes: ${keys.size} of ${n}; most repeated ×${Math.max(...keys.values())}`);
}
process.exit(0);
