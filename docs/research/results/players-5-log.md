# 5 players: log (prediction vs outcome, lessons)

## 2026-11-22 11:30 Setup
- Local backend: `npx convex dev` crashes downloading its dashboard (a TLS parser assertion) but the backend keeps
  running; redeploy by stopping the backend, `npx convex dev --once`, then `npx convex dev` again in the background.
- npm test 101/101, smoke "all checks passed" before and after the evidence amendment (merged 11:48).
- Verification game (old A5 deck, natural deal): $2.91, 244 s. Wolves won: the lone wolf claimed Sage (census: Sage
  in centre), the Spooker claimed Centaur against the real Centaur and drew all 4 votes. Not counted as data.

## 2026-11-22 12:10 Coarse pass (12 natural-deal games, $37; sim/runs/p5/coarse)

| Roster | Games | Winners | c | Judges ToM / deception / path / noise | Predicted |
| --- | --- | --- | --- | --- | --- |
| Q1 Moonsage+Spooker | 3 | C 2, W 1 | 1.00 .75 .75 | 1.8 / 2.7 / 2.2 / 0.3 | C ~50% |
| Q2 three stealers | 2 | C 1, W 1 | .75 1.00 | 2.5 / 2.8 / 2.5 / 0.5 | C ~55%, noise 1.5 |
| Q3 Little Pyre | 3 | C 1, W 1, Pyre 1 | .75 .75 .75 | 2.3 / 2.7 / 2.8 / 1.3 | C40 W35 P25 |
| Q4 copiers | 2 | C 2 | .75 1.00 | 1.5 / 1.8 / 1.0 / 0.5 | C ~55%, path 2 |
| Q5 Open Book (control) | 2 | C 1, W 1 | .75 .75 | 1.5 / 2.0 / 2.5 / 0.8 | C >= 4 of 5, talk-dead |

Judges agreed closely (mean |diff| 0-0.67 per scale; howWon exact 11 of 12 pairs). Discussions 43-121 s, all ended by
everyone ready; 19-35 messages. No forced night moves, no random votes.

### Prediction vs outcome
- **Q5 control wrong in an instructive way.** I expected two Sages + Herder to leave the wolf no claim. But two Sages
  in the deck make a Sage counter-claim uncountable: in Q5#1 the real Sage read the wolf, the wolf answered "I am the
  Sage, I read YOU: Werewolf", and the table had no mechanical way to tell them apart; a misquote by a Centaur swung
  the vote (judges path 4, lie-believed). Q5#2 (two Sages both read the same wolf) was talk-dead as predicted.
  *Lesson 5.1: a duplicated information role turns "two claims of a unique role" (a mechanical refutation) into a
  credibility contest. Duplicates are cheap mirror cards.*
- **Q1: the Spooker is a lightning rod.** At 5 players with one Werewolf, a non-Werewolf wolf ally that behaves
  suspiciously is a decoy: eliminating it is a wolf win (W = 0, C = 0). Q1#1: the lone wolf claimed Rustler (census:
  Rustler in the centre); the Spooker stalled and counter-claimed; all 4 votes hit the Spooker. Q1#3: the lone wolf
  scented the Spooker (wolf team), then claimed Spooker himself and framed the real Spooker: the table reasoned that a
  real Spooker never points at its own wolf, and caught him (judges: blunder). Q1#2 ended by honest convergence.
  *Lesson 5.2: at 5 players the pack's allies are worth more as targets than as actors; the Centaurs' real problem is
  "which wolf-team card is THE Werewolf", which needs second-order reasoning (judges' ToM rises when the table asks it).*
- **Q2 stealers: livelier and less noisy than predicted** (noise 0.5 vs 1.5). Opus reconstructs swap chains exactly;
  what decides is whether a KNOWING mover (Cutpurse who took a wolf) lies about its target. Q2#1: it claimed to have
  robbed the Sage and "become Sage", which pointed the chain at an innocent (judges path 4, deception 3.5).
- **Q3 Pyre: as predicted the most three-way** (one win each). Two of three Lures dressed THEMSELVES as a Werewolf
  (to bait a Sage read that then makes the Lure look like the wolf?), which I had not anticipated.
- **Q4 copiers: talk-dead** as feared in my falsifier: copies of Centaur roles add a second honest look.

## 2026-11-22 12:40 Fine pass 1 (6 fixed scenarios x 5 replays, $87; sim/runs/p5/fine1)

| Scenario | Predicted | Observed | Judges path | Right? |
| --- | --- | --- | --- | --- |
| F1 Q1 spooker-decoy | W3 C2, live | W5 | 3.0 | wrong side of the split |
| F2 Q1 twin-duel | W3 C2, live | C5 | 3.3 | wrong |
| F3 Q2 cutpurse-wolf | W3 C2, live | W3 C2 | 3.7 | right |
| F4 Q2 lone-wolf (control) | C5, dead | C5, degenerate | 1.0 | right |
| F5 Q3 pyre-burn | C3 P2, live | C3 P2 | 2.7 | right |
| F6 Q3 two-wolves-lure | W3 C2, live | W2 C2 P1 | 3.2 | right (live) |

Why the sweeps happened (the counter-story that was missing):
- F1: the wolf's census-safe claim ("Rustler, kept my card") fit the Sentry's report and nobody could check it; the
  Spooker's honest or dishonest rotation story marked it as wolf-side, so the table took the visible liar. Missing: any
  reason to look past the mover. Amendment: the Drover (a rotation confession no longer proves team).
- F2: the wolf side had a good story (Moonsage claims Sage, vouched by the Rustler's sincere "I saw Sage on Bryn"), but
  in every replay the wolf leaked census knowledge or pushed to eliminate the real Sage instead of arguing for
  "eliminate nobody", and the Centaurs reduced it to two worlds where the vote on the Sage lost in both. Judges'
  counterfactual: with "eliminate nobody" from the wolf it would be a coin flip. *Lesson 5.3: Opus wolves are
  greedy; a story that only works with a passive goal (nobody eliminated) is rarely played well.*
- F4: no claim available to the wolf (every centre role a mandatory mover; the Sentry pinned it). Talk-dead by design.

## 2026-11-22 13:05 Fine pass 2 (4 fixed scenarios x 5 replays, $54; sim/runs/p5/fine2)

| Scenario | Predicted | Observed | Judges path | Right? |
| --- | --- | --- | --- | --- |
| D1 = F1 + Drover | W3 C2, live | C4 W1, live | 2.2 | live yes; the Drover helped the Centaurs more than predicted |
| D2 two rotators | W3 C2, live | W5, degenerate | 1.6 | wrong |
| F7 Q2 blind carrier | C3 W2, live | C5, degenerate | 1.3 | wrong |
| F8 Q3 dressed Phoenix | C2 P2 W1, live | P4 W1, live | 3.2 | live yes; Pyre stronger |

- D2: the Spooker carried the wolf card from the Sage-read seat to a quiet Centaur, then claimed the Drover's harmless
  centre-only rotation as its own. Nobody held a Sentry, so there was no trace of the move: "unseen night movement"
  in every replay. *Lesson 5.4: a twin that makes claims ambiguous also gives the liar a ready-made true-sounding
  story; ambiguity needs at least one independent trace (a witness) or the hidden action decides.*
- F7: I expected the new wolf holder (who learns from the table that he now holds the wolf) to turn liar and create a
  contest; instead every honest claim had already been posted (the Pickpocket named its target in its first message)
  and the chain was fixed. *Lesson 5.5: path dependence from blind swaps needs the honest movers to be unsure or to
  claim late; Opus claims first and fully, so blind swaps resolve mechanically.*
- F8: the Pyre's reverse psychology (the dressed Phoenix fights the vote, a Kindler fakes a Sentry "unmoved" report to
  lock in the Sage's sincere read) won 4 of 5.

## 2026-11-22 13:25 Natural-deal pass 2 (9 games, $29; sim/runs/p5/coarse2)
Predicted Q1D C 2 of 3, Q2 C 2 of 3, Q3 one each. Observed: C2-W1 for each roster (Q3 had no Pyre win). No scattered
vote (c: 0.75 or 1.00 everywhere).

## Running heuristics (5 players)
1. Duplicates of an information role are mirror cards (Q5#1).
2. A wolf-side non-Werewolf is a decoy at 5 players; its elimination wins for the wolves (11 of 12 decoy games).
3. Opus wolves are greedy: plans needing "eliminate nobody" fail (1 of 8 wolf proposals won).
4. Ambiguity without any independent trace yields degenerate hidden-action wins (D2).
5. Opus Centaurs claim first and fully; blind swaps then resolve mechanically (F4, F7). Talk-live stealer scenarios
   need a KNOWING mover with a reason to lie (F3, coarse Q2#1, natural Q2-n#3).
6. "Dominant vote" reasoning (vote the seat that is wolf in every world) is the Centaurs' main weapon (20 wins of 28
   uses), and the best wolf lies are built to make an innocent the dominant vote (F3#4).
