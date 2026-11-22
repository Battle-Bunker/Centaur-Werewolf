# Research log

## DESIGN PRINCIPLE (from fine pass 1, S3): information handed to liars becomes a tell

The rules are common knowledge, so the table can run any defector's decision problem backwards. If a mechanic makes
one defector option strictly SAFE, and the table can compute which option that is, then choosing it is evidence.
In S3 (5 replays of one fixed night, Centaurs 5-0) the honest side won every time with exactly this argument about the
Den Census, which was designed to help the wolves lie:
- "If Alder were the Werewolf, the centre would hold WW + Moonsage + Sentry, so he'd know a real Sage is sitting at the
  table. He'd never claim Sage." (S3#4, the swing voter)
- "No wolf would claim Sage into a guaranteed counterclaim when Sentry is a safe unclaimed role... Bryn claimed
  CENTAUR, a role his census told him nobody holds." (S3#2: this reversed a four-player consensus on the real Sage)
- "Alder pointed out that the wolves' Den Census made Bryn's 'Centaur, saw Sentry' claim cost him nothing." (S3#5)
**Steer design toward mechanics where the defector's safe option is NOT computable by the table**: private randomness
in what the pack learns (census "allButOne"), covers assigned rather than chosen (packCovers), twins that make the
"impossible" claim possible. Corollary (S5): a rule that aligns the wolves with the Centaurs against a third party
(burningDeniesWolves) makes the wolf's private knowledge visible when it acts on it ("If Bryn were a real wolf, why
would a non-wolf Dov need to lie?").

## Heuristics for predicting balance (running; the in-context learning is itself a deliverable)

1. **Classify scenarios by whether an unrefutable claim is in play.** If every defector claim can be refuted by a
   mechanical cross-check (a read, a glance, a count, a movement flag), Opus Centaurs win by first-order logic and the
   scenario is talk-dead. Talk-live scenarios need at least one claim the table can only judge by modelling incentives.
2. **After-talk power is degenerate by construction.** Any effect chosen after the discussion has shown where the votes
   will go makes consensus self-defeating. Check every day power for "is it applied after the votes are predictable?".
3. **Two independent honest looks at the same seat end the game** unless a mover or distortion can explain both away.
   (Pilot: Sage + Rustler both saw the wolf; the wolf's counter-claim and a late fake Farrier swap could not survive.)
4. **Opus tables guard against tie tricks under Blood Price**: they refuse "split the vote" plans from unverified
   players, so vote-splitting lies rarely work; deception must change BELIEFS about who holds what, not vote arithmetic.

## 2026-11-22 Checkpoint 1 (environment, instruments, theory)

- Environment: local Convex backend reset (fresh database) and redeployed; `sim/smoke.ts` green, including after the
  mid-session merge of the copiers and the Pyre (8fdef55).
- Runner (sim/arena.ts): Opus default, vote phase in prompt and timeline, generalised redeal, fixed-scenario mode
  (fixed deal via `setup.fixDeal`, night plans queued by the runner with each seat's key, planning tools withheld from
  agents, fingerprint of deal + night log), `replays`.
- Instruments: sim/research/game.ts (loader, public transcript, truth), metrics.ts (I1-I4 + diagnostics), judge.ts
  (two neutral judges, fixed rubric), classes.ts (deal-class frequencies by enumeration).
- Pilot (A5, natural deal, 1 game, $4.32, 282 s; discussion ended by everyone ready after 99 s): both wolves held;
  Sage and Rustler both read the same wolf; wolf counter-claimed Sage; second wolf made a late fake Farrier claim
  ("I gave Dov the centre wolf") and proposed a "zero-risk" split; the table refused (Blood Price reasoning) and
  eliminated the read wolf 3-2. Centaurs won. Prediction for this class (Sage read the wolf, nothing moved): Centaurs,
  talk-dead. Both judges: ToM 2, deception 2, path 1, noise 0, honest-info-converged. Consistent with prediction.
  One game: no rate.

### Coordinator directions after checkpoint 1 (recorded)
- No merges into this checkout while games run; each checkpoint states whether a merge window is open; own fetch/merge only between runs.
- Commits are denied in this session; the record is the files on disk (log, predictions, change-requests); do not retry.
- Vote timer 60 s is a harness setting for AI tables, not a rules change.
- Main output of the fine pass: when a scenario sweeps, say WHY (what made one story unanswerable) and propose the smallest
  card or rule change that would have left a credible counter-story.
- Fine pass must include, per roster, at least one scenario chosen because it is predicted talk-live.

### Handover from the build session (recorded)
- shared/ and convex/ are now mine (pre-registered prediction + log entry per card change; npm test, tsc -p convex, smoke
  green; rules reference regenerated; src/ off limits; breaking changes listed under "for the UI").
- Reported landed upstream (to verify after merging at the next break): CR-1, CR-2 (cutDuringVote off), CR-3 (Ember-Carrier
  a blind night swap), CR-4 (Moon-Thief day swap behind `daySwap`, off), CR-5 (seeded replay; fingerprint incl.
  proclamation order).
- **Decision on X2 (owner's Ember-Carrier prediction).** The after-talk ember was removed on calibration grounds before it
  could be tested. I will not reintroduce it: the Moon-Thief with `daySwap` ON is the same structure (a swap chosen after
  the discussion has shown where the votes go) and is still a rule setting, so it serves as the empirical degeneracy
  control X1' (one fixed 5-player scenario, 3 replays). If X1' sweeps with low path dependence, the owner's prediction
  about the ember is confirmed by its structural twin; if not, my structural argument is wrong and the ember question
  reopens.

## 2026-11-22 Coarse pass 1 (14 games, 2 per roster, natural deals redealt until a wolf is held; ~$58)

Data: sim/runs/research/coarse1 (metrics.txt, metrics.json, judge-*.json per game). Old-code caveat: these games ran
before the merge of 3dd1da1 (old Heavy Hand; old Ember-Carrier absent from these decks).

| Roster | Result (2 games) | Judges mean ToM / deception / path / noise | c | Predicted |
| --- | --- | --- | --- | --- |
| A5 Spooker | wolves 2 (frame of own Spooker; false rotation story) | 2.8 / 3.5 / 3.5 / 1.3 | 1.00, 1.00 | Centaurs ~45% |
| B5 Twin Sage | Centaurs 2 (one real duel: the Moonsage lost to Herder count + Rustler) | 2.0 / 2.3 / 1.8 / 0.8 | 1.00, 0.75 | ~50% |
| C6 Mirror | Centaurs 2 (wolves' claims collided; Eavesdropper copied the Herder and duelled it, lost) | 1.0 / 1.0 / 1.3 / 0.0 | 0.80, 1.00 | ~55%, talk-live mirror |
| D6 Pyre six | Pyre 1 (a forced random Lure self-dress + fallback burning), Centaurs 1 | 1.5 / 2.3 / 1.8 / 0.8 | 0.60, 0.80 | C40/W35/P25 |
| E7 Seals | Centaurs 2 (two wolves claimed Centaur; a lone wolf's "team-only read" tell) | 2.0 / 2.0 / 1.8 / 0.3 | 0.67, 0.83 | ~55% |
| F7 Pyre seven | wolves 1 (fake Echo+Sage chain), Centaurs 1 (+Pyre side burn) | 2.3 / 2.8 / 1.8 / 1.0 | 0.67, 0.50 | C35/W35/P30 |
| G8 Grand | Centaurs 2 (wolf claim collisions; Herder count) | 2.5 / 2.5 / 2.5 / 1.0 | 0.71, 0.71 | C40/W35/P25 |

Totals: Centaurs 9, wolves 4, Pyre 1 (+1 side burning) of 14. Vote concentration: 13 of 14 games majority or
unanimous; unanimous 4; scattered 0 (G2 held: Opus tables concentrate). Judges agreed within 0.5 on average per scale;
`howWon` exact in 9 of 14 pairs (G5 held). Discussions ended by "everyone ready" every time, after 46-182 s (median
~90 s; 22-52 messages): Opus tables finish fast.

### What the theory got right
- Every wolf win came from a credibility card used as theorised: the Spooker's uncheckable rotation (A5 x2), a wolf
  framing its own wolf-team ally whose elimination is a wolf win (A5#1), a coordinated fake copy chain backed by the
  census knowing the Sage was in the centre (F7#1). Judges scored these deception 3.5-4, path 3-4.
- Talk-dead classes were talk-dead: "two honest looks at one seat" (pilot, D6#2) ended the same way.

### What it got wrong (and the general lesson)
1. **The wolves lose to their own claim collisions.** In 4 of 9 Centaur wins (C6#1, E7#1, G8#2, and B5#2's late
   Rustler claim) two pack members, each choosing a "safe" claim from the census independently, claimed the same role
   (twice "Centaur"). The census makes a claim safe against the Centaurs but not against your own partner, and the pack
   cannot talk at night. I had not modelled the wolves' coordination problem at all.
   *Heuristic 5: a team that cannot communicate privately needs either distinct information per member or a
   convention; otherwise its members' best individual lies collide.*
2. **The Herder is the Centaurs' sledgehammer.** Its true count of wolves in the centre turned claim-counting into
   proof in at least 6 of 9 Centaur wins (B5#1, B5#2, C6#2, D6#2, G8#1, G8#2). With the census, the wolves know the
   count too, but nothing lets them dispute it (no Stray Herder in these decks).
   *Heuristic 6: a single true, uncontestable global number collapses the world space; pair it with its twin or
   leave it out.*
3. **Owning a credibility card is not using it.** The Eavesdropper never made the mirror claim I predicted: in C6#2 it
   copied the Herder and claimed Herder, so it duelled a player two others could vouch for. The Moonsage did duel in
   B5#2 but against a Sage corroborated by a Rustler peek and a Centaur glance.
   *Heuristic 7: a mirror is only unanswerable if the original cannot be corroborated by a third party; predict
   duels by asking who can vouch for each side.*
4. Coarse games with natural deals rarely produced the class each roster was built for (B5's duel 1 of 2; C6's mirror
   0 of 2; E7's forged-vs-real seal 0 of 2). Cheap lesson: build the fine pass from constructed scenarios, which I did.

### Change requests arising (each to be pre-registered before implementing)
- **CR-6 (rosters, no code):** pair the Herder with the Stray Herder, or drop the Herder from 5-6 player rosters.
  Prediction: removes the count-proof in about two thirds of Centaur wins at those sizes; Centaur share falls toward
  half; path dependence rises.
- **CR-7 (new rule, "Pack covers"):** the census additionally hands each pack member a DIFFERENT suggested cover role
  drawn from the centre roles (told privately: "your cover: Rustler"; each pack member learns the others' covers too).
  Prediction: wolf-wolf claim collisions (4 of 14 coarse games) disappear; wolves' win share in 2-wolf deals rises;
  judges' deception score unchanged or higher because lies must now survive positional checks rather than counts.

## 2026-11-22 Fine pass 1, part 1 (fixed scenarios, 5 replays each, every replay the same fingerprint)

| Scenario | Predicted | Result | H(win) | c values | Judges ToM / dec / path / noise (agreement) |
| --- | --- | --- | --- | --- | --- |
| S1 A5 Spooker direction | wolves 3, C 2; talk-live | **wolves 3, Centaurs 2**; eliminated Dov 2, Alder 2, Esme 1 | 0.97 | .75 1 .75 1 1 | 1.6 / 3.0 / 2.9 / 1.7 (path within 0.2; ToM within 0.8) |
| S2 A5 frame own Spooker | wolves 4, C 1; weakly talk-live | **wolves 4, Centaurs 1** | 0.72 | 1 1 .5 1 1 | 2.4 / 3.3 / 3.1 / 1.0 (howWon 5/5) |
| S3 B5 Moonsage duel | C 2, wolves 3; talk-live | **Centaurs 5-0** (always the wolf, always 3-1 on him) | 0.00 | .75 x5 | 2.7 / 2.9 / 3.0 / 0.7 |

**S1 (talk-live, but partly noise).** Same night five times: the Spooker's rotation left the Sage (Alder) holding a
Werewolf and Dov holding the Sage. Three times the Spooker's false cycle got Dov (holding the Sage) or Esme eliminated;
twice the wolf side's lies collided and framed Alder, who unknowingly held a wolf, so the Centaurs won by accident
(judges: "unseen night movement", "blunder"). The variability is real and comes from talk, but the Centaur wins did not
come from Centaur insight: ToM 1.6, noise 1.7 (above the 1.5 target). Cause: the Werewolves do not know where the
Spooker sent their cards, and the Spooker does not know where the wolves are; three wolf-side players each lie from a
different partial picture (heuristic 5 again).

**S2 (talk-live, wolf-favoured as predicted).** The lone wolf knows from the census that the Sage is in the centre and
from its scent that Dov is wolf-team; it fake-claims Sage and "reads" Dov as a Werewolf. Dov, the Spooker, wins by
being eliminated (no Werewolf down = wolf win). 4 of 5: Dov or another non-wolf went out; 1 of 5 the Spooker's own
counter-claim accidentally exposed the wolf. Unanswerable element: an uncontestable Sage claim (Sage in the centre,
known only to the wolves) pointed at a wolf-team non-wolf, who is a free decoy.

**S3 (swept 5-0 Centaurs, yet talk mattered: path 3.0).** Why one story was unanswerable: the real Sage claimed first
("Bryn is a Werewolf"); the Moonsage counter-claimed Sage, and was even corroborated by an honest Rustler's peek; in
#2 four players were about to vote the real Sage. Each time the table was turned by a SECOND-ORDER census argument
(quotes: "If Alder were the Werewolf, the centre would hold WW + Moonsage + Sentry, so he'd know a real Sage is
sitting at the table. He'd never claim Sage"; "Bryn claimed CENTAUR, a role his census told him nobody holds"). The
census, meant to help the wolves lie, is common knowledge, so it lets the Centaurs reason about what a wolf WOULD
have claimed. The wolf's safe claim is itself the tell.
**Smallest change that leaves a counter-story (CR-8):** a partial census at small centres: at 3 centre cards the pack
learns 2 of the 3 centre roles (a new census option "two", or "three" generalised to "all but one"). Then a lone wolf
might not know whether the Sage is held, so "a wolf would never claim Sage" is no longer a proof, and "Centaur is the
safe claim" no longer singles the wolf out. Prediction for S3 under CR-8: Centaurs 3, wolves 2; path stays ~3; ToM
stays >= 2.5. Risk: wolves collide more with honest claims (more talk-dead "caught by collision" games elsewhere).

*Heuristic 8: any information the wolves get "for lying" is common knowledge of the rules, so the Centaurs can run the
wolves' decision problem backwards. Information that makes one claim strictly safe makes that claim a tell. Give the
liars uncertainty they share with the table, not certainty.*
*Heuristic 9: on a fixed scenario, a 5-0 sweep with high path dependence is not talk-dead: it means the discussion had
a reliable winning argument. Ask whether that argument rests on a rule (fixable) or on a player's slip (skill).*

## 2026-11-22 Fine pass 1, part 2 (S5, S7, X1'); totals

| Scenario | Predicted | Result | H(win) | c values | Judges ToM / dec / path / noise |
| --- | --- | --- | --- | --- | --- |
| S5 D6 Lure-dressed Phoenix | Pyre 2, C 2, W 1 | **Centaurs 4 (one with a side burning), Pyre 1** | 0.72 | .6 .8 .4 .6 .8 | 2.6 / 2.4 / **3.5** / 1.2 |
| S7 F7 Echo chain (new Heavy Hand) | W 3, C 2 | **wolves 3, Pyre 2** (Centaurs 0) | 0.97 | .5 .5 .5 .67 .5 | 2.5 / 2.8 / 2.9 / 1.1 |
| X1' Moon-Thief daySwap control | wolves 3-0, DEGENERATE | **Centaurs 3-0**; path 2.7 | 0.00 | .75 x3 | 2.0 / 1.5 / 2.7 / 0.7 |

Fine pass 1 overall: 28 games, ~$95 (5p ~$2.7, 6p ~$4, 7p ~$5). 6 scenarios, every replay matched its fingerprint.
Talk-live by the charter's test: S1, S2, S5, S7 (4 of 6). Sweeps: S3 (5-0, but path 3.0: a winning argument) and X1'
(3-0, path 2.7). No scenario was talk-dead in the I4 sense (path < 2).

**S5 (the best scenario so far).** The Lure dressed the Phoenix as a Werewolf, the honest Sage sincerely called it a
Werewolf, and the lone real wolf (who knew from the census that the "Werewolf" read was false) had to defend the Phoenix
without saying how he knew. 4 of 5 the Centaurs found the real wolf by MOTIVE reasoning: "If Bryn were a real wolf, why
would a non-wolf Dov need to lie? That's the Lure propping up a Phoenix it dressed as Werewolf... the one wolf is Cass"
(#5); "The only story where everyone acts rationally: Bryn is the Phoenix, Dov is the Lure... Cass is the wolf" (#1).
In #2 the Phoenix, cornered, claimed Phoenix and was disbelieved ("a wolf grabbing a safe claim") and burned. Judges'
highest path dependence (3.5) with consensus in the target band (median c 0.6). Prediction error: I over-rated the Pyre;
the wolf's need to defend the Phoenix is itself the tell (heuristic 8 again: the rule that aligns wolves with Centaurs
against the Phoenix makes the wolf's knowledge visible).

**S7 (talk-live but low consensus).** Three wolf-side seats (two Werewolves + an Echo that copied one) against two
Centaurs and two Pyre: the wolves won 3 by fake-Sage frames of the honest Rustler and a forced 3-3 tie under Blood
Price; the Pyre won 2 by a staged feud: with the Phoenix in the centre (fallback burning), the Lure fake-claimed Sage and
"read" its own partner as a Werewolf (#5 "Kindlers' fake feud gets Gale burned"). Centaurs never won: 2 Centaurs of 7
seats is too few voters. Concentration below target (4 of 5 plurality, c 0.5): three agendas at 7 split the vote.
Lesson: count VOTERS per team in a scenario, not just cards: with two honest voters the Centaurs cannot form a
majority even when they are right.

**X1' (my degeneracy prediction falsified).** I predicted the Moon-Thief's after-talk swap would win 3-0 whatever was
said. The Centaurs won 3-0 instead: each time they identified the Thief (its cover claim collided: a second "Centaur"
when both were accounted for; a Herder count it could only know from the census) and voted the THIEF, not the read wolf,
"because the Thief can't swap its own card". So an after-talk swap is NOT degenerate when (a) its user's card is immune
to itself and (b) the user can be identified by talk: the table simply re-targets. Caveat: in all three the Thief
blundered its cover; with a clean cover claim the structural argument still stands. The owner's original Ember-Carrier
was worse than the Moon-Thief in exactly this respect: eliminating the Ember-Carrier does not win for the Centaurs (it
is not a Werewolf), so re-targeting it gains them nothing. *Heuristic 10: an after-talk power is degenerate only if
its holder cannot be profitably targeted instead; check what eliminating the power's holder wins for the other side.*

### Cross-cutting lessons from fine pass 1
- Opus tables reach second- and third-order reasoning when the rules give them something to reason about (census
  backward-induction in S3, motive analysis in S5). ToM is highest where incentives are three-way.
- Wolf-side coordination failures (heuristic 5) produced 2 of S1's Centaur wins, the S2 Centaur win, and X1' losses:
  the single most common way the defectors lose. CR-7 (pack covers) addresses it.
- Discussions stay short (46-156 s) even when the table is split; the closing "ready" is triggered by perceived
  consensus, and secret ballots then show splits nobody discussed (S7 3-3).

## 2026-11-22 Fine pass 2 (3 scenarios x 5 replays, ~$53) and backend changes

| Scenario | Predicted | Result | c | Judges ToM / dec / path / noise |
| --- | --- | --- | --- | --- |
| S3b = S3 + `census: allButOne` | C 3, W 2 | **Centaurs 5-0 again** | .75 x5 | 2.3 / 2.8 / 3.2 / 1.0 |
| S1b = S1 + `packCovers` | W 3-4, little change | **wolves 3, Centaurs 2** (same as S1) | .75 1 .75 .75 .75 | 1.6 / 3.0 / 3.6 / 1.9 |
| S9 D6 double read (Lure-dressed Phoenix + true read of a wolf) | C 3, Pyre 1, W 1 | **Pyre 4, Centaurs 1** | .4 .6 .8 .8 .6 | 2.6 / 3.2 / 3.1 / 1.3 |

**CR-8 falsified as a fix (S3b).** The partial census did not break the sweep. The argument survived in probabilistic
form: "Alder would LIKELY know the Sage is held and still claimed Sage blind, first? Bad bluff" (#2); "Three worlds
fit... Bryn is the wolf in 2 of 3" (#3); and a new one: "a Moonsage KNOWS he isn't the Sage, so the moment I claimed
Sage he knew I was real... his win depends on saving you" (#1). The deeper asymmetry is not the census but CLAIM
ORDER: the real Sage claims first, and a first Sage claim is far more likely from a real Sage than from a wolf; the
counter-claimer is suspect whatever it knows. *Heuristic 11: reducing a tell from certain to probable does not remove
it for Opus tables; they reason in likelihoods ("2 of 3 worlds"). To kill a tell, make the honest and dishonest
behaviours equally likely, not merely uncertain.* Candidate (CR-10, opening statements): simultaneous first claims
remove the first-claim advantage; that is now the better test for this scenario.

**CR-7 neutral where predicted (S1b).** Covers did not change S1 (3-2 both times): its wolf-side failures were
Spooker-vs-wolf, not wolf-vs-wolf. Covers still untested where they should matter (two pack members both lying).

**S9: the Phoenix learned the reverse bluff, and doomed wolves kingmade the Pyre.** Tables expect a Phoenix to welcome
votes, so the Phoenix FOUGHT the votes ("I'm NOT the Phoenix: a Phoenix would just take the wolf read and smile, not
fight it", #5) and was eliminated as "the wolf I saw" 4 of 5 times. In #4 the two real wolves, once their own Esme was
in danger, switched their votes to the Phoenix: a burning denies the wolves anyway, so they preferred the Pyre winning to
the Centaurs winning. *Heuristic 12: when a team cannot win, it becomes a kingmaker; with three teams, predict where the
losing team's votes go (here: against the leader).* Path 3.1, deception 3.2: a high-quality talk-live scenario, but
Pyre-heavy; D6's balance depends on whether the Phoenix is read as a wolf.

### Backend changes made (as owner of shared/ and convex/), all with tests; 104 engine tests, tsc, smoke green
- **Copier leak fixed** (reported by the app session): the Gleaner's pre-copy `stepsIfYouBecome` was built from the
  DEALT CENTRE, telling an AI Gleaner which decision-bearing roles lay there. Now every copier's options come from the
  deck (`copierOptions` in shared/engine.ts); verified live: two different deals of one Gleaner deck show identical
  options. The Echo was not affected. Any Gleaner game before this fix is contaminated.
- **New rule option `bloodPriceCondemned`** (CR-9, default off): an eliminated Centaur-team player counts against the
  Centaurs only if a non-Werewolf-team player voted for them. Test: a 3-3 parity bloc tie now wins for the Centaurs;
  a Centaur hedge still costs them.
- **New rule options `census: "allButOne"` and `packCovers`** (CR-8, CR-7; default off), as recorded above.
- **Final result exposes held card instances**: app view `game.final.inst` / `final.cinst`; MCP `result.heldInstances`.

### For the UI (additive only; nothing renamed or removed)
- `settings.rules` may carry `bloodPriceCondemned`, `packCovers` (booleans) and `census: "allButOne"`.
- `game.final.inst` (instance per seat) and `game.final.cinst` (instance per centre slot) in the app view.
- A census journal line may end with "Pack covers (...)"; a result's `notes` may carry the condemned-Blood-Price note.

## 2026-11-22 CR-9 parity test (P6: 3 wolf-team hands of 6; ~$30)

| Arm | Predicted | Result | c | Judges ToM / dec / path / noise | I4 |
| --- | --- | --- | --- | --- | --- |
| rule off (control, 3 replays) | wolves 2-3 of 3 | **wolves 3-0** (2 framed the Rustler, 1 forced a 3-3 Blood Price tie) | .8 .6 .8 | 2.2 / 2.5 / **1.5** / 1.0 | **DEGENERATE** |
| `bloodPriceCondemned` (5 replays) | Centaurs 3-4 of 5; path >= 2.5 | **Centaurs 4, wolves 1**; path 3.3 | .6 x5 | 1.9 / 2.7 / 3.3 / 1.3 | talk-live |

Prediction held in both arms. With the rule, the three honest players held their two true reads against a three-voice
wolf story, and the 3-3 tie that used to be a wolf win became a Centaur win; the one wolf win (#4) came from talk: a
late "Dov may secretly have taken Cass's wolf" argument split the Centaurs' votes. The rule turns the parity scenario
from degenerate to talk-live. What it does not change: the vote shape. Every game was a 3-3 bloc-vs-bloc tie (c = 0.6
every time), and ToM stayed under 2: once both sides vote as blocs the game is decided by whether the honest bloc
stays together. Recommendation: make `bloodPriceCondemned` the default at 6 and 8 players (where parity deals are
common) and keep deck composition limiting wolf-team hands (the 6-player session's rule of thumb).
*Heuristic 13 (with the 6p session's P6-1): under Blood Price, any configuration where one side can force a tie with
its own votes is decided by arithmetic. Check every roster for "can a team reach half the hands?" and, if so, whether a
tie it forces counts.*
Note on instruments (from the 8-player session): judges can score high path dependence in every replay of a scenario
that sweeps (8p Lure-Phoenix 5-0 with path 3.6; my S3 5-0 with path 3.0). Per-game path dependence measures "the talk
was pivotal in this game", not "a different talk would have changed this scenario". The charter's talk-live test
already requires a minority outcome, so a sweep is never talk-live; report "path high but swept" separately as
"decided by a reliable argument" (heuristic 9).

## 2026-11-22 CR-10 opening statements, tested (10 games, ~$30)

| Scenario | Without (fine pass 1) | Predicted with | Result with `openingStatements` | Judges ToM / dec / path / noise |
| --- | --- | --- | --- | --- |
| S3c B5 Moonsage duel | Centaurs 5-0 | Centaurs 4, wolves 1 | **Centaurs 5-0** | 2.6 / 2.8 / 2.9 / 0.9 |
| S5b D6 Lure-dressed Phoenix | Centaurs 4 (1 with side burning), Pyre 1 | C 3, Pyre 1-2 | **Pyre 4, Centaurs 1** | **3.0 / 3.4** / 3.2 / 1.0 (agreement 0.0 on every scale) |

**S3c: claim order was not the cause; the census is.** All five opening rounds were simultaneous (Sage and Moonsage
both claimed Sage blind) and all five were again decided by the census argument: "a Werewolf gets the census, so
wolf-me would know Sage is dealt to a player... claiming Sage would be suicide" (#1); "World B: centre = Werewolf,
Moonsage, Sentry, so wolf-Alder KNOWS the real Sage is a live player and claims Sage anyway? He'd claim Sentry
instead" (#2). Three tests now point at one cause (S3 full census, S3b partial census, S3c simultaneous claims): the
Den Census makes the "Alder is the lying wolf" world implausible, because a wolf that knows the centre would not choose
the one claim guaranteed to be contested. The 8-player session's decision-theory point (eliminating a Moonsage never
wins for anyone voting it) narrows the table's choice to "Bryn or Alder", and the census settles that choice.
**Smallest remaining fix to test (CR-12): S3 with `census: "off"`** (prediction: Centaurs 3, wolves 2): a wolf that
cannot know whether the Sage is held may well claim Sage. Cost: wolves elsewhere lose their safe claims and collide
with honest ones more (the coarse pass showed census-safe claims in 43 of 43 games). Alternative: the 8-player
session's `hollowsage` (a twin that counts as a Werewolf) makes "the counter-claimer is a wolf" true in more worlds.

**S5b: simultaneous openings help the Pyre and hurt the reading side.** In fine pass 1 the lone wolf could wait, see
the Sage's "Werewolf" read on the dressed Phoenix, and defend the Phoenix obliquely, and the Centaurs read that
defence ("why would a non-wolf need to lie?"). With openings, every role commits blind; the Lure's fake corroborating
Rustler claim and the Phoenix's staged resistance are on the table before anyone can react, and four of five tables
burned the Phoenix. The judges rate these the cleverest defector wins of the night (deception 3.4). So CR-10 is not a
neutral harness fix: it shifts power to whoever profits from a pre-committed story (Pyre, framers) and away from
whoever profits from reacting (the wolf who defends, the Centaurs who read reactions).
*Heuristic 14: simultaneous commitment rewards teams whose plan is fixed at dawn and punishes teams that win by
reacting. Predict its effect per team by asking who needs to see others' claims first.*
**Recommendation:** keep `openingStatements` as an option, not a default; at 6 players with the Lure + Phoenix, it
makes the Pyre too strong (Pyre 4 of 5 in both S9 and S5b).

**My view on the Pyre (requested): what should let the Centaurs beat the reverse bluff through talk.** The reverse
bluff works because the table has no way to tell "a wolf fighting a true read" from "a Phoenix pretending to fight a
dressed read": both are consistent with every mechanic, and the one player who knows the truth (the wolf, via the
census and the pack) cannot say so without exposing itself. Smallest changes that leave the Centaurs a counter-story:
(1) make the Lure's dress visible to its target: the Phoenix holder is told "your card was dressed as X tonight", so a
Phoenix's denial "I'm not the Phoenix" is now a claim the Phoenix KNOWS to be risky; weak. (2) Better: the dress shows
the chosen role only to looks taken BEFORE the Sage's turn ends... no: too fiddly. (3) Best, and simplest: the Lure
must dress a card OTHER than a Phoenix-dealt seat (it may still dress any other card, e.g. frame a Centaur so the Pyre
gains through chaos, or dress a Kindler), so the Pyre's route to a burning is talk (the Phoenix acting guilty) rather
than an honest seer's sincere testimony. Prediction for (3): the Pyre's share in Lure scenarios falls from about 4 of 5
to about 1-2 of 5; path stays >= 3. Also: `burningDeniesWolves` makes doomed wolves kingmake the Pyre (S9#4); with it
off, wolves would rather tie a Centaur than burn the Phoenix. Worth one test at 6 players.

## 2026-11-22 CR-12: S3 with the census off (5 replays, ~$14)

Predicted Centaurs 3, wolves 2. **Result: Centaurs 5-0 again** (path 2.4, down from 3.0; ToM 2.0; 2 of 10 verdicts
"blunder"). Without the census the lone wolf claimed blind and was caught by counting or by its own flip-flops ("that's
THREE Sage-looking cards, but only two exist and nothing moved. So Bryn is lying."; "Bryn, you just admitted your first
claim was a lie"). Four variants of one night (full census, partial census, simultaneous claims, no census): 20 of 20
Centaur wins. **Conclusion: the census was a sufficient but not a necessary cause.** The scenario is decided by its
structure: a true read on the ONLY held Werewolf, plus an independent true count (Herder: one wolf in the centre), and a
twin whose elimination can never win for whoever votes it. With the census the wolf's safe claim is a tell; without it
the wolf collides. The duel adds talk but cannot change the decision "Bryn or Alder", where Bryn is the wolf in more
worlds. *Heuristic 15: a true read of the only Werewolf plus an independent count is decisive whatever the wolves
know; a twin duel only creates doubt if voting the twin can also win (the 8-player session's `hollowsage`, a twin that
counts as a Werewolf), or if the count is contestable (CR-6: Stray Herder).* Next test for this scenario would be the
Herder replaced by a Stray Herder-contested count, not another census variant.

**Opening statements, reconciled with the 6-player session** (its PY6: openings moved the Pyre roster TOWARD balance,
the opposite of my S5): both results fit one rule: the option hurts whichever side's plan depended on claiming after
seeing the others. In PY6 that was the lone wolf (it claimed last to avoid collisions; forced to commit blind it
collided or claimed a read it could not have had). In my S5 it was the wolf defending the Phoenix and the Centaurs
reading that defence, while the Pyre's story (the Lure "corroborating" the dressed read) needed no one else's claim.
Its first-message ranks without openings (honest 2.2-2.3, Phoenix 4.7, Lure 4.8, Werewolf 5.3) match my 0.29 vs 0.72.
So the effect is scenario-specific: predict it by asking, per team, "does my plan need to see claims first?"
