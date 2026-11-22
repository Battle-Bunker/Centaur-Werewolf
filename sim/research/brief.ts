/** One block per judged game: result line, both judges' scores and labels, judge 1's summary, vote tally.
 *   npx tsx sim/research/brief.ts <runDir> [labelPrefix] */
import { existsSync, readFileSync } from "node:fs";
import { loadGames, seatOf, truth } from "./game";
const [dir, pre] = process.argv.slice(2);
for (const g of loadGames([dir]).filter(g => !pre || g.label.startsWith(pre))) {
  const js = [1, 2].map(k => `${g.dir}/judge-${k}.json`).filter(existsSync).map(f => { const j = JSON.parse(readFileSync(f, "utf8")); return j.verdict ?? j; });
  const tally = new Array(g.players).fill(0); for (const s of g.seats) { const t = seatOf(s.votedFor); if (t !== null) tally[t]++; }
  console.log(`\n## ${g.label}: ${truth(g).split("\n")[0].replace("RESULT: ", "")}  votes [${tally.join(",")}]`);
  for (const j of js) console.log(`   tom ${j.tomRequired} dec ${j.deceptionCleverness} path ${j.pathDependence} noise ${j.noise} ${j.howWon} | ${j.howWonLabel}`);
  if (js[0]) console.log(`   ${js[0].summary}`);
}
