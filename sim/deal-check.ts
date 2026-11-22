/**
 * Regression check: are deals on the real server uniform? It opens a play-test table (the host sees the deal) with
 * bots in the other seats, then deals again and again through the app's own `game.start` and reads each deal from the
 * host's view, abandoning the round each time. It reports, per role, how often it lands at each position (seat or
 * centre card) against chance, a chi-square test, and the rate at which every wolf card lands in the centre.
 *   npx tsx sim/deal-check.ts [deals = 2000] [players = 5] [deck = werewolf,werewolf,sage,centaur,centaur,herald,rustler,sentry]
 * Exits non-zero if any role's positions fail the test at p < 0.001.
 */
import { run, token, view } from "./lib";

const [nArg = "2000", pArg = "5", deckArg = "werewolf,werewolf,sage,centaur,centaur,herald,rustler,sentry"] = process.argv.slice(2);
const N = Number(nArg), players = Number(pArg), deck = deckArg.split(",");
const center = deck.length - players;

const host = token();
const { code } = (await run("room.create", host, undefined, { name: "Checker", playtest: true })) as { code: string };
for (let i = 1; i < players; i++) await run("room.addBot", host, code);
await run("setup.setCenter", host, code, { count: center });
for (const r of (await view(code, host))!.settings.deck) await run("setup.removeRole", host, code, { role: r });
for (const r of deck) await run("setup.addRole", host, code, { role: r });
await run("setup.setTimer", host, code, { timer: "dusk", seconds: 120 });
await run("setup.setRule", host, code, { rule: "thiefMinPlayers", value: 3 });

const roles = [...new Set(deck)];
const counts = Object.fromEntries(roles.map(r => [r, Array(deck.length).fill(0)])) as Record<string, number[]>;
const wolves = deck.filter(r => r === "werewolf").length;
let allWolvesCentre = 0, hostSeat = Array(players).fill(0);
const t0 = Date.now();
for (let g = 0; g < N; g++) {
  await run("game.start", host, code);
  const v = (await view(code, host))!;
  const d = v.game!.playtestDeal!;
  [...d.dealt, ...d.center].forEach((r: string, pos: number) => counts[r][pos]++);
  if (d.center.filter((r: string) => r === "werewolf").length === wolves) allWolvesCentre++;
  hostSeat[v.game!.mine!.seat]++;
  await run("game.abandon", host, code);
  if ((g + 1) % 500 === 0) console.log(`  ${g + 1} deals (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

/** Upper tail of chi-square with k degrees of freedom (Wilson–Hilferty). */
function pChi(x: number, k: number) {
  const z = (Math.cbrt(x / k) - (1 - 2 / (9 * k))) / Math.sqrt(2 / (9 * k));
  const t = 1 / (1 + 0.2316419 * Math.abs(z)), poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const tail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * poly;
  return z >= 0 ? tail : 1 - tail;
}
const chi = (obs: number[], exp: number) => obs.reduce((a, x) => a + (x - exp) ** 2 / exp, 0);

let failed = false;
console.log(`\n${N} deals through game.start: ${players} players, ${center} centre, deck ${deck.join(" ")}`);
console.log(`position:         ${Array.from({ length: deck.length }, (_, i) => (i < players ? `s${i}` : `c${i - players}`).padStart(5)).join("")}`);
for (const r of roles) {
  const exp = (N * deck.filter(x => x === r).length) / deck.length, x = chi(counts[r], exp), p = pChi(x, deck.length - 1);
  if (p < 0.001) failed = true;
  console.log(`${r.padEnd(17)} ${counts[r].map(c => String(c).padStart(5)).join("")}   chi2 ${x.toFixed(1)} (df ${deck.length - 1}) p ${p.toFixed(3)}${p < 0.001 ? "  BIASED" : ""}`);
}
const choose = (n: number, k: number): number => (k < 0 || k > n ? 0 : k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k);
const expectAll = choose(center, wolves) / choose(deck.length, wolves);
console.log(`every werewolf in the centre: ${allWolvesCentre}/${N} = ${(100 * allWolvesCentre / N).toFixed(1)}% (chance ${(100 * expectAll).toFixed(1)}%)`);
const hs = chi(hostSeat, N / players), hp = pChi(hs, players - 1);
if (hp < 0.001) failed = true;
console.log(`host's seat: ${hostSeat.join(" ")}   chi2 ${hs.toFixed(1)} p ${hp.toFixed(3)}`);
console.log(failed ? "\nFAIL: a position is biased" : "\nok: deals are uniform");
process.exit(failed ? 1 : 0);
