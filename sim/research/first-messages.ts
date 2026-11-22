/** First day message delay and order by team of the DEALT card: npx tsx sim/research/first-messages.ts <runDir...> */
import { readFileSync } from "node:fs";
import { ROLES } from "../../shared/roles";
const teamOf = (n: string) => ROLES.find(r => r.name === n || r.id === n)?.team ?? "unknown";
import { loadGames } from "./game";
const games = loadGames(process.argv.slice(2));
const delays: Record<string, number[]> = {}, ranks: Record<string, number[]> = {};
let firstSpeaker: Record<string, number> = {};
for (const g of games) {
  const t = JSON.parse(readFileSync(`${g.dir}/timeline.json`, "utf8")); const day = t.phases?.day; if (day === undefined || !t.messagesAt) continue;
  const seen = new Map<string, number>();
  g.chat.forEach((m, i) => { if (m.phase === "day" && m.seat !== null && !seen.has(m.from)) seen.set(m.from, (t.messagesAt[i] ?? NaN) - day); });
  const order = [...seen.entries()].sort((a, b) => a[1] - b[1]);
  order.forEach(([name, d], k) => {
    const seat = g.seats.find(s => name.startsWith(s.name)); if (!seat) return;
    const team = teamOf(seat.dealt); (delays[team] ??= []).push(d / 1000); (ranks[team] ??= []).push(k + 1);
    if (k === 0) firstSpeaker[team] = (firstSpeaker[team] ?? 0) + 1;
  });
}
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const k of Object.keys(delays)) console.log(`${k.padEnd(9)} n=${delays[k].length} median first-message delay ${med(delays[k]).toFixed(1)} s, mean rank ${(ranks[k].reduce((a, b) => a + b, 0) / ranks[k].length).toFixed(2)}, spoke first in ${firstSpeaker[k] ?? 0} of ${games.length} games`);
