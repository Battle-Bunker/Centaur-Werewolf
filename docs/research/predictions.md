# Pre-registered predictions

Written BEFORE the research games (only one pilot game had started, on roster A5). Card reasoning:
docs/research/card-calibration.md. Measures: docs/research/charter.md. Deal-class frequencies are exact enumerations
of deals (sim/research/classes.ts), conditional on the redeal rule stated; they involve no simulated play.

Common settings unless stated: default rules (Blood Price on, census "all", proclamations at dawn, 2 votes to
eliminate, optional steps may be declined, chat closed in the vote, `burningDeniesWolves` on, `pyreFallback` kindler),
3 centre cards, discussion 240 s, vote 60 s, all seats Opus at medium effort. Coarse games are redealt until a player
holds a Werewolf card (a no-wolf deal is a different game; its frequency is stated and it is not tested in batch 1).

## 0. General predictions about all-Opus tables

- **G1.** Centaur movers with an optional step (Rustler, Farrier) usually decline it (round 1 and 2 finding). Movement
  comes mostly from mandatory movers and the Spooker.
- **G2.** Opus tables coordinate explicitly ("everyone on X"), so vote concentration is high: median c about 0.75,
  unanimous (c = 1) in about a third of games, scattered in under a fifth.
- **G3.** With chat closed in the vote phase, the round-2 tactic of a planned last vote to engineer a tie disappears;
  fewer two-seat eliminations than round 2.
- **G4. The main risk to the owner's target.** Given identical information, fresh Opus tables reach the same reading
  most of the time. I predict that about half of all fixed scenarios tested will be sweeps (5-0); the talk-live ones
  will be those with a mechanically unrefutable claim in play (a twin, a mirror, a direction lie, a forged seal, a
  Lure-dressed card), and within them the outcome will swing on WHO CLAIMS FIRST and on whether a liar commits to a
  detail before the honest player speaks.
- **G5.** Judges: mean ToM around 2 (first-order modelling), deception around 2, noise at most 1 on the good rosters.
  The two judges will agree within 1 point on most items; `howWon` exact agreement around two thirds.

## 1. Owner's prediction and my after-talk predictions (the degeneracy checks)

- **X2 (owner).** The vote-lock Phoenix swap (Ember-Carrier) makes the Pyre win whenever a Phoenix is held. My
  version: whenever the Ember-Carrier is held by a player other than the consensus target and the table forms a
  consensus, the Pyre wins; the Centaurs' only routes are to eliminate the Ember-Carrier itself or to scatter (which,
  with a wolf held, hands the win to the wolves). So the Centaurs almost never win, and within a fixed scenario the
  winner does not depend on what is said. **Test (fine pass, cheap):** one 6-player scenario (roster D6 with the Lure
  replaced by an Ember-Carrier; Phoenix and Ember-Carrier held; the Sage reads a Werewolf), 3 replays. Predicted:
  Pyre 3-0, judges' pathDependence below 2, I4 flags it degenerate. Falsified if the Centaurs or the wolves win any
  replay by talk (e.g. the table identifies the Ember-Carrier, or bluffs its target).
- **X1.** The Moon-Thief has the same structure (a wolf-side vote-lock swap): with the Thief dealt and not the target,
  the wolves win whatever is said. Theory only for now (the build session is switching it off by default).
- **X3.** Hush with `cutDuringVote` on: a cut timed at the vote's start turns the key Centaur's vote random. Talk
  cannot answer it. Change request CR-2; not tested.
- **X4.** Notary with no Counterfeiter/False Witness: a sealed true read makes the scenario talk-dead for the Centaurs
  whenever the read hits a wolf. Not tested (avoided in rosters).
- **X5.** Heavy Hand at 5 players: its two weighted votes reach the elimination threshold alone; any scatter burns
  the Phoenix. Too strong at 5; fine at 7+. Not tested at 5.

## 2. Candidate rosters, batch 1

For each: thesis, scenario classes, expected play in the common classes, predicted winners WITHIN those classes,
vote concentration, judge scores, and the falsifier. "Talk-live" as defined in the charter (I1).

### A5 "Spooker" (5 players): werewolf x2, spooker, sage, rustler, farrier, sentry, centaur
Baseline with prior evidence (round 2: all-Opus wolves won 2/2, both by the Spooker lying about its rotation).
- Classes (given a wolf held; 8% of natural deals hold none): 1 wolf + Spooker + Sage 24%; 1 wolf + Spooker 16%;
  1 wolf + Sage 16%; 2 wolves (any) 40%; 1 wolf alone 4%.
- Common play (1 wolf + Spooker + Sage): Sage claims its read first; Sentry reports which neighbours moved; the
  lone wolf claims a centre role known from the census; the Spooker either claims a rotation that moves the wolf
  card onto a Centaur (reversed direction) or claims to be something else. Crux: the direction of the rotation and
  whether the self-declared Spooker is the Spooker. Likely vote: the seat holding a wolf in most readings.
- Within-class winners: if the rotation touched the read seat or the wolf seat, talk-live, Centaurs 2-3 of 5;
  if it touched neither and the Sage read the wolf, Centaurs 5-0 (talk-dead); if the Sage missed, Centaurs 2-3 of 5
  (the lone wolf survives by a safe centre claim unless a glance collides).
- Overall: Centaurs about 45%. c median 0.75, unanimous about 25%. Judges: ToM 2.0, deception 2.0, path 2.5, noise 1.
- Falsifier: a direction-ambiguous fixed scenario going 5-0 with path < 2 (the tables apply one fixed heuristic, such as
  "a wolf-side mover always lies, take the reverse"). Then the Spooker is talk-dead too and the roster fails.

### B5 "Twin Sage" (5 players): werewolf x2, moonsage, sage, rustler, centaur, sentry, herder
Thesis: two true-sounding Sage claims (the Moonsage reads truly and reads as a Sage) force the table to model who
would say what; the Herder's true count and the census-informed wolves add structure.
- Classes: 1 wolf + Moonsage + Sage 24%; Moonsage without Sage 28%; Sage without Moonsage 28%; neither 12%; (none 8%).
- Duel play: both claim Sage; each read is checked against its target's own claim. The Moonsage does not know the
  wolves (not pack); if it read a Centaur it can frame them ("X is a Werewolf") or report truly and attack the real
  Sage's read. The census tells the wolves the Sage is held (not in the centre), so they know a duel is coming and
  can back the Moonsage. Crux: which Sage's read fits the other claims and the Herder count.
- Uncontested Moonsage (Sage in the centre): a fake Sage with a true read, refutable only if a Centaur's glance finds
  the Sage in the centre (a third of the time per glance). Wolves favoured.
- Within-class winners: duel 2-3 of 5 for the Centaurs (talk-live); uncontested Moonsage: wolves 3-4 of 5;
  Sage alone: Centaurs 4-5 of 5 (mostly talk-dead when the read hits a wolf).
- Overall Centaurs about 50%. c median 0.75. Judges: ToM 2.3, deception 2.3, path 2.5, noise 0.8.
- Falsifier: duels resolved the same way in every replay (e.g. "the first Sage to claim is believed").

### C6 "Mirror" (6 players): werewolf, eavesdropper, sage, herald, rustler, sentry, herder, centaur x2
Thesis: the Eavesdropper's copied true result makes two identical true claims; Blood Price forbids the tie hedge.
- Classes (given a wolf held): Eavesdropper held about 75%; Werewolf held about 75%; both about 50%; the Sage held
  about 67%. The census lets the pack copy a role it knows is held.
- Play: the Eavesdropper copies the Sage (or the Herder) and claims it. If the Sage read the Eavesdropper itself, the
  copy warns it: it pre-empts by claiming Sage with another read. Crux: two Sages, same or conflicting reads; who
  claimed first; whose story survives the Herald's proclamation and the Herder's count.
- Within-class winners: mirror duel 2-3 of 5 (talk-live); Eavesdropper exposed by the Sage's read and not mirrored:
  Centaurs 4-5 of 5.
- Overall Centaurs about 55%. c median 0.7; a mirror duel may scatter (c <= 0.5) in some replays. Judges: ToM 2.2,
  deception 2.2, path 2.5, noise 1.3 (the pure mirror is the noise risk).
- Falsifier: mirror-duel replays mostly scattered or decided by visibly arbitrary choices (noise >= 2): then the
  Eavesdropper needs a tell (amend: it copies with a delay or a gap the table can probe).

### D6 "Pyre six" (6 players): werewolf x2, phoenix, lure, sage, rustler, sentry, centaur, herder
Thesis: a three-way table. The Lure dresses the Phoenix as a Werewolf so that honest seers condemn it; the wolves
(census, pack) KNOW whether a "Werewolf" read is false, and since a burning denies them, they must defend the
Phoenix without revealing how they know: second-order talk on all sides.
- Classes (given a wolf held): Phoenix held about 60%; Lure held about 60%; both held about 39%; Sage held about 60%.
- Play: the Phoenix acts suspicious but not like a Tanner; the Lure claims an info role or backs a "wolf" read on the
  Phoenix; a Sage that read the dressed Phoenix sincerely calls it a Werewolf. The wolves, who know it is not one of
  them, defend it obliquely. Crux: is the accused a wolf or the Phoenix; the Herder's count.
- Within-class winners (Phoenix + Lure held): Centaurs 2, wolves 1-2, Pyre 1-2 of 5 (talk-live). Phoenix held
  without Lure: Pyre about 1 of 5.
- Overall: Centaurs about 40%, wolves 35%, Pyre 25%. Lower concentration (c median 0.65). Judges: ToM 2.5 (the most
  of batch 1), deception 2.5, path 2.8, noise 1.2.
- Falsifier: the Pyre never wins (the Phoenix is spotted as a Tanner every time) or wins over half.

### E7 "Seals" (7 players): werewolf x2, counterfeiter, notary, signet, sage, rustler, sentry, centaur, herder
Thesis: engine-backed credibility (seals) that can be forged once; the real Notary or Signet may withhold its seal
to bait the forger (second-order play).
- Classes (given a wolf held): Counterfeiter + Notary + Signet held about 27%; Counterfeiter held with the Notary in
  the centre about 22%; Counterfeiter in the centre about 30% (then every seal is real).
- Play: the Counterfeiter forges either a Notary report framing a Centaur or a Signet message vouching for a wolf.
  With both Notary seals out, the table knows one is forged and judges by content and timing.
- Within-class winners: forged vs real Notary: Centaurs 3 of 5 (talk-live); uncontested forged Notary report: wolves
  3-4 of 5; Counterfeiter in the centre: Centaurs 4-5 of 5 (talk-dead: real seals are proofs).
- Overall Centaurs about 55%. c median 0.8 (seals focus votes). Judges: ToM 2.3, deception 2.5, path 2.3, noise 0.8.
- Falsifier: Notary/Signet always post at once (no baiting) and the duel is always resolved the same way.

### F7 "Pyre seven" (7 players): werewolf x2, phoenix, lure, heavyhand, echo, sage, rustler, sentry, centaur
Thesis: three teams at 7; the Heavy Hand punishes a scattered vote; the Echo (copies a player at wake 3) adds a true
early read and a duplicate (or a night defection if it copies a wolf, or a second Phoenix).
- Classes (given a wolf held): Phoenix held about 70%; Heavy Hand held about 70%; Echo held about 70%.
- Play: Pyre members push a "wolf" case on the Phoenix; the Heavy Hand's vote means the Centaurs and wolves must put
  at least 3 votes elsewhere. Crux: three-way persuasion; whoever forms the consensus first.
- Overall: Centaurs 35%, wolves 35%, Pyre 30%. c median 0.6. Judges: ToM 2.3, deception 2.3, path 2.5, noise 1.5.
- Falsifier: noise >= 2 (too many agendas for consensus) or the Pyre above half.

### G8 "Grand" (8 players, 3 centre): werewolf x2, moonsage, phoenix, lure, sage, echo, rustler, sentry, herder, centaur
Thesis: the B5 twin duel and the D6 three-way at 8 players, with the Echo for a true early read.
- Overall: Centaurs 40%, wolves 35%, Pyre 25%. c median 0.6. Judges: ToM 2.4, deception 2.3, path 2.5, noise 1.3.
- Falsifier: as for B5 and D6.

## 3. Which rosters get games, and why (triage)

- Coarse pass (2 natural-deal games each, to catch bugs and broken rosters): A5, B5, C6, D6, E7, F7, G8.
- Fine pass: the scenarios I expect to be talk-live (A5 direction-ambiguous, B5 duel, C6 mirror, D6 Phoenix+Lure,
  E7 forged-vs-real seal), taken from coarse games where possible, 5 replays each (the coarse game counts as one
  replay only if its night decisions are reproduced exactly; otherwise 5 fresh); plus X2 (3 replays) as the
  predicted-degenerate control that checks my judgment and the I4 instrument.
- Not spending games on: Moon-Thief, Hush-in-vote, Notary without a forger, Wisp/Fogbank, Poacher (predicted bad for
  stated reasons, and the Moon-Thief and the Ember-Carrier are being changed by the build session anyway).

## Addendum 2026-11-22 (after the build session's calibration commit 3dd1da1; written before merging it here)

Checked against the merged rules reference (origin/develop 5f62f40). Changes that touch batch 1:
- **Heavy Hand** now counts double whoever it votes for (not only for a Phoenix holder). F7: my X5 worry (two
  weighted votes on the Phoenix reach the threshold alone) still holds at 5-6 players, but the vote can now also be
  wasted; at 7 the card becomes a Chiron for the Pyre. F7 prediction unchanged (C35/W35/P30) but noise lower (1.2).
  The two F7 coarse games and the G8 games were played on the OLD Heavy Hand / old code (started before the merge).
- **Ember-Carrier** is now a mandatory blind NIGHT swap of two other players' cards in the brood's turn (my CR-3, in a
  slightly different form). X2 (the after-talk ember) no longer exists, so it cannot be the degeneracy control.
  **Replacement control X1':** the Moon-Thief with the `daySwap` rule ON (`thiefMinPlayers` 5), one 5-player fixed
  scenario where the Thief is held, the plain Werewolf is read by the Sage and nothing moved: predicted wolves 3-0,
  judges' path < 2, I4 flags it degenerate. Falsified if the Centaurs win a replay by talk (e.g. they identify the Thief
  and vote it, or bluff their target).
- **New Ember-Carrier prediction (E1):** as a night card it is a Pyre Spooker with knowledge: it knows the dealt Phoenix
  seat, so it can carry the Phoenix to a seat that does not know it now wants to burn, and claim anything about its own
  swap. Fine (credibility power); the Sentry can see that the two seats moved.
- **Moon-Thief** day swap off by default: without it the Moon-Thief is a plain pack Werewolf (W as a distinct card).
- **cutDuringVote** is still on by default: CR-2 did not land; I will change it (prediction in log.md).
- A5, B5, C6, D6, E7 and G8 cards are otherwise unchanged; their predictions stand.

## Fine pass 1: pre-registered scenario predictions (2026-11-22, before any replay)

Each scenario: fixed deal, night seed and night decisions (checked with sim/research/scenario-check.ts: the night ran as
intended). 5 replays each (X1' 3). "Talk-live?" is my prediction of the charter's test. Seats in brackets.

- **S1 A5-direction** (replay of coarse A5#2): wolves Cass(0), Dov(4); Sage Alder(1) read the Spooker Bryn(3); the
  Spooker rotated Cass->Alder->Dov->Cass, so Alder (the Sage) now holds a Werewolf, Dov holds the Sage, Cass still a
  Werewolf; the Sentry Esme(2) saw only Alder's card move. Crux: the Spooker's claimed direction. Coarse result: the
  Spooker's false cycle got Dov (holding Sage) eliminated. **Predict: talk-live; wolves 3, Centaurs 2.** Judges path >= 3.
- **S2 A5-frame** (replay of A5#1): lone wolf Alder(3) knows (census) the Sage is in the centre and (scent) Dov(1) is
  wolf-team (the Spooker); nothing moved near the Sentry. Eliminating the Spooker wins for the wolves. **Predict:
  wolves 4, Centaurs 1; talk-live only weakly** (the frame is hard to answer because the wolf side wins either by
  Dov's or by nobody's elimination; the Centaurs need to see that the Sage claim is uncontestable because the Sage is in
  the centre, which they cannot know). If 5-0 wolves: the unanswerable element is "a wolf-team non-wolf is a free
  decoy"; candidate fix: the Spooker's elimination should not count as a wolf win (it already does not count as a
  Centaur win; it is the "no wolf eliminated" default that wins).
- **S3 B5-duel** (constructed): Sage Alder(0) read the lone wolf Bryn(1); the Moonsage Dov(3) read the Rustler
  Cass(2) truly; the Rustler peeked Dov and saw "Sage" (the twin passes); Herder Esme(4) counted 1 wolf in the centre.
  So the Moonsage's Sage claim is mechanically CORROBORATED by an honest Rustler, and the real Sage accuses the wolf.
  **Predict: talk-live; Centaurs 2, wolves 3.** Falsified as talk-dead if the table always reasons "a twin in the deck +
  the accused wolf backs one Sage" the same way.
- **S4 C6-mirror** (constructed): Sage Alder(0) read Bryn(1) = Centaur; the Eavesdropper Cass(2) copied exactly that;
  Herald proclaimed centre 2 = Herder; Werewolf Esme(4) unread; Sentry: nobody near moved. The Eavesdropper can claim
  Sage with the identical read. **Predict: talk-live; Centaurs 3, wolves 2; noise judged >= 1.5** (a pure mirror).
- **S5 D6-lure** (constructed): Lure Dov(3) dressed the Phoenix Bryn(1) as a Werewolf; Sage Alder(0) read Bryn as a
  Werewolf (truly Phoenix); Herder: 1 wolf in the centre, so exactly one held: Cass(2), who knows from the census that
  the Phoenix and the Lure are held, hence that "Bryn = Werewolf" is false. **Predict: talk-live three ways: Pyre 2,
  Centaurs 2, wolves 1.** Judges ToM >= 2.5.
- **S6 E7-seals** (constructed): Notary Alder(0) read Cass(2) = Signet; Sage Esme(4) read Fen(5) = Centaur; lone wolf
  Bryn(1) scented the Counterfeiter Dov(3) (an ally); no read touches a wolf; Herder in the centre. The Counterfeiter
  may forge a Notary report framing anyone. **Predict: talk-live; Centaurs 3, wolves 2.**
- **S7 F7-chain** (replay of F7#1, now with the NEW Heavy Hand rule): the Echo Dov(2) copied the Werewolf Fen(3) (three
  wolves: Fen, Bryn(6), Dov); the Rustler Alder(0) saw Fen as a Werewolf; the Lure Esme(4) dressed herself as a Sage;
  Phoenix and Sage in the centre. Coarse: the wolves built a fake Echo/Sage chain and won. **Predict: wolves 3,
  Centaurs 2; talk-live.**
- **X1' Moon-Thief control** (`daySwap` on): Sage Alder(0) read Bryn(1) = Werewolf; the Moon-Thief Cass(2) is unread and
  can safely claim a centre role (Herder/Sentry per census); the table will converge on Bryn; Cass swaps Bryn's card
  away at the vote's end. **Predict: wolves 3-0, judges' path < 2: DEGENERATE.** Falsified if the table targets Cass
  (reasoning that a consensus on Bryn is what the Thief wants).

## Pre-registration 2026-11-22: two new rule OPTIONS (defaults unchanged)

- **CR-8 `census: "allButOne"`**: each pack card learns all but one (random, seeded) of the roles dealt to the centre.
  Prediction on S3 (B5 Moonsage duel): from Centaurs 5-0 to about 3-2; the census backward-induction argument
  ("a wolf would know the Sage is held") loses its force; path stays about 3; noise rises slightly (<= 1.2). Elsewhere:
  wolves collide with honest claims a little more often (a census-"safe" claim may hit the unknown role).
- **CR-7 `packCovers: true`**: the census also hands each pack member a DIFFERENT cover role from the Centaur-team roles
  in the centre (told privately, and each learns the others' covers). Prediction: wolf-wolf claim collisions (4 of 14
  coarse games, 1-2 per 5 replays in S1/X1') go to about zero; in two-wolf deals the wolves' share rises by about a
  quarter; deception scores unchanged or higher. Risk: a cover is "the safe claim", hence a tell (heuristic 8): the
  table may learn "the wolves always claim centre roles"; combined with allButOne this risk falls.

## Pre-registration 2026-11-22: CR-6 (Herder needs a contradicting card), NOT yet activated

Proposed deck rule: "A Herder needs a Stray Herder in the deck" (same pattern as Herald needs Forger). Prediction: in
5-6 player decks the Herder claim becomes contestable (a Stray Herder passes for a Herder and claims the true count, or
a false one); the "count proves it" Centaur wins (about 6 of 9 coarse Centaur wins) become duels; Centaur share at 5-6
players falls by about a fifth; path dependence rises. Not activated yet: all four per-count sessions pre-registered
rosters with a Herder and no Stray Herder, and the recommended deck uses a Herder; a hard deck rule now would
invalidate their running experiments. To activate after their current fine passes (coordinator to schedule).

## Fine pass 2: pre-registered (2026-11-22, before any replay; scenarios checked with scenario-check.ts)

- **S3b = S3 with `census: "allButOne"`** (the lone wolf's census: Centaur, Sentry, one role unknown, so it cannot know
  whether the Sage is held). Prediction (as for CR-8): Centaurs 3, wolves 2 (S3 was 5-0); path about 3; the census
  argument ("a wolf would never claim Sage") is no longer made, or is answered.
- **S1b = S1 with `packCovers: true`** (covers: Cass Farrier, Dov Rustler). In S1 the wolf side's failures were
  Spooker-vs-wolves collisions, not wolf-wolf ones, so I predict covers change little: wolves 3-4, Centaurs 1-2;
  noise slightly lower (<= 1.5) because the two wolves now tell non-colliding stories.
- **S9 D6 double read** (6p; Herder in the centre, so no count): the Lure dressed the Phoenix Cass as a Werewolf; the
  Rustler Dov sincerely saw "Werewolf" on Cass; the Sage Bryn truly read the Werewolf Esme; the second wolf Alder is
  unread. Two honest "Werewolf" reports, one false. A tie Esme+Cass would be a Centaur win AND a burning; Cass alone a
  Pyre win; Esme alone a Centaur win. The wolves know Cass is not a wolf (pack). Prediction: Centaurs 3, Pyre 1,
  wolves 1; talk-live; ToM >= 2.5; c 0.5-0.8.
