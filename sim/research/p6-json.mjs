// Builds docs/research/results/players-6.json: the groups from p6-report.ts plus the narrative sections of players-6.md.
//   npx tsx sim/research/p6-report.ts sim/runs/p6-verify sim/runs/p6/* --json /tmp/p6groups.json && node sim/research/p6-json.mjs /tmp/p6groups.json
import { readFileSync, writeFileSync } from "node:fs";
const g = JSON.parse(readFileSync(process.argv[2], "utf8"));
for (const x of g.groups) if (x.roster === "V6") x.roster = "V6-setup";
const ww = ["werewolf", "werewolf"];
const out = {
  generatedBy: "sim/research/p6-report.ts + sim/research/p6-json.mjs", generated: new Date().toISOString(), players: 6,
  agents: "all seats Opus, medium effort", timers: { dusk: "60 coarse (90 in coarse3) / 8 fixed", turn: "8 coarse (10 in coarse3) / 2 fixed", day: 240, vote: 60 },
  spend: { games: 73, playersUsd: 267, judgeVerdicts: 146, judgesUsdApprox: 10 },
  headline: [
    "One well-supported roster: PY6 (werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket; 3 centre). 41 games; 6 of 8 fixed-scenario arms talk-live; all-PY6 judge means ToM 2.46, deception 2.76, path 2.88, noise 0.96. Flaw: wolves 2 of 38 fixed replays.",
    "No second or third good roster found at 6: five rosters rejected on coarse games; three scenarios built to be talk-live on other rosters (PE6, PF6, PY6L) swept 5-0 for the Centaurs.",
    "Parity bloc: 6 of 7 parity deals were wolf wins under plain Blood Price; fix: bloodPriceCondemned (hub-tested) or at most 3 wolf-team cards in 9.",
    "Opening statements moved PY6-S1 from Pyre 4 / wolves 1 to Centaurs 3 / Pyre 1 / wolves 1; without them honest players spoke first in most games (first-message rank 2.2-2.3 vs 4.7-5.3).",
    "Lesson: Opus tables turn motives into evidence; only lies that some player is motivated to keep telling survive the discussion.",
  ],
  rosters: {
    PY6: { name: "Pyre with a twin", recommended: true, deck: [...ww, "phoenix", "lure", "sage", "moonsage", "rustler", "centaur", "pickpocket"], centre: 3, rules: "defaults; arms: openingStatements on/off, burningDeniesWolves off (S2), bloodPriceCondemned on (S5)",
      games: { total: 41, natural: 3, fixedReplays: 38, fixedArms: 8 }, winsNatural: { pyre: 1, centaur: 1, werewolf: 1 }, winsFixed: { centaur: 21, pyre: 15, werewolf: 2 },
      concentration: { median: 0.8, bands: { majority: 15, plurality: 16, unanimous: 9, scattered: 1 } },
      judges: { verdicts: 82, tom: 2.46, deception: 2.76, path: 2.88, noise: 0.96, agreementMeanAbsDiff: { tom: 0.10, deception: 0.29, path: 0.20, noise: 0.12 }, howWonExact: "35/41", gamesWithTwoPointDisagreement: 0 },
      talkLiveArms: "6 of 8 (S1 off/on, S2 off/on/nodenial, S5); S4 talk-dead (path 1.9); S3 control degenerate" },
    TW6: { recommended: false, deck: [...ww, "sage", "moonsage", "herder", "strayherder", "rustler", "centaur", "sentry"], centre: 3, rules: "defaults", why: "parity bloc (4 wolf-team cards of 9)" },
    TW6c: { recommended: false, deck: [...ww, "moonsage", "sage", "rustler", "centaur", "sentry", "pickpocket", "drifter"], centre: 3, rules: { census: "allButOne", packCovers: true }, why: "honest-info-converged; parity" },
    SE6: { recommended: false, deck: [...ww, "counterfeiter", "notary", "moonsage", "rustler", "centaur", "sentry", "pickpocket"], centre: 3, rules: "defaults", why: "parity bloc in all 3 games; Counterfeiter forged once" },
    SO6: { recommended: false, deck: [...ww, "spooker", "pickpocket", "latecomer", "cutpurse", "drifter", "centaur", "sentry"], centre: 3, rules: "defaults", why: "predicted bad (noise); actually first-order reconstruction, Centaurs 2-0, noise 1.0" },
    PE6: { recommended: false, deck: [...ww, "phoenix", "embercarrier", "sage", "rustler", "centaur", "sentry", "pickpocket"], centre: 3, rules: "defaults; fixed scenario with openingStatements", why: "PE6-S1 swept 5-0: the dealt Phoenix holder, now a Centaur, revealed its dealt card" },
    GL6: { recommended: false, deck: ["glamour", "werewolf", "sage", "rustler", "centaur", "sentry", "pickpocket", "drifter", "cutpurse"], centre: 3, rules: "defaults", why: "path 1.25; too many honest looks" },
    PF6: { recommended: false, deck: [...ww, "phoenix", "falsewitness", "notary", "rustler", "centaur", "sentry", "pickpocket"], centre: 3, rules: { openingStatements: true }, why: "PF6-S1 swept 5-0: the Notary knew both roles" },
    PY6L: { recommended: false, deck: [...ww, "phoenix", "lure", "sage", "moonsage", "rustler", "centaur", "pickpocket", "latecomer"], centre: 4, rules: { openingStatements: true }, why: "amendment test: S3 + Latecomer still 5-0; the wolf told the late-swap story about its own card" },
    HU6: { recommended: false, deck: [...ww, "hush", "sage", "echo", "cutpurse", "pickpocket", "centaur", "sentry"], centre: 3, why: "not run: Hush cut kills the AI player's MCP connection (harness)" },
  },
  parity: { naturalDeals: 19, parity: { games: 7, werewolf: 6, centaur: 1 }, nonParity: { games: 12, centaur: 9, werewolf: 2, pyre: 1 } },
  timingTell: { openingStatementsOff: "mean first-message rank of 6 over 18 PY6 fixed replays", ranks: { centaur: 2.17, rustler: 2.17, pickpocket: 2.25, sage: 2.31, phoenix: 4.67, lure: 4.83, werewolf: 5.28 } },
  strategies: [
    { strategy: "Lure fakes a Sage read of Werewolf on the Phoenix", team: "pyre", appeared: 5, of: 18, sideWon: 4 },
    { strategy: "Phoenix reverse bluff: counter-claims and fights the vote", team: "pyre", appeared: 8, of: 18, sideWon: 7 },
    { strategy: "Phoenix baits openly (burn me / confession)", team: "pyre", appeared: 5, of: 18, sideWon: 1 },
    { strategy: "Lone wolf claims to be the dressed Phoenix", team: "werewolf", appeared: 10, of: 18, sideWon: 1 },
    { strategy: "Lone wolf truthfully explains the Lure/Phoenix setup", team: "werewolf", appeared: 5, of: 18, sideWon: 0 },
    { strategy: "Fake Pickpocket claim to explain a read away", team: "pyre/werewolf", appeared: 7, of: 18, sideWon: 3 },
    { strategy: "'A Phoenix would want the votes' used to classify the accused", team: "all", appeared: 18, of: 18 },
    { strategy: "Tie hedge proposed", team: "all", appeared: 18, of: 18, adopted: 0 },
    { strategy: "(opening on) Moonsage tells the truth about the dressed Phoenix to stop a burning", team: "werewolf", appeared: 4, of: 5, sideWon: 0 },
  ],
  games: [
    { label: "PY6-S1-fakesage#3", opening: "off", winner: "werewolf", crux: "lone wolf claims Phoenix last and exposes the Lure's impossible Sage claim", quotes: ["Alder: I was dealt Phoenix... Dov's Sage claim is just as impossible as Esme's Centaur claim", "Alder: Voting Dov: either you hit a wolf, or you stop a burning.", "Fenn: Alder is the Phoenix, Esme is the Lure... I'm switching to Dov."] },
    { label: "PY6-S1-fakesage#1", opening: "off", winner: "pyre", crux: "Phoenix double bluff", quotes: ["Esme: I'm actually the Phoenix... DON'T vote me", "Dov: A real Phoenix WANTS to be voted out — it would never say 'don't vote me'. That's a caught Werewolf grabbing the Phoenix excuse"] },
    { label: "PY6-S2-open#3", opening: "on", winner: "centaur", crux: "Sage's second-order step: a Moonsage would never expose a real wolf, so the co-claimant is the Lure and the accused the dressed Phoenix" },
    { label: "PY6-S5-twinheld#5", opening: "on", winner: "centaur", crux: "Moonsage tells the truth to stop a burning; the Sage turns it into proof of the wolf; 2-2 tie Dov+Cass, W 1 C 0" },
  ],
  notKnown: [
    "PY6 natural-deal balance (3 natural games only).",
    "How to give PY6's wolves a live game (hollowsage instead of moonsage; burningDeniesWolves off where the wolf is not the alternative suspect).",
    "Whether the opening-statements effect generalises (hub's 6p Lure scenario moved the other way).",
    "The Hush at 6 (harness bug).",
    "Whether requested variants R6-3, R6-4, R6-7 fix the PE6, PF6, PY6L sweeps.",
  ],
  requests: ["R6-1 bloodPriceCondemned on at 6", "R6-2 opening statements kept as an option, reported both ways", "R6-3 Ember-Carrier variant: dealt Phoenix holder stays Pyre", "R6-4 Notary variant learning only its pair statement", "R6-5 Hush harness fix", "R6-6 AI-table dusk 90 s", "R6-7 wolf-side late mover (Werewolf-team Latecomer twin)"],
  groups: g.groups,
};
writeFileSync("docs/research/results/players-6.json", JSON.stringify(out, null, 1));
console.log("groups", out.groups.length);
