# 5 players: requests to the hub (changes to existing cards or rules I did not make)

Each request names the evidence (sim/runs/p5, summarised in players-5.md) and a prediction.

## R5-1. Keep the Drover (new, additive) and consider it a standard partner of the Spooker
Evidence: F1 (Spooker held, lone wolf, Rustler in the centre) went wolves 5-0: the honest Spooker's rotation story
marked it as wolf-side and drew the vote, and the wolf's census-safe centre claim was never examined. The same deal
with the Drover in place of the Rustler (D1) went Centaurs 4, wolves 1 (talk-live): the Spooker claimed Drover as
cover, so the table had to examine claims instead of the mover. Prediction: in Spooker decks the Drover turns "the
mover is the liar" from a free inference into a second-order question.

## R5-2. Deck rule: a blind mover with an invisible parameter needs a movement witness in the deck
Evidence: D2 (Spooker and Drover both held, Sentry in the centre) went wolves 5-0 and is flagged degenerate
(judges: "unseen night movement"). The Spooker moved the Sage-read wolf card to a quiet Centaur, then claimed the
Drover's harmless centre-only rotation as its own; with no Sentry held nobody had any trace of the move, so no
discussion could find the new wolf. Request: like the fakeability deck rules, a deck with two or more blind movers
(Spooker, Drover, Pickpocket, Latecomer) should hold a Sentry, or the Sentry should learn "moved" for every seat
touched by a rotation it can see (not only neighbours). Prediction: D2-type scenarios become talk-live (the
Sentry's report gives the Centaurs a reason to suspect the Sage's read went stale).

## R5-3. `lureSparesPhoenix` (already added by the hub): my F8 data supports testing it at 5 players
Evidence: F8 (the Lure dresses the Phoenix as a Werewolf, the Sage reads it) went Pyre 4, wolves 1. It was
talk-live, and the judges scored it highly (ToM 2.8, deception 3.2), but the Pyre is favoured at 5 players. With
the rule on, the Pyre would have to get its burning through talk alone. Prediction: Pyre wins drop from 4 of 5 to
about 1-2 of 5 in that scenario. Not tested here (budget).

## R5-4. Wolf-side "no safe claim" classes are talk-dead at 5 players (F4, F7)
Evidence: two Q2 scenarios (a lone wolf untouched, F4; a blind stealer carrying the wolf, F7) went Centaurs 5-0 with
unanimous votes and judges' path 1.0-1.3. In both, every role in the centre was a mandatory mover, so the wolf could
claim nothing that the Sentry and the swap chain did not refute. Request (roster level, no code): in 5-player decks
with three stealers, keep at least one non-moving Centaur role duplicated (a second Centaur), or use `packCovers`.
