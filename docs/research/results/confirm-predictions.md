# Confirmation session: pre-registered predictions

Written 2026-11-22 13:45 UTC, after setup and the free night checks, BEFORE any counted game. Tournament files:
sim/tournaments/confirm/ (built by sim/research/make-confirm.mjs from the exploring sessions' exact scenarios:
same deck, seating, seed and night plans). Arms: **off** (default rules), **open** (`openingStatements`), **spares**
(`lureSparesPhoenix`, same night plans: the Lure's dress on the Phoenix fizzles, as in the hub's S5c). Every
6-player table also has `bloodPriceCondemned` on.

How to read the predictions: "OFF n=10" means the exploring session's 5 replays plus my 5. Ranges are win counts.
A roster **does not hold up** if its own talk-live scenarios turn talk-dead at n=10 (one team wins 9-10 of 10 or
judges' path < 2), or if one team wins at least 8 of 10 in every arm (degenerate whatever the rule option).
**Weaker than it looked** means still talk-live, but with the modal team at 7 of 10 or more, or ToM < 2, or noise > 1.5.

## 7 players, P7 Pyre roster: F-P7-ember (n=5: Pyre 2, wolves 2, Centaurs 1)

| Arm | Prediction | Reasoning | Falsified if |
| --- | --- | --- | --- |
| off, n=10 | three-way: each team 2-5; modal at most 5; path >= 2.8; noise 1.2-1.7 | three teams with private knowledge; 5 replays already split three ways | one team >= 8 of 10, or a team at 0 of my 5 AND the modal team at 4-5 of my 5 |
| open, n=10 | Pyre 3-6, Centaurs 2-4, wolves 1-3 | heuristic 14: the Pyre's story (Lure's fake corroboration) is fixed at dawn; the lone wolf, whose best play was reacting late, loses its timing edge | wolves >= 5, or Pyre <= 1 |
| spares, n=5 | wolves 2-4, Centaurs 1-3, Pyre 0-1 | the Sage now reads "Phoenix" truly on Fen; the Kindlers become the wolves' decoys (hub heuristic 16, S5c W4) | Pyre >= 3 |

## 5 players, Q3 Little Pyre

| Scenario, arm | n=5 so far | Prediction | Falsified if |
| --- | --- | --- | --- |
| F6 two-wolves-lure, off, n=10 (players-5 session's fine3 extension) | W2 C2 P1 | wolves 3-5, Centaurs 3-5, Pyre 0-2; talk-live | one team >= 8 |
| F6, open, n=10 | – | wolves 2-4, Centaurs 4-6, Pyre 1-2: the two wolves lose the claim-last advantage and collide more | wolves >= 6 |
| F8 dressed-phoenix, off, n=10 | Pyre 4, W 1 | Pyre 5-8, wolves 1-3, Centaurs 0-2: the reverse bluff is robust | Pyre <= 3 (it was luck) or Pyre 10 (talk-dead) |
| F8, open, n=10 | – | Pyre 5-8 (hub S5b: openings helped the Pyre's precommitted story) | Pyre <= 3 |
| F8, spares, n=5 | – | wolves 2-4, Centaurs 1-3, Pyre 0-1 (the Sage truly reads "Phoenix"; the Rustler's true wolf read stands) | Pyre >= 3 or one team 5-0 |

Roster verdict prediction: **holds up** on F6, **weaker than it looked** on F8 without the fix (Pyre-heavy, 6+ of 10).

## 6 players, PY6 (bloodPriceCondemned on for my games)

| Scenario, arm | n=5 so far | Prediction for my 5 (pooled n=10 in brackets) | Falsified if |
| --- | --- | --- | --- |
| S1 fake Sage, off | Pyre 4, W 1 | Pyre 2-4, wolves 1-2, Centaurs 0-2 (pooled Pyre 6-8) | Pyre 5 of my 5 with path < 2.5 (decided by a reliable argument), or Pyre <= 1 |
| S1, open | C 3, P 1, W 1 | Centaurs 2-4, Pyre 1-2, wolves 0-2 (pooled C 5-7) | Centaurs 0-1 of my 5 |
| S2 two wolf reads, off | Pyre 3, C 2 | Pyre 2-4, Centaurs 1-3, wolves 0-1 | one team 5-0 |
| S2, open | C 3, P 2 | Centaurs 2-4, Pyre 1-3 | one team 5-0 |
| S2, spares | – | Centaurs 2-4, wolves 1-3, Pyre 0-1 (the Sage truly reads "Phoenix", the Rustler reads the wolf: two true reads, but the wolf can use the Kindler as a decoy) | Pyre >= 3 or Centaurs 5-0 |

Roster verdict prediction: **holds up**, but Pyre-heavy with openings off (Pyre the modal team in both scenarios),
nearly balanced with openings on. Ties: with `bloodPriceCondemned`, I expect 0-1 tie-decided games in 25.

## Cross-cutting predictions
- Vote concentration over all my games: median c 0.6-0.8; unanimous <= 25%; scattered <= 10%.
- Judges: ToM mean >= 2.2 on every talk-live scenario; noise <= 1.5 except F-P7-ember (up to 1.7).
- Openings ON shifts power AWAY from the lone/late-claiming wolf in every Pyre scenario (heuristic 14): wolves' total
  share with openings ON < with OFF, pooled over all scenarios.
- The Phoenix's reverse bluff (fighting the vote) appears in at least half of the games where the Lure dressed the Phoenix
  and the Pyre wins, and largely disappears under `lureSparesPhoenix`.

## 7 players, F-P7-inversion (only if budget remains; n=5: Centaurs 5-0, ToM 1.4)
off +5: Centaurs 4-5 of 5 (talk-dead, predicted to stay so). open x10: Centaurs 7-10. Falsified if the wolves or Pyre win 2+ of 5 OFF.

## Addendum, 13:45 UTC (coordinator's revised plan; written before any of these games)
Changes: 7p ember `spares` arm dropped; 7p adds the K7 "Shadow Court" duel (two-team control roster); 5p adds F5 and a
`bloodPriceCondemned` arm on F6; the F8 arms and the 6p S2 spares arm move to the back of the queue (run only if
budget remains). For a spares arm, the coordinator notes that the hub retargeted the Lure's dress to its own card as a
Rustler; if one is run, I will do the same and state it.

| Scenario, arm | Earlier n=5 | Prediction | Falsified if |
| --- | --- | --- | --- |
| F-K7-duel, off (n=10 pooled) | C 4, W 1 | Centaurs 6-8, wolves 2-4; c almost always .67 (bloc votes); talk-live | Centaurs 10 of 10, or wolves >= 6 |
| F-K7-duel, open x10 | – | Centaurs 6-9, wolves 1-4: the lone wolf and the Stray Herder must commit blind and collide more (L6) | wolves >= 5 |
| F5 pyre-burn, off (n=10 pooled) | C 3, P 2 | Centaurs 5-7, Pyre 3-5, wolves 0-1 | one team >= 9 |
| F5, open x10 | – | Centaurs 4-7, Pyre 3-6, wolves 0-1 (the Pyre's self-dress story is fixed at dawn, heuristic 14) | wolves >= 3 or Centaurs >= 9 |
| F6, cond x5 | (off n=10: W 5, C 4, P 1, 2 wolf wins by tie) | wolves 1-3, Centaurs 2-4, Pyre 0-1; ties no longer win for the wolves | wolves >= 4 |

Roster comparison at 7 (predicted): K7 holds up with tighter consensus (median c .67) but is Centaur-leaning; P7 is
the more variable, with median c about .6 and more plurality votes.

## Addendum, 13:58 UTC (extra lane `cx`, budget allows; written before any of these games)
The `spares` arms are now run with the Lure RETARGETED (it dresses its own card as a Rustler, as the hub's S5c), since a
Lure that knows the rule would not waste its dress on the Phoenix. Predictions for spares stand as written above
(F8 spares: wolves 2-4, C 1-3, Pyre 0-1; PY6-S2 spares: C 2-4, W 1-3, Pyre 0-1; ember spares: W 2-4, C 1-3, Pyre 0-1),
with one addition: the Lure's self-dress as a Rustler makes any look at the Lure confirm a Rustler claim, so expect the
Lure to claim Rustler in most replays. F8 openings ON is 5 replays (not 10). Partial results at that time (15 games)
were seen before this addendum; they concern other scenarios.
