# 7 players: log (prediction vs outcome, lessons)

Predictions: players-7-predictions.md (dated, written before the games they predict). Raw runs: sim/runs/p7-*
(git-ignored). Instruments: sim/research/metrics.ts and judge.ts.

## 11:40 Setup check (1 natural-deal game, roster S7: 2 wolves, Spooker, Sage, Rustler, Sentry, 2 Centaurs, Herder, Pickpocket)

321 s wall, $5.81, 45 messages, discussion 129 s (ended by ready), c 0.83, 0 random votes. Centaurs won.
Judges (both): ToM 3, deception 3, path 4, noise 1.
- Night: the Sage read the Spooker; the Spooker rotated Fen -> Bryn -> Gale (moving the two dealt wolves' cards: Fen got
  Gale's wolf, Bryn the Sage got Fen's wolf, Gale got the Sage). Herder, Rustler, Pickpocket in the centre.
- Talk: both dealt wolves claimed Rustler (census-safe, collided: hub heuristic 5 again). The exposed Spooker invented a
  rotation "centre 2 -> Gale -> centre 3" to frame Gale. The table went to Gale ("a Rustler who sees Spooker would
  never swap into the wolf team"). Then the pivot: Gale BELIEVED the Spooker's false story, concluded his wolf card was
  gone and confessed: "I was DEALT Werewolf... the pack wake showed me the other wolf: Fen." Bryn (the Sage, unknowingly
  holding a wolf) built the decision argument: "vote Gale wins only if Gale's lying AND centre 2 happened to be WW;
  vote Fen wins whenever Gale's confession is true, and nobody admits being dealt WW for fun." The table switched to
  Fen, who held Gale's wolf: Centaurs won.
- Lesson (L1): the wolf side's own lie can turn a wolf. A wolf who cannot verify where his card went is as exposed to
  the Spooker's lie as the Centaurs are. The Spooker's lie is a weapon pointed in every direction: path dependence of
  the highest kind (judges path 4), and it needed no new card.
- This game became the fixed scenario F-S7-confession.

## 12:10 Coarse pass (8 natural-deal games, 2 per roster; redealt until a player holds a wolf; $45.6)

Data: sim/runs/p7-coarse (metrics.txt, metrics.json, judge-*.json). Two judges per game; agreement on every scale
within 0.5 on average except deception on X7 (1.0); `howWon` exact 8/8 pairs.

| Roster | Winners (2 games) | c | Judges ToM / deception / path / noise | Predicted |
| --- | --- | --- | --- | --- |
| K7 Shadow Court | wolves 2 (a Blood-Price tie; a Moonsage drew the vote) | 0.50, 0.83 | 2.5 / 2.8 / 2.5 / 1.0 | C50/W50; path 2.5 |
| P7 Pyre | Pyre 1 (fallback burning of the Lure), Centaurs 1 | 0.67, 0.50 | 2.3 / 2.8 / **4.0** / 1.3 | C40/W30/P30; path 2.5 |
| G7 Veils+Hush | Centaurs 2 | 0.67, 0.67 | 2.3 / 2.3 / 3.0 / 1.0 | C50/W50 |
| X7 Thieves (predicted bad) | Centaurs 2 | 1.00, 0.83 | 2.0 / 2.0 / **1.5** / **0.0** | scatter, noise >= 1.5, path <= 2 |
| (S7 setup game) | Centaurs 1 | 0.83 | 3 / 3 / 4 / 1 | (added after) |

Never a rate on 2 games; what the games show:
- **K7#2 (wolves): the twin is a free decoy.** Both Sage claims were held (real Sage Fen, Moonsage Alder). The table
  correctly saw that one was a Moonsage AND that eliminating a Moonsage loses, yet voted the Moonsage 5-2 because
  "Alder could be the werewolf faking Sage" (Alder had posted his claim after the Rustler's, a timing slip). Losing the
  duel won it for the wolves. Same structure as the hub's S2 (a wolf-team non-wolf as decoy).
- **K7#1 (wolves): a false confession to save a partner.** Sage in the centre (two Centaurs saw it), so the Moonsage
  Gale was exposed. Both wolves claimed Centaur (collision: three Centaur claims for two cards). With the table on wolf
  Fen, Fen claimed "I'm the Moonsage" (a non-wolf: voting him loses); then the real Moonsage Gale falsely confessed "I'm
  a Werewolf" so the table would eliminate HIM (a Moonsage = wolf win). The votes split 3-3 between Fen (wolf) and Esme
  (Centaur): a Blood-Price tie, a wolf win. Judges: ToM 3, deception 3, path 2.
- **P7#1 (Pyre): the mover's lie turned a wolf (again).** Phoenix in the centre (fallback: a Kindler's elimination is a
  burning). The Ember-Carrier claimed Rustler, got caught describing an ember move, then admitted Ember-Carrier but LIED
  about its targets ("Gale and Fen"; truly Cass and Bryn). Wolf Fen believed his card had gone to Gale, confessed "I was
  dealt Werewolf... I'm sitting on the Lure", and the table eliminated Gale, who held the Lure: a burning, Pyre win, wolves
  denied. Judges path 4, deception 3-4. Exactly the setup game's mechanism (Spooker lie -> wolf confesses).
- **P7#2 (Centaurs): a Phoenix holder fake-confesses to burn.** The Rustler Gale had been carried the Phoenix and was read
  "Phoenix" by the Sage; he then claimed "I was dealt WEREWOLF, my peek was invented" to get himself voted out; the Sage
  caught it ("Gale named me Sage at msg 1, before I had said anything"). Kindlers proposed a "safe" Alder+Gale tie; the
  table refused and eliminated the wolf. Judges path 4.
- **G7 (Centaurs 2): the Glamour and the Hush did little.** G7#1: a Cutpurse took a wolf card; the former wolf confessed
  and named her packmate (the Glamour, who had glamoured himself "Centaur"). The Hush cut the Glamour (its own ally:
  the Hush does not know the pack) and, through a harness bug, the cut AI never came back (random vote, discussion to the
  timer). G7#2: three wolf-side cards (the Echo copied the Glamour) collided on claims (two Echo claims, three Centaur
  claims) and a deck count cornered them. The Glamour was never used to frame anyone in either game.
- **X7 (Centaurs 2): prediction half wrong.** Five movers did NOT produce scatter or noise (c 1.00 and 0.83, noise 0).
  Movers that LOOK at what they took (Cutpurse, Drifter, Poacher) and blind movers that only report their target create a
  web of mutually corroborating swap claims; with the Sentry, the table rebuilt the whole permutation in ~30 s, and the
  one wolf-side story (a fake Drifter; a fake Sage) did not fit. The half that held: path 1.5 (talk mattered little).
  Lesson L2: many honest movers make the night MORE deducible, not less; movement creates noise only when the movers
  are wolf-side or their parameters are invisible (Spooker, Ember-Carrier).

### Strategies observed so far (9 games incl. setup)
| Strategy | Games | Won by the user's side |
| --- | --- | --- |
| Census-safe cover claim by a wolf | 9/9 | - |
| Two wolf-side players claim the same role (collision) | 6/9 (S, K1, P1, P2, G2, and P1 three-way) | 0 of the colliding sides won by it |
| Mover lies about its move's parameters | 4/9 (S Spooker, P1 Ember, P2 Lure as "Pickpocket", X2 Cutpurse) | 1 (P1) |
| A dealt wolf confesses after (truly or falsely) believing his card moved | 3/9 (S false, P1 false, G1 true) | the confessor's NEW belief was wrong in S and P1, and the confession decided all three |
| False confession "I'm a Werewolf" by a wolf-team non-wolf or Phoenix holder to draw the vote | 2/9 (K1 Moonsage, P2 Phoenix) | 1 (K1) |
| Tie-hedge proposal ("put 3 on each, a tie still wins for you") | 5/9 | 1 (K1, a tie happened) |
| Fake-claim the Sage to point at a seat | 4/9 | 1 (K2, as a decoy) |

### Lessons (general)
- L3: **"I lost my wolf card" confessions are the swing point at 7.** Opus wolves who believe their card moved switch
  sides at once and name their packmate. Hence any uncheckable movement claim (Spooker, Ember-Carrier) is a weapon that
  can turn a wolf; and the wolf-side mover who lies about its rotation risks converting its own wolf (setup game: the
  Spooker's lie cost the wolves the game). This is talk-decided and second-order: exactly the target.
- L4: **Wolf-team non-wolves are decoys.** A Moonsage or Stray Herder caught in a duel is the table's natural target and
  its elimination is a wolf win. Opus tables state this rule ("voting the Moonsage loses") and still fall for it when
  the duel loser might be a Werewolf faking. Keep, but watch for sweeps.
- L5: **The Glamour was never used offensively** (2/2 self-dress or copied). Self-dressing as "Centaur" is the safe,
  dominant use for an Opus Glamour; a frame needs a guess at whom the Sage reads. Only the constructed scenario tests the
  frame.
