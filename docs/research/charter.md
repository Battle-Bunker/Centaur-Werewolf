# Balance research charter

Mission (from the game's owner): find rosters of characters for 5, 6, 7 and 8 players, a few each, that score well on
the quality target below **in real play by Opus AI players**, and use what we learn to amend or invent characters.
Method: predict first (docs/research/predictions.md), then test, then update how we predict (docs/research/log.md).

## 1. The quality target, as the owner stated it

1. **PRIMARY: talk decides.** Within each FIXED scenario a roster allows (same deal, same night actions, same random
   draws), there is high variability in who wins and how, arising entirely from what players choose to SAY during the
   day. Variation that comes only from different deals or hidden actions does not count. The dynamism should come from
   complex, path-dependent effects of the discussion.
2. **Not noise: consensus forms.** Consensus should form fairly strongly fairly often: across games, vote concentration
   is moderately skewed toward substantial consensus, neither uniformly scattered nor boringly unanimous.
3. **Cleverness.** Defector wins come from clever play; Centaur wins require sophisticated theory of mind (what each
   side would say and want), not just first-order elimination of mechanical possibilities.
4. **No team wins regardless of what is said.** Power is calibrated so that talk decides (the owner's example: a Pyre
   supporter that swaps the sacrificial card onto whoever is about to be eliminated makes that team always win).
5. **Evidence rules.** Random-play or random-vote simulation is worthless and is never used. The only empirical
   evidence is full games with AI players each trying to win, all seats Opus. Cheap triage is done by theorising
   about each seat's and team's strategies and imagining how the table will play. Before any test: can it tell us
   something about the real game ecosystem? If not, it is not run.

## 2. Vocabulary

- **Roster**: the deck (one card per player plus the centre), centre size, rule settings and timers.
- **Scenario**: one seating + deal + every seat's night decisions + every random draw of the night. It is identified by
  a **fingerprint**: a hash of the dealt cards (seats and centre) and the full night log (sim/arena.ts `fingerprint`).
  Two replays belong to the same scenario only if their fingerprints match; a mismatched replay is discarded.
- **Replay**: one full game of a scenario with fresh all-Opus players who join already holding their queued night
  plan (the runner queues it with each seat's own key; agents are not given the night-planning tools), so that only
  the day can differ.
- **Scenario class**: scenarios that share their strategic shape (which roles are held, whether a symmetric-claim
  card is in play, whether the wolf card moved). Predictions and frequencies are stated per class.

## 3. Instruments

Every instrument is computed by sim/research/metrics.ts from the game files; the judges by sim/research/judge.ts.

### I1. Day-variability within a fixed scenario (the primary measure)

Per scenario, over R replays (R = 5 to start; more where it matters):
- distribution of the **winning team** (Centaur / Werewolf / nobody; creature wins listed separately);
- distribution of the **eliminated set** (which seats, or nobody);
- distribution of the **"how it was won" category**, assigned by the neutral judges (I3) from a fixed list, with a
  short free label.

Summaries: Shannon entropy in bits of each distribution (winning team: 0 = always the same, 1 = an even two-way
split), and the **minority count**: replays whose winning team differs from the modal one (0 to floor(R/2)).
With R = 5 these are reported as counts ("3-2"), never as rates. A scenario counts as **talk-live** if its minority
count is at least 1 AND the judges' mean path-dependence (I3) is at least 2; **talk-dead** if 0 minority and mean
path-dependence below 2. A roster's primary score is the frequency-weighted share of its tested scenarios that are
talk-live, read together with the judges' explanation of what flipped them.

### I2. Vote concentration

Per game: `top` = votes on the most-voted seat (raw votes, not Chiron-weighted; random votes kept but flagged),
`concentration c = top / (N - 1)` (N - 1 is the most any seat can get: nobody votes for themselves), and
`margin = (top - second) / (N - 1)`. Bands: **scattered** c <= 0.4 or no elimination by a split; **plurality**
0.4 < c <= 0.6; **majority** 0.6 < c < 1; **unanimous** c = 1.
Target shape per roster: median c in about 0.6 to 0.85; unanimous at most about a third of games; scattered at most
about a fifth. Reported as the list of c values with the band counts (no rates on fewer than 10 games).

### I3. Neutral judges

Two independent `claude -p` judge calls per game (sim/research/judge.ts), each given ONLY the public transcript
(chat with seats and phases, proclamations, public marks, who was ready and when) plus the post-game truth (seating,
deal, night log, final cards, every vote, outcome), never the players' private reasoning or debriefs. Fixed rubric,
structured output:
- `tomRequired` (0-3): depth of theory of mind the WINNING side needed. 0 = none (won by default, luck or a blunder);
  1 = mechanical elimination of possibilities; 2 = first-order modelling (what would a player of role X claim / want);
  3 = second order or more (modelling what others believe about one's own claims, baiting, counter-baiting).
- `deceptionCleverness` (0-4): quality of the decisive deception (0 = none or clumsy; 4 = a lie that needed a deep
  model of the table to construct and was very hard to see through).
- `pathDependence` (0-4): did the outcome turn on something SAID? 0 = fixed by the deal and night whatever was said;
  2 = discussion mattered but the result was the likely one; 4 = a specific message or exchange flipped it.
  With `pivot`: the message(s) that did so.
- `noise` (0-4): how much the result felt arbitrary (random votes, unreasoned choices, coin flips nobody could reason
  about). 0 = none.
- `howWon`: a category from {honest-info-converged, lie-believed, framing-or-decoy, split-vote-no-consensus,
  unseen-night-movement, blunder, creature-or-side-win, other} and a free label of at most 8 words.
- `counterfactual`: one sentence: what would the losing side have had to say differently.
Agreement between the two judges: mean absolute difference per scale and exact agreement on `howWon`. If the two
judges differ by 2 or more on a scale in more than a third of games, the rubric is revised before its scores are used.

### I4. Degeneracy screen

Per scenario: does one team win every replay AND do the judges say the talk did not matter (mean pathDependence < 2)?
Per roster: which scenario classes are degenerate and how often they arise. A roster with a common degenerate class is
rejected or amended whatever its other scores. A card whose presence makes a class degenerate (its holder's team wins
whatever is said) is miscalibrated (target 4).

### Supporting measures (diagnostics, not targets)

Day messages per game, random (missed) votes, forced night moves, how long the discussion ran and whether it was
ended by "everyone ready", cost and wall time per game, the players' own debrief claims (true/false) and confusions.

## 4. Protocol

- **Coarse pass**: a handful of varied-deal all-Opus games per chosen roster (natural deals, redealt only to ensure
  the defecting side holds at least one card when stated), to catch broken rosters and bugs. Compared with predictions.
- **Fine pass** (the real test): for promising rosters, 2-3 representative scenarios each, deal and night fixed
  (decisions chosen as a sensible player would, or taken from a coarse game), replayed R times. I1-I4 computed.
- **Settings for AI tables**: default rules unless a roster says otherwise; timers dusk 60 s (coarse) or 15 s (fine,
  plans already queued), night turn 8 s (coarse) or 5 s (fine), discussion 240 s, vote 60 s (the human default of 20 s
  is too short for an AI player's turn; a missed vote is random and would add noise the game does not have with people).
- **Prediction before test**: every roster and scenario tested has a written prediction in predictions.md first.
- **Learning**: after each pass, log.md records prediction vs result, what the theory got wrong, the general lesson
  (running "heuristics" section) and resulting change requests (docs/research/change-requests.md).
- **Honesty about sample sizes**: counts, not rates, below 10 games; never present 5 games as a rate.

## 5. What would make a roster "good"

All of: (a) in its common scenario classes, most tested scenarios are talk-live (I1); (b) vote concentration in the
target shape (I2); (c) judges' mean `tomRequired` at least 2 and `noise` at most 1.5, with defector wins scoring
`deceptionCleverness` at least 2 (I3); (d) no common degenerate class (I4).
