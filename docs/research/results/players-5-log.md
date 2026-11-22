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
