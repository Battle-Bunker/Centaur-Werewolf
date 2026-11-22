/**
 * The rules reference (docs/rules-reference.md): a complete, self-contained statement of the game as built, for a
 * strategist who has never seen the code. The fixed sections are written here; every card's entry is generated from
 * the role data in shared/roles.ts, so it cannot drift from the engine. `sim/make-rules-reference.ts` writes the file
 * and a test fails if the committed file is out of date.
 */
import { pickCount, ROLE, ROLES, TEAM_NAME, type Effect, type RoleDef, type StepDef } from "./roles";
import { DEFAULT_RULES, describeRules, RULE_DEFS } from "./settings";
import { TIMERS } from "./commands";
import { nightTurns } from "./engine";

const POOL: Record<string, string> = { self: "your own card", others: "another player's card", center: "a centre card", cw: "the card of the player clockwise of you" };
const pools = (s: StepDef) => s.pick!.pools.map(p => POOL[p]).join(" or ");
const targets = (s: StepDef) => {
  const n = s.pick!.count, wide = s.pick!.wideCenter;
  const base = n === 1 ? pools(s) : `${n} different cards (each ${pools(s)})`;
  return wide ? `${base} (${wide[1]} centre cards when the centre holds ${wide[0]} or more)` : base;
};

function effectWords(e: Effect, s: StepDef): string {
  switch (e.kind) {
    case "look": return e.targets === "picks" ? `sees ${e.reveal === "role" ? "the role" : "only the team"} of the chosen card${s.pick && s.pick.count > 1 ? "s" : ""}` : `sees ${e.reveal === "role" ? "the role" : "the team"} of ${e.targets.map(t => (t === "self" ? "their own (new) card" : "a referenced card")).join(", ")}`;
    case "swap": return e.a === "self" ? "swaps their own card with it" : "swaps the two cards";
    case "rotate": return "moves the chosen cards one place along (first to second's place, second to third's, third to first's), seeing none of them";
    case "learnSeats": return `learns which other seats were DEALT a card tagged "${e.tag}"${e.limit ? ` (only ${e.limit}, chosen at random)` : ""} (journal label "${e.label}")`;
    case "learnMoved": return "learns, for their own seat and each neighbour, whether that card has been moved so far tonight (not by whom, not to where, not what it is)";
    case "announce": return "publishes to everyone what the chosen card(s) show right now (at dawn under the Proclamations-at-dawn rule), without saying who proclaimed";
    case "count": return `learns how many cards tagged "${e.tag}" lie in the centre right now (the truth: never distorted)`;
    case "census": return "learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule";
    case "distort": return e.target === "card"
      ? `distorts the chosen card: until dawn every look at it (except Werewolf-team looks) shows ${e.value === "chosen" ? "the role they name" : "one random other role from the deck, drawn once"}; it travels with the card`
      : `veils the chosen player: tonight every centre card they look at shows ${e.value === "chosen" ? "the role named" : "a random wrong role, drawn at each look"}`;
    case "witness": return `sees what the ${ROLE[e.by]?.name ?? e.by} proclaimed so far tonight (or that nothing was)`;
    case "forge": return `adds a forged proclamation of the named role at the chosen centre card(s), published at dawn exactly as the ${ROLE[e.as]?.name ?? e.as}'s, in random order with the real ones`;
    case "overhear": return "names a role; receives a copy of everything the first player clockwise who was DEALT it learned tonight (or, if nobody was, a ghost result per the table rule)";
    case "bite": return "bites the player at the looked-at seat: unless their card is on the Werewolf team, they join the Werewolf team at dawn (told privately)";
    case "mark": return e.public ? `lays ${e.label.toLowerCase()} on the chosen player (bound to THIS card; shown to everyone at dawn, not who laid it)` : `binds this card to the chosen player's seat (${e.label.toLowerCase()}, private)`;
  }
}

function stepWords(s: StepDef): string {
  const parts: string[] = [];
  if (s.onlyIfAlone) parts.push(`only if no other player was dealt a "${s.onlyIfAlone}" card`);
  if (s.pick) parts.push(`chooses ${targets(s)}`);
  if (s.names) parts.push(s.names === "deck" ? "names any role in the deck" : "names a role in the deck that acts at night and is not of the pack (not itself)");
  parts.push(s.effects.map(e => effectWords(e, s)).join("; then "));
  const kind = s.optional ? "OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)" : s.pick || s.names ? "MANDATORY" : "automatic";
  return `*${s.title}* (${kind}): ${parts.join("; ")}.`;
}

const WIN: Record<string, string> = {
  eliminated: "wins if eliminated (alongside whatever team result)",
  markEliminated: "wins if the seat marked by THIS card is eliminated and the holder is not",
  markWins: "wins exactly when the seat bonded to THIS card wins (after the curse)",
  keystone: "wins if not eliminated and no other creature or Imago is eliminated; if eliminated, no other creature wins",
};

function card(r: RoleDef, turnPos: Map<string, number>): string {
  const lines: string[] = [];
  const wolf = r.tags.includes("wolf"), pack = r.tags.includes("pack");
  const turn = r.twinOf ? ROLE[r.twinOf] : r;
  lines.push(`### ${r.name} (\`${r.id}\`)`);
  lines.push("");
  lines.push(`- **Team:** ${TEAM_NAME[r.team]}. **Counts as a Werewolf:** ${wolf ? "yes" : "no"}.${pack ? " **Pack:** wakes knowing the other pack seats and gets the census." : ""} Tags: ${r.tags.length ? r.tags.join(", ") : "none"}. Copies allowed: up to ${r.max}.`);
  lines.push(`- **Night:** ${r.steps && turn.wake !== undefined ? `${r.twinOf ? `acts in the ${turn.name}'s turn (a shadow twin: one public turn for both)` : "has its own turn"}, wake ${turn.wake} (position ${turnPos.get(turn.id)} of the full roster's night order).` : "no night action."}`);
  for (const s of r.steps ?? []) lines.push(`  - ${stepWords(s)}`);
  lines.push(`- **A look at this card shows:** ${r.looksAs ? `a ${ROLE[r.looksAs].name} (it passes for its original), except to Werewolf-team looks` : "this card"}${r.looksAs ? "" : ", unless distorted"}.`);
  const powers: string[] = [];
  if (r.vote?.weight) powers.push(`the holder's vote counts ${r.vote.weight} times`);
  if (r.vote?.protectsTarget) powers.push("the holder's vote target cannot be eliminated");
  if (r.vote?.takesTargetDown) powers.push("if the holder is eliminated, their vote target is too");
  if (r.chat === "signed") powers.push("once, the player DEALT it posts a free-text message sealed \"sent by the player DEALT Signet\" (chat_sendSigned)");
  if (r.chat === "report") powers.push("once, the player DEALT it posts a sealed report the game composes from its night look (chat_sendReport)");
  if (r.chat === "forge") powers.push("once, the player DEALT it posts a forged Signet or Notary seal, identical to a real one until the end (chat_forgeSeal)");
  if (r.dayPower === "swap") powers.push("the player DEALT it may queue a swap of two other players' cards during discussion or the vote; it happens as the vote ends, before counting (day_queueSwap)");
  if (r.dayPower === "cut") powers.push("once, the player DEALT it may cut another player off for the cut length, exactly as a dropped connection (day_cutLine)");
  lines.push(`- **Day / vote / chat powers:** ${powers.length ? powers.join("; ") : "none"}.`);
  const win: string[] = [];
  if (r.win) win.push(`its holder ${WIN[r.win]} (a creature rule: lost if bitten)`);
  else win.push(`with the ${TEAM_NAME[r.team]}`);
  if (r.decoy) win.push(`if its holder is eliminated, the ${TEAM_NAME[r.team]} wins the main result outright`);
  if (r.curse) win.push("every player whose own vote went to an eliminated holder loses (the curse)");
  if (r.metamorph) win.push("if the card DEALT to this seat is moved at night, that seat becomes an Imago at dawn (a creature that wins only if eliminated)");
  lines.push(`- **Win:** ${win.join("; ")}.`);
  lines.push(`- **Card text:** ${r.rules}`);
  return lines.join("\n");
}

export function rulesReference(): string {
  const order = nightTurns(ROLES.map(r => r.id));
  const turnPos = new Map(order.map((r, i) => [r, i + 1]));
  const byTeam = (t: string) => ROLES.filter(r => r.team === t);
  const ruleRows = describeRules(DEFAULT_RULES).map(r => {
    const def = RULE_DEFS.find(d => d.id === r.rule)!;
    const values = def.kind === "boolean" ? "on / off" : def.kind === "choice" ? def.options.map(o => o.value).join(" / ") : `${def.min} to ${def.max}`;
    return `| \`${r.rule}\` | ${r.title} | ${JSON.stringify(r.value)} | ${values} | ${r.means} |`;
  });
  return `# Centaur Werewolf: rules reference

This file is generated (\`npx tsx sim/make-rules-reference.ts\`) from the engine's own data; a test fails if it is stale.
It states the game exactly as built. Design history: docs/design/synthesis.md and docs/design/owner-directions.md.

## 1. Setup

- 3 to 12 players. The deck holds one card per player plus 3 to 6 centre cards (a room setting, default 3). Any card may
  appear up to 12 times. Each player is dealt one card face down; the rest lie face down in the centre.
- Seating is a random circle (seat 0 to n-1, clockwise). Every game records its shuffle seed (shown after the game).
- A **play-test table** (chosen at creation, shown to everyone) lets the host fix the seed, the seating or the exact
  deal, and see the deal. Ordinary tables cannot.

## 2. Phases and timers

| Phase | What happens | Ends |
| --- | --- | --- |
| Night: Dusk | Everyone reads their card and may queue their night decisions. | Dusk timer (${TIMERS.dusk.min}-${TIMERS.dusk.max} s, default 20) |
| Night: turns | One turn per night role in the deck, in wake order, each exactly the turn length (${TIMERS.turn.min}-${TIMERS.turn.max} s, default 12), **whether or not anyone holds that card**. A shadow twin acts in its original's turn. Everyone sees which turn it is. Each player acts in the turn of the card they were DEALT, even if it has been moved. Undecided steps at the end of a player's turn get a uniformly random legal decision. | Last turn |
| Dawn | Proclamations are published (in random order under the dawn rule); a public mark nobody made (an unheld Cuckoo's egg) is laid on a random seat; bitten players and Imagos are told privately. | Immediately |
| Discussion | Chat. Players mark themselves ready. A Moon-Thief may queue its swap; a Hush may cut. No voting. | Its timer (${TIMERS.day.min}-${TIMERS.day.max} s, default 300), the host, or every seated human ready |
| Vote | Each seated player votes for one other player and may change it. Votes are secret until the end; only "has voted" is public. Chat closed unless the rule opens it. | Its timer (${TIMERS.vote.min}-${TIMERS.vote.max} s, default 20) or every seated human has voted |
| Count | Missing votes are cast uniformly at random (marked "did not vote in time"). The Moon-Thief's swap happens. Then the resolution order below. | |

## 3. Table rule settings

| Rule | Title | Default | Values | Meaning (at the default) |
| --- | --- | --- | --- | --- |
${ruleRows.join("\n")}

## 4. Information, looks and movement

- **A look shows a card as it is at that moment**, as seen by that viewer. Later moves may change what is there.
- **Cards move**: swaps, rotations and the Moon-Thief's day swap move cards between seats and the centre. A moved card
  carries its team, its win rule and anything bound to it (an egg, a bond, a distortion token). Nobody is told their
  card moved (the Sentry may detect *that* a nearby card moved; nothing detects direction or destination).
- **You act by the card you were DEALT; you win by the card you HOLD at the count** (unless bitten or an Imago).
- **Card instances**: every physical card is distinct even when several copies of a role exist; marks bind to the
  physical card.
- **What a look shows**, in order: a passing twin shows its original; then the latest card distortion (Glamour: a chosen
  role; Will-o'-Wisp: one random wrong role); then, for a look at a centre card, the viewer's veil (Mistweaver: a chosen
  role; Fogbank: a random wrong role at each look). **Werewolf-team looks and the Herder's count always see the truth.**
  Team-only looks show the team of the role seen. Proclamations publish what their maker saw. Conditional plans branch
  on what the actor saw. Distortions last until dawn.
- **Proclamations** (Herald, Pale Herald) are anonymous; a Forger adds forged ones indistinguishable from them.
- **Seals**: a sealed chat message reads "The game confirms this was sent by the player DEALT <role>". A Counterfeiter's
  forgery is identical until the game ends. The seal proves the claimed DEALT role of the sender, nothing about the card
  held now.
- **Presence**: a player shows offline after 16 s without a heartbeat. A Hush's cut makes its victim's connection fail for
  the cut length; others see exactly what a real drop looks like. Nothing a cut player sends goes through; a vote they
  could not cast becomes random. Only the results reveal cuts.

## 5. How a game is decided (in this order)

1. **Swap.** The Moon-Thief's queued swap is applied.
2. **Tally.** Each vote weighs by the voter's HELD card (Chiron: 2). Every seat tied on the most votes is eliminated, if
   that is at least the "Votes to eliminate" rule (default 2). Otherwise nobody is.
3. **Teams.** A bitten seat is on the Werewolf team and loses creature rules; an Imago is a creature; everyone else is on
   the team of the card they hold.
4. **Main result.**
   - (a) If an eliminated player holds a decoy (Stalking Horse), its team (Werewolf) wins.
   - (b) Else, if no player holds a Werewolf card: Centaurs win if nobody is eliminated; otherwise the surviving
     Werewolf-team players win; if there are none, no team wins.
   - (c) Else, with Blood Price: Centaurs win only if W > C (W = Werewolf cards eliminated, C = Centaur-team players
     eliminated). Without it: Centaurs win if W ≥ 1. Otherwise the Werewolf team wins.
   - Every member of the winning team wins, alive or dead. Allies, creatures, Imagos and bitten players count in
     neither W nor C. Eliminating a Werewolf-team card that is not a Werewolf never wins for the Centaurs.
5. **Creatures** (alongside the main result): Sporeling holder and Imagos win if eliminated; the Cuckoo holder wins if
   its card's egged seat is eliminated and they are not; the Elderbark holder wins if alive and no other creature is
   eliminated. An eliminated Elderbark denies every other creature.
6. **Curse.** Every player whose own (non-random, unless the rule says so) vote went to an eliminated Sporeling holder
   loses.
7. **Oxpecker.** Its holder wins if its card's bonded seat is a winner after step 6 and no Elderbark was eliminated; the
   curse then applies to it.

**Count as Werewolves:** ${ROLES.filter(r => r.tags.includes("wolf")).map(r => r.name).join(", ")}.
**Werewolf team but not Werewolves:** ${byTeam("werewolf").filter(r => !r.tags.includes("wolf")).map(r => r.name).join(", ")}.

## 6. Night order (the full roster)

${order.map((r, i) => `${i + 1}. ${ROLE[r].name} (wake ${ROLE[r].wake})${ROLES.filter(t => t.twinOf === r).map(t => ` + ${t.name}`).join("")}`).join("\n")}

Roles with no night action: ${ROLES.filter(r => !r.steps).map(r => r.name).join(", ")}.

## 7. Every card

${(["werewolf", "centaur", "wild"] as const).map(t => `## ${TEAM_NAME[t]}\n\n${byTeam(t).map(r => card(r, turnPos)).join("\n\n")}`).join("\n\n")}
`.replace(/\n{3,}/g, "\n\n");
}

/** For tests: how many targets a step takes at a given centre size. */
export const targetsAt = (s: StepDef, center: number) => pickCount(s, { players: 5, center });
