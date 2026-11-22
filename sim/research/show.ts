<<<<<<< HEAD
/** Prints the truth and public transcript of games: npx tsx sim/research/show.ts <runDir> <label> [--truth] */
import { loadGames, publicTranscript, truth } from "./game";
const [dir, label, opt] = process.argv.slice(2);
for (const g of loadGames([dir]).filter(g => !label || g.label === label)) { console.log(`#### ${g.label}`); console.log(truth(g)); if (opt !== "--truth") console.log(publicTranscript(g)); }
=======
/** Prints the truth and public transcript of one or more games: npx tsx sim/research/show.ts <runDir> <label> [--truth] */
import { loadGames, publicTranscript, truth } from "./game";
const [dir, label, ...rest] = process.argv.slice(2);
for (const g of loadGames([dir]).filter(g => !label || g.label === label)) {
  console.log(`\n######## ${g.label}`); console.log(truth(g)); if (!rest.includes("--truth")) console.log(publicTranscript(g));
}
>>>>>>> 3e31604fd8d6fc8603175b523ff980111625e29b
