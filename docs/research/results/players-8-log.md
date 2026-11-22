# 8 players: log (prediction versus outcome, lessons)

Predictions: [players-8-predictions.md](players-8-predictions.md). Deliverable: [players-8.md](players-8.md).
Raw runs: sim/runs/research/p8/ (git-ignored). Tournament files: sim/tournaments/research/p8/.

## 2026-11-22 Setup

- Local backend, `npm test` (101 passed), `sim/smoke.ts` (all checks passed). The runner needed no change for 8 seats
  (names Alder..Hale; 8 `claude -p` processes per table).
- V8#1 (verification, natural deal): $4.67, 272 s wall, discussion 71 s, 37 messages. Centaurs 6 votes of 7 on the
  Sage-read wolf. Lesson recorded in the predictions file: at 8 seats the honest claims fill the claim space within
  30 s; both wolves claimed the one Farrier after the real one (three Farrier claims). Wolves compose for ~40 s before
  their first message.
- Evidence amendment (dd55c9d) merged before any research game; my rosters already avoided Herald, Notary, Herder.

## 2026-11-22 Coarse pass (10 games, natural deals redealt until a Werewolf card is held; ~$60)

Data: sim/runs/research/p8/coarse (coarse-metrics.txt/json, judge-1/2.json per game).

| Roster | Winners (2 games) | c | Judges mean ToM / dec / path / noise | Predicted |
| --- | --- | --- | --- | --- |
| M1 Mirror Hall | Centaur 1, wolf 1 (a fake-Sage frame plus a flipped vote forced a 4-4 tie under Blood Price) | 1.00, 0.57 | 2.0 / 2.5 / 2.5 / 0.5 | C ~50%, path 2.5 |
| M2 Pyre Eight | Centaur 1 (wolves claimed the same role, then crossed Echo stories), wolf 1 (a wolf bloc forced a 3-3 tie) | 0.57, 0.43 | 1.5 / 2.3 / 2.8 / 1.5 | C40 W30 P30 |
| M3 Seals and Silence | Centaur 2 (claim count; one wolf census slip) | 0.43, 0.57 | 2.0 / 2.5 / 2.8 / 1.3 | C ~50% |
| M4 Glamour Market | Centaur 2 (swap chain reconstructed exactly) | 0.86, 0.86 | 1.5 / 1.8 / 1.0 / 0.0 | C 45%, noise 1.4 |
| M5 Fog (predicted bad) | Centaur 2 | 0.71, 0.71 | 2.0 / 2.5 / 3.0 / 1.5 | noise >= 1.8, ToM <= 1.5 |

With V8#1: Centaurs 8 of 11, wolves 2, Pyre 0. Discussions 59-240 s (median about 90 s), 28-53 messages.

### Prediction versus outcome
- **The claim count is the Centaurs' main weapon at 8 seats** (judges' words in 6 of 8 Centaur wins: "claim count",
  "process of elimination", "count logic"). Seven claims fill seven slots, and the unclaimed roles box in the remaining
  seats. I predicted the twin/duplicate claims would break this. In M1 they did once (M1#2, path 4). In M1#1 the lone
  wolf's late, census-safe Drifter claim was internally consistent, but it lost to "Fen claimed first and specifically".
- **The latency tell** (new; not in my theory): in V8#1, M1#1, M3#1 and M4#2 the wolves were the last to speak, after
  every honest claim, and the table read silence and "claimed only after being named" as guilt. Honest players claim in
  6-10 s; a liar composes for 30-40 s. With people this tell exists too, but it is weaker.
- **Collisions** (heuristic 5) recurred: V8#1 (three Farriers) and M2#1 (both wolves "Centaur", then each "the Echo
  who copied the other"). The hub's new rule `packCovers` targets exactly this (my H1); to test.
- **Blood Price ties are the wolves' route at 8 seats:** both wolf wins came from a 4-4 or 3-3 tie that took down a
  wolf and a Centaur. In M2#2 a wolf bloc of 3 voted together against a confessed wolf; in M1#2 the wolves persuaded one
  Centaur (Bryn) that he now held a wolf-team card, so he flipped his vote. The Centaurs saw the mirror tactic: in M3#1 they
  split deliberately (3-3) on two suspects and eliminated a Werewolf plus the Counterfeiter (W 1 > C 0).
- **Seals were never used** (M3: the Signet held its seal "for later" and the Counterfeiter never forged). The falsifier
  for M3 holds: as dealt, seals add nothing at 8 seats. The Hush cut the Sage once (M3#2), and his vote then went
  random (the agent was still offline when the vote opened): noise.
- **M4 (stealers) is talk-dead:** every mover announced its swap at once, the chain was rebuilt exactly, and the wolf
  could not hide inside it (path 1, 1; noise 0). My prediction of extra noise was wrong in the other direction: Opus
  tables track a 4-swap chain without error.
- **M5 (predicted bad) was not bad:** the Wisp veiled its own card as "Sentry" and counter-claimed the real Sentry (a
  chosen use of a random card); the judges gave path 2 and 4, ToM 2, noise 1 and 2. My prediction (noise >= 1.8 and
  ToM <= 1.5) is falsified on ToM, borderline on noise. Lesson: a "random" distortion that its holder AIMS at a card
  (its own card, a seat it will talk about) becomes a chosen lie; randomness about the role shown matters less than I
  thought.

### Heuristics added
- **H8-1 (claim volume).** At 8 seats 6-7 honest claims arrive in the first 30 s; a defector's claim is judged by the
  count of unclaimed roles, so a defector survives only with a claim to a role with several copies or a twin, and
  only if its read cannot be cross-checked.
- **H8-2 (latency).** Speed of claiming is evidence to Opus tables. A roster in which honest players also need time
  to compose (several looks, chains to reconstruct) hides the liar's delay.
- **H8-3 (Blood Price ties).** With 8 voters the wolves' best route is a tie, not a mistaken consensus: three
  wolf-team votes plus one confused Centaur make a 4-4 tie.

## 2026-11-22 Fine passes 1-4 (fixed scenarios, 5 replays each, every group one fingerprint; ~$235)

| Scenario | Predicted | Result | Judges ToM / dec / path / noise | Verdict |
| --- | --- | --- | --- | --- |
| F1 M1 Sage vs Moonsage duel | C2 W3, live | **C5** | 2.0 / 2.1 / 1.9 / 0.4 | degenerate (prediction wrong) |
| F2 M1 pack pair, read wolf (control) | C5, dead | **C5** | 1.6 / 1.9 / 1.4 / 0.3 | degenerate (prediction right) |
| F3 M2 Lure-dressed Phoenix | P2 C2 W1, live | **Pyre 5** | 2.9 / 3.8 / 3.6 / 1.2 | sweep, but judged talk-decided |
| F4 M2 ember carried the Phoenix | C3 P1 W1 | **C5** | 1.8 / 2.2 / 1.6 / 0.6 | degenerate |
| H1 = F1 with Hollow Sage | C3 W2, live | **C4 W1** | 2.2 / 2.3 / 2.3 / 0.5 | **talk-live** |
| H2 = F2 with Hollow Sage | C4 W1 | **C5** | 1.6 / 1.8 / 1.6 / 0.4 | degenerate |
| H2c = H2 + packCovers | C3 W2 | **C5** | 1.6 / 2.1 / 1.5 / 0.5 | degenerate |
| S2 = H2 with a Spooker (centre rotation) | C3 W2, live | **C4 W1** | 1.8 / 2.7 / 1.9 / 0.7 | minority 1, path just below 2 |
| S3 = H1 with a Spooker for the Dun Centaur | C3 W2, live | **C5** | 2.0 / 2.2 / 1.6 / 0.4 | degenerate (prediction wrong) |

Tally of my scenario predictions: winner of the majority right in 7 of 9; the talk-live/dead call right in 4 of 9 (I
over-predicted liveness 5 times and never under-predicted it). Vote tallies in a fixed scenario were nearly identical
across replays (F1: [3,0,0,5,...] in 4 of 5; S3 in 5 of 5): the 3 wolf-team votes go one way, the 5 Centaur votes the
other. Concentration therefore sits at 0.71 (5 of 7) in duel scenarios and 0.86 (6 of 7) when one wolf ally defects.

### Why each sweep happened, and the smallest change that would leave a counter-story
- **F1 (Moonsage duel).** Unanswerable element: under Blood Price the fake Sage's elimination cannot win, so whatever
  the table believes about the duel, the accused is the only winning vote. Change: a Sage twin that counts as a
  Werewolf (Hollow Sage, implemented). Result: 4-1 (H1), the first talk-live 8-seat scenario.
- **F2/H2 (read wolf in a pack pair).** Unanswerable element: an early specific read on a card NOTHING could move after
  the Sage turn, so the wolf's counter-claim needs two liars where the Sage needs none ("one liar beats two"), plus
  the latency tell. Change tried: covers (no effect, R8-2 explains why) and an invisible wolf-side mover (S2: 4-1;
  the one wolf win was a census-safe "I am the Pickpocket, I swapped with Dov" told by the read wolf herself).
- **F3 (Lure).** Unanswerable element: the only evidence the Centaurs had pointed at the dressed Phoenix; the truth sat
  with a lone wolf who could not voice it credibly; "a Phoenix welcomes the vote" was exploited by a Phoenix that
  fought. Change proposed (R8-4), untested.
- **F4 (ember).** The Rustler's peek at the Phoenix's dealt seat plus the Sentry reconstructed the carry, and the
  Phoenix's dealt holder told the truth. Nothing for the Pyre to say. (No change proposed: the Ember-Carrier's move is
  visible by design; the card is fine as a night mover but does not create day dilemmas when a Sage read a wolf.)
- **S3 (duel + Spooker).** Removing the Dun Centaur (a wolf that can truthfully claim Centaur) for the Spooker REMOVED
  the wolves' credible voice; the Spooker's own rotation story self-incriminated. Lesson below.

### Heuristics added
- **H8-4 (win-condition symmetry).** A credibility duel is only a dilemma if eliminating EITHER duellist can win for
  the deciding side. Check, for every twin or decoy, "if the table votes the liar here, does anyone win?".
- **H8-5 (credible voice).** A counter-story needs a teller who can pose as honest. Movement lies work when told by a
  wolf claiming a Centaur mover or a centre card (census-safe), not by the wolf-side mover itself.
- **H8-6 (Opus replays converge).** Fresh Opus tables given the same night converge on the same reading 4 or 5 times
  in 5 unless two stories each need the same number of liars. Talk-liveness at 8 seats needs a scenario where the
  liar count is EQUAL across the stories (H1: Alder-lies vs Bryn-lies, one liar each).
- **H8-7 (wolf-team mass).** At 8 seats with 4 centre cards and four wolf-team cards in a 12-card deck, 60% of deals
  hold 3 or more wolf-team cards; a deal with 4 (N-M1HS#1) lets the bloc force a 4-4 tie whatever is said (judge:
  "nothing they said would have changed the result"). Keep wolf-team cards at 4 of 12 or fewer, or Blood Price ties
  become arithmetic.
