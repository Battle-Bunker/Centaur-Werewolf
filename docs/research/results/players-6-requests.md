# Players-6: change requests for the hub (cards and rules I may not edit)

Each request: the change, the evidence (all-Opus games), the predicted effect. Evidence details in players-6-log.md.

## R6-1. Rule: `bloodPriceCondemned` on at 6 players (or keep wolf-team cards at most 3 of 9)
- Evidence: 6 of the 7 parity deals in my coarse games (TW6#2-3, SE6#1-3, TW6c#1) were wolf wins, 5 of them a
  3-3 Blood Price tie forced by the wolf team (judges path 1-2); the exception (TW6c#3) was a twin that did not join. The hub then confirmed the rule option on
  a 6-player parity scenario (off: wolves 3-0; on: Centaurs 4, wolves 1, talk-live).
- Predicted effect: removes the guaranteed parity win; decks with twins and seals (4 wolf-team cards in 9, 65% parity
  deals) become playable.

## R6-2. Rule: opening statements at 6 players: keep it as an option, report both ways
- Evidence (same deal and night, 5 replays each): PY6-S1 fake Sage: off Pyre 4 / wolves 1, on Centaurs 3 / Pyre 1 /
  wolves 1 (the lone wolf must commit blind and lied with a detail it could not know); PY6-S2 two wolf reads: off
  Pyre 3 / Centaurs 2, on Centaurs 3 / Pyre 2. With it off, honest players speak first in nearly every game (mean
  first-message rank 2.2-2.3 versus 4.7-5.3 for defectors), a tell every table uses. The hub's own 6p Pyre scenario
  moved the other way (towards the Pyre). It changes who is favoured scenario by scenario, so it is a real design
  lever, not a neutral fix; at 6 it widened S1's outcome spread to three winners in five.

## R6-3. Variant Ember-Carrier ("the brood's mark") [engine change]
- Change: as now, but the player DEALT the Phoenix stays on the Pyre (wins if a Phoenix burns) even after the ember
  moves the card away.
- Evidence: PE6-S1 swept Centaurs 5-0 (path 1.6): once carried away, the dealt Phoenix holder became a Centaur and
  honestly revealed its dealt card, decoding the swap with the Sage and the Sentry. The same "robbed player turns
  witness" mechanism decided V6#1, SO6#2 and every Pickpocket theft in my games.
- Predicted effect: the old holder keeps lying, the swap stays deniable; PE6-S1 becomes talk-live (Centaurs 2-3 of 5).

## R6-4. Variant Notary that learns only its pair statement [engine change]
- Change: the Notary reads two players and learns only "at least one of A's and B's cards is a <role>" (the role
  chosen as now), like the amended Herald; it seals exactly that.
- Evidence: PF6-S1 swept Centaurs 5-0 (path 1.0): the sealed report was ambiguous, but the Notary knew both roles and
  said them in its opening; the forger's late seal could not compete with a specific, cross-checked chat claim.
- Predicted effect: the honest Notary's claim becomes as ambiguous as its seal; a False Witness or Counterfeiter forgery
  becomes a real duel of pair statements.

## R6-5. Harness: a Hush cut must not drop an AI player's MCP connection for good
- Reported by the 7-player session; blocks the communications-interrupt family at every size. My HU6 roster (Hush,
  Echo, Cutpurse, Pickpocket) is pre-registered and untested for this reason.

## R6-6. Harness: coarse games lose early-turn plans to forced random moves
- Evidence: with dusk 60 s and turn 8 s, the Pyre's wake-5 step (Lure dress, Ember carry) was a forced random move in
  PY6#1, PY6#2 and PE6#1 (the agents did not queue in time). Dusk 90 s / turn 10 s fixed it in coarse pass 3.
- Request: default AI-table dusk 90 s in the README's coarse template.

## R6-7. A wolf-side late mover (e.g. a Werewolf-team twin of the Latecomer) [new card]
- Evidence: S3 control (3-0) and PY6L-S3 (Latecomer in the deck, 5-0, path 0.9): two honest looks at an unmoved wolf
  are never answered. With a Centaur Latecomer in the deck the wolf told the late-swap story about its OWN card, which
  the looks refute; nobody else had a motive to tell it.
- Change: a wolf-team card that, late in the night (after every look), must swap its own card blind with another
  player's, so a wolf-side player can truthfully say "I took X's card after your looks" (or lie it).
- Predicted effect: "two honest looks" scenarios become talk-live (Centaurs 3 of 5) wherever the twin is in the deck.

## Not requested (tested and found not to matter here)
- `burningDeniesWolves` off as a Pyre calibration: PY6-S2 went Pyre 3 / Centaurs 2 with it off, the same as on.
