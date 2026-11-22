/**
 * Latency and parity diagnostics over run directories (no play, no model calls):
 * - first day message per seat, in seconds after the day opened (timeline.messagesAt, aligned with the day chat), by the
 *   team of the card DEALT; median per team, and how often the last first-speaker was wolf-team;
 * - parity: wolf-team cards HELD at the count versus half the table; win counts for parity and non-parity games.
 *   npx tsx sim/research/latency.ts <runDir> [...]
 */
import { ROLE } from "../../shared/roles";
import { loadGames } from "./game";
const games = loadGames(process.argv.slice(2));
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const firsts: Record<string, number[]> = { centaur: [], werewolf: [], pyre: [] };
let lastIsWolf = 0, counted = 0;
const parity: Record<string, Record<string, number>> = { parity: {}, nonParity: {} };
for (const g of games) {
  const t0 = g.timeline.phases?.day, at = g.timeline.messagesAt ?? [];
  const day = g.chat.filter(m => m.phase === "day");
  const first: Record<number, number> = {};
  day.forEach((m, i) => { if (m.seat !== null && first[m.seat] === undefined && at[i] !== undefined && t0 !== undefined) first[m.seat] = (at[i] - t0) / 1000; });
  const team = (s: number) => { const d = g.seats.find(x => x.seat === s)!.dealt; return (ROLE[d] ?? Object.values(ROLE).find(r => r.name === d))?.team ?? "?"; };
  for (const [s, t] of Object.entries(first)) (firsts[team(+s)] ??= []).push(t);
  const order = Object.entries(first).sort((a, b) => a[1] - b[1]);
  if (order.length) { counted++; if (team(+order[order.length - 1][0]) === "werewolf") lastIsWolf++; }
  const held = g.seats.filter(s => s.endedOnTeam.startsWith("Werewolf")).length;
  const k = held * 2 >= g.players ? "parity" : "nonParity";
  parity[k][g.winningTeam] = (parity[k][g.winningTeam] ?? 0) + 1;
}
console.log(`${games.length} games. First day message (s after day opened), median [n]: ${Object.entries(firsts).map(([t, xs]) => `${t} ${med(xs).toFixed(1)} [${xs.length}]`).join(" · ")}`);
console.log(`last seat to speak for the first time was dealt a wolf-team card in ${lastIsWolf} of ${counted} games`);
console.log(`parity (wolf-team held >= half): ${JSON.stringify(parity.parity)}; non-parity: ${JSON.stringify(parity.nonParity)}`);
