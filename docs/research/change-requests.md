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
