# Change requests from the balance research

Until the build session hands over, the research lead does not edit shared/ or convex/. Each request states the exact
change, why, and the predicted effect. Status in brackets.

## CR-0. Convex typecheck blocked by shared/reference.test.ts [resolved upstream]
At the start of this work `shared/reference.test.ts` imported `node:fs`, which the Convex deploy typecheck rejects
(TS2591). The local backend was redeployed with `--typecheck=disable`. After the merge of 8fdef55 the import is gone
and `tsc -p convex` passes; nothing to do.

## CR-1. Rules reference, section 5 and the Dawn row, describe retired cards [doc bug]
After 8fdef55 (Pyre, copiers; Sporeling, Moth, Elderbark retired), docs/rules-reference.md still says, in section 5
"How a game is decided": "Creatures (alongside the main result): Sporeling holder and Imagos win if eliminated ... the
Elderbark ...", step 6 "Curse" (Sporeling) and step 7 refers to the Elderbark; section 3 of the resolution never lists
"the burning" (the Pyre's win and its denial of the wolves), although the Pyre cards say "see section 5"; the phase
table's Dawn row mentions Imagos. The engine (shared/engine.ts `resolveVote`) and docs/design/owner-directions.md section
9 give the real order: swaps (Moon-Thief, then embers) -> tally (Heavy Hand) -> teams -> main result -> the burning ->
loners (Cuckoo, then Oxpecker). **Change:** regenerate section 5 and the Dawn row from that order. **Why:** players
(and AI players, via the MCP rules text, which should be checked for the same staleness) read it to plan.

## CR-2. `cutDuringVote` default off [proposal]
**Change:** default `cutDuringVote` to false (a Hush may cut only during the discussion, and a cut ends when the vote
opens). **Why:** a cut at the start of the vote phase turns the victim's vote random after all talk is over: power
that decides the outcome after the talking (calibration principle, card-calibration.md). In the discussion, a cut is
belief power (it silences a voice; others can relay) and is fine. **Predicted effect:** the Hush goes from "deletes a
key Centaur vote whatever was said" to a tempo card; its holder's best use becomes cutting the Sage before it claims.

## CR-3. Ember-Carrier: move the ember from the vote's end to the night [proposal; the build session is redesigning it]
**Current:** queued during discussion/vote; as the vote ends a Phoenix card swaps with the chosen seat, so whoever the
table is about to eliminate becomes the Phoenix. The owner predicted this makes the Pyre always win; I agree (X2 in
predictions.md) and will measure it once (3 replays of one fixed scenario) as a check on the degeneracy instrument.
**Proposed:** "Ember-Carrier (night, in the Kindler turn, after the brood gathers): you may swap a Phoenix card (held,
else from the centre) with one other player's card. Neither holder is told." The Pyre then knows where the Phoenix is
and the new holder does not; the Pyre must get that seat voted out by talk, and the table can reason about who
pushes whom. **Predicted effect:** the Pyre's win share falls from near-certain (whenever the Phoenix is held) to
about a quarter, decided in the discussion. Alternative if a day power is wanted: the ember must be queued before the
first player marks ready, and the dawn of the vote phase announces publicly "an ember was carried" (not where), so the
table can still answer it by talk.

## CR-4. Moon-Thief: same structure as the ember [proposal; being switched off by default upstream]
Same after-talk problem (X1). If it is kept, the same fix applies: the swap is queued at night or locked before anyone
is ready, so the table's consensus is not self-defeating.

## CR-5. Scenario replay hook [request already in flight]
The research runner builds fixed scenarios on what exists: `setup.fixDeal { seed, seats, cards }` and night plans
queued by the runner with each seat's own key during Dusk (agents are not given the planning tools). What it cannot
fix: the night's random draws use the secure generator (Will-o'-Wisp/Fogbank draws, the Eavesdropper's ghost targets,
the census "three" subset, the unheld Cuckoo's egg, the dawn order of several proclamations). Until the hook lands,
fixed scenarios avoid those cards and states, and replays are checked by a fingerprint of the deal and night log.
**Wanted from the hook:** the seed also drives every night draw, and the result carries the scenario fingerprint.

## CR-9. Parity bloc: "Blood Price counts the condemned" [proposal, pre-registered 2026-11-22; new rule option, default off]

**Problem (from the 6- and 8-player sessions).** When wolf-team holders are half the table (3 of 6, 4 of 8), the wolf
team votes as a bloc for one Centaur while the Centaurs vote a wolf: a tie, both eliminated, W = 1, C = 1, and under
Blood Price (Centaurs need W > C) the wolves win whatever is said. Deal-determined: excluded by the primary target.

**Constraint.** Do not restore the free hedge Blood Price removed: a table unsure between suspects A and B must not be
able to tie them both and win for free.

**Options considered (a small game-theory check of each).**
1. *A tie eliminates nobody.* At parity the bloc forces the tie, nobody is eliminated, a wolf is held: wolves still win.
   Fails.
2. *Elimination needs a majority of all votes.* 3-3 eliminates nobody: wolves win. Fails; it also raises scatter.
3. *Allies count against the wolves in W v. C when they vote in the bloc.* Fixes only parity reached with non-Werewolf
   allies; a parity of Werewolf cards (3 Werewolves of 6) is untouched. Partial.
4. *Bloc caps / vote weighting.* Any cap the rules can state without hidden teams also caps an honest Centaur majority;
   weighting by hidden team is option 5 in disguise. Rejected as blunter.
5. **Condemned Blood Price (chosen).** "In the Blood Price comparison, an eliminated Centaur-team player counts in C
   only if at least one vote on them came from a player NOT on the Werewolf team at the count." (Teams as for Blood
   Price itself: held card, bitten = Werewolf team; Pyre and loners are not on it.)
   - *Parity bloc:* the Centaur X received only wolf-team votes, so C = 0, W = 1: the Centaurs win. The bloc no longer
     wins by arithmetic; the wolves must PERSUADE at least one non-wolf to vote X (talk decides).
   - *Free hedge stays dead:* a deliberate Centaur hedge puts Centaur votes on both suspects, so the innocent counts:
     W = 1, C = 1, a loss, exactly as now.
   - *Secret ballot:* the rule reads the actual (secret) ballots at the count, like Blood Price reads the hidden cards;
     nothing new is revealed before the result. Players reason "if every one of us votes the wolf, a bloc against one
     of us cannot win": unanimity among the honest is rewarded, which also serves target 2 (consensus).
   - *Non-parity games:* unchanged unless a Centaur is eliminated by wolf votes alone, which only happens in a tie the
     wolves forced; the rule then sides with the Centaurs, as intended.
   - *Exploits checked:* wolves cannot fake a "non-wolf vote" (team is read from the held card). A Centaur unknowingly
     holding a wolf card votes as a wolf-team player for this purpose (consistent with Blood Price counting cards).
     A Pyre player's vote does condemn (Pyre are not wolf team), so the Pyre can still make a Centaur count.
**Prediction.** In a 6-player parity scenario where the Centaurs have correctly identified a wolf: rule OFF, wolves win
4-5 of 5 (the reported pattern); rule ON, the wolves win only by pulling a Centaur vote: wolves about 1-2 of 5, path
dependence >= 2.5. Elsewhere: no measurable change. Rule name: `bloodPriceCondemned` (boolean, default false).

## CR-10. Speaking order artefact: "Opening statements" [proposal; pre-registered 2026-11-22]

**Evidence (my 43 games: pilot, coarse 1, fine 1; 248 first messages).** Mean normalised rank of a seat's first
message: Centaur team 0.29 (median first message 16 s into the day), wolf side 0.72 (25 s), Pyre 0.70 (28 s), Echo 0.77.
The strategy tagger found the Centaurs using a "claim-timing tell" (late or hedged claims read as guilt) in 37 of 43
games, decisive in 11. Part of this is a legitimate tactic (liars wait to fit their claim to others'), part is that an
AI composing a lie takes longer than one reporting the truth. **Proposal (rule option `openingStatements`, default
off):** the discussion opens with a statement round: each player's FIRST message is held and all are revealed together
(in random order) once every seated player has posted one or after 45 s; ordinary chat follows. **Prediction:** the
claim-timing tell drops out as decisive; the wolves' share in 5-player rosters rises by about a tenth; the census
backward-induction argument becomes stronger (the wolf can no longer wait to see claims), so pair it with
`census: "allButOne"`. Owner's taste question too: simultaneous claims are a known human mechanic.
