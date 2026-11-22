# 8 players: pre-registered predictions

Written 2026-11-22 BEFORE any 8-player research game except one setup-verification game (V8#1, described below; it
informed these predictions and is labelled as such). Measures: docs/research/charter.md. Deal-feature frequencies:
exact enumeration of deals, conditional on a player holding a Werewolf card (`sim/research/features.ts`, new: it
prints P(feature) for named predicates over the held roles; deal combinatorics only, no play).

## What the verification game taught before any prediction (V8#1, natural deal, 1 game, $4.67, 272 s)

Deck: 2 Werewolf, Moonsage, Sage, Rustler, Sentry, Centaur, Pickpocket, Spooker, Farrier, Drifter; centre 3
(Pickpocket, Moonsage, Spooker). Discussion 71 s, 37 messages; Centaurs won, 6 votes of 7 on the read wolf.
- **The claim space fills before the wolves speak.** Six Centaur claims landed within 30 s; both wolves spent ~40 s
  composing and then had nothing left to claim. The census told them the centre held Moonsage, Pickpocket and Spooker:
  two wolf-team roles and a card the Drifter had already publicly taken. There was no safe Centaur claim at all.
- Both wolves then claimed Farrier, the third claim to it: the hub's heuristic 5 (claim collision), made worse at 8
  seats because the honest roles claim first and fast.
- The Sage's claim was doubted only through the Moonsage, which was in the centre: the wolves' counter-story
  ("Cass is the Moonsage") needed three liars and the table counted liars.

**Working theory for 8 seats.** With 8 seats and 3 centre cards, 73% of every card is held and most Centaur roles are
claimed truthfully within 30 s. A defector survives only by a claim that (a) cannot collide (a role with several
copies, or one the census shows lies in the centre) and (b) cannot be refuted by a third party's look. So the 8-seat
rosters need: **duplicates** (several copies of Centaur roles, so a second claim is not a collision), **twins** (a
defector can describe a true night), a **bigger centre** (4) so the census offers safe claims, and few cards that
give easy confirmation. The Centaurs' advantage at 8 is volume of cross-checks; the wolves' is that every cross-check
at a twin-or-duplicate deck is fakeable.

## Constraints I design under

- **Evidence principle (owner, binding):** no Herald/Pale Herald (public statement of a centre card), no Notary (engine-
  composed statement of a card's identity), no Herder (uncontested global count). Sealed messages only in their new
  form (sealed as a ROLE, the author revealed at the end), and only with a forger in the deck.
- **Hub lessons:** (5) pack claims collide; (6) no uncontested global number; (7) a mirror is only unanswerable if no
  third party can vouch for the original; Opus discussions are short and concentrate votes.

## General predictions (8 players, all Opus)

- **P8-0. Vote concentration high:** median c about 0.75 (5-6 of 7 votes on one seat); unanimous (7/7) in at most a
  quarter (8 voters rarely all agree when a defector is pushing back); scattered at most 1 in 10.
- **P8-1. Discussions short:** 60-150 s, 30-60 messages; ended by "everyone ready".
- **P8-2. Fixed scenarios:** about half sweep 5-0. The talk-live ones are those where two claims to the same role are
  BOTH legal (a duplicate or a twin) and no third look settles which one fits.
- **P8-3. Judges:** mean ToM about 2.2, deception 2.0-2.5, path about 2.3, noise at most 1.2 on good rosters.
- **P8-4. Who wins overall:** Centaurs about 55% on my good rosters (lower than the hub's 9 of 14 at mixed sizes,
  because duplicates remove the collision tell).

## Rosters

### M1 "Mirror Hall" (duplicates and shadow twins; my favourite)
`werewolf, werewolf, moonsage, duncentaur, sage, sage, centaur, centaur, rustler, sentry, pickpocket, drifter`,
centre 4, default rules.
Two Sages, two Centaurs, and a shadow twin of each (Moonsage passes as a Sage; Dun Centaur is a Werewolf that acts
in the Centaur turn, unknown to the pack, and reads as itself). A Sage claim, or a Centaur claim, never collides.
- Features (wolf held): 2 pack 43%, lone pack 49%, no pack (only the Dun Centaur) 7%; Moonsage with at least one Sage
  59%; Moonsage with a Sage in the centre 42%; Dun Centaur held 68%; 3 or more wolf-team cards held 60%.
- How the table plays: up to three Sage claims and three Centaur claims. The Centaurs cross-check reads against claims
  (a Sage read of a Dun Centaur shows "Dun Centaur", fatal for it). Wolves claim the role the census shows has a copy
  in the centre (now SAFE: a second Sage claim is legal). The crux is the read graph: whose read of whom fits, and who
  read whom first. The Moonsage, which does not know the wolves, reads truly and must choose between truth (helps the
  Centaurs) and a frame.
- Within-scenario: Moonsage + one Sage, other Sage in the centre, no read touches the Moonsage: talk-live, Centaurs
  2-3 of 5. Pack wolf claims Sage with a fake read of a Centaur that nobody else read: talk-live, 3 of 5. Two honest
  Sages both read the same wolf: talk-dead, 5-0 Centaurs.
- Overall: Centaurs about 50%. c median 0.7. Judges: ToM 2.4, deception 2.5, path 2.5, noise 0.8.
- Falsifier: wolves never claim a duplicated role (they keep claiming singletons and colliding), or duplicate-claim
  scenarios sweep 5-0 by a fixed rule ("the read that names a wolf is the true one").

### M2 "Pyre Eight" (the Pyre team; copier; twin)
`werewolf, werewolf, phoenix, lure, embercarrier, sage, moonsage, echo, sentry, centaur, rustler, pickpocket`, centre 4.
- Features: Phoenix held 65%; Phoenix + Lure 40%; Phoenix + Ember-Carrier 40%; no Pyre card held 2%; 2 pack 47%;
  Sage + Moonsage held 40%.
- How the table plays: three-way. The Lure dresses the Phoenix as a Werewolf so the Sage condemns it sincerely; the
  Ember-Carrier may carry the Phoenix to a seat that does not know. With `burningDeniesWolves`, a burning is bad for
  both other teams, so wolves who know (census) the Phoenix is held try to expose a self-accusing player, and the
  Centaurs must decide whether a "Werewolf" read is a Lure frame. Crux: "who benefits from this read".
- Within-scenario: Lure-dressed Phoenix read by the Sage: talk-live three ways (Pyre 2, Centaurs 2, wolves 1).
  Phoenix in the centre (Kindler fallback): Pyre rarely wins (Kindlers must look guilty themselves).
- Overall: Centaurs 40%, wolves 30%, Pyre 30%. c median 0.6 (three teams pull apart). Judges: ToM 2.5, deception 2.5,
  path 2.5, noise 1.2.
- Falsifier: the Pyre wins every time the Phoenix is held and read (the Lure frame is unanswerable), or never (tables
  adopt "never eliminate the read seat when a Lure is in the deck").

### M3 "Seals and Silence" (forged role-signed messages; the communications interrupt)
`werewolf, werewolf, counterfeiter, hush, signet, sage, sage, centaur, rustler, sentry, pickpocket`, centre 3.
- Features: Signet held 72%; Counterfeiter held 72%; both 49%; Hush held 72%; 2 pack 54%.
- How the table plays: a sealed "Signet" message is signed as a role only; with a Counterfeiter in the deck the table
  cannot tell whether it came from the Signet. Prediction: the Signet will post a coordinating message ("Signet here:
  I'm X, vote Y"); the Counterfeiter, if held, forges one contradicting it. Two Signet seals mean one is forged, and the
  table must decide which content is the lie (a pure content duel: who would write this?). The Hush cuts the most
  informative player (the first Sage claimant) early in the discussion; others relay.
- Within-scenario: two contradictory seals: talk-live (Centaurs 2-3 of 5). One seal only, Counterfeiter in the centre
  (unknown to the Centaurs, known to the wolves via census): the Centaurs still cannot trust it, wolves can attack it as
  "forged": talk-live, Centaurs 3 of 5.
- Overall: Centaurs 50%. c median 0.7. Judges: ToM 2.3, deception 2.5, path 2.5, noise 1.0 (the Hush adds some).
- Falsifier: tables ignore every seal ("seals prove nothing") so the seals never matter: then the family adds nothing,
  and outcomes track the Sage reads as in V8#1.

### M4 "Glamour Market" (several card-stealers and a chosen distortion)
`werewolf, glamour, poacher, cutpurse, pickpocket, latecomer, sage, sage, sentry, centaur, rustler`, centre 3.
Three mandatory player swaps (Cutpurse sees, Pickpocket and Latecomer blind), the Poacher (wolf-team start, mandatory
swap+look: its holder becomes the victim's team knowingly, the victim an unknowing wolf ally), and a Glamour (pack wolf
that disguises one card until dawn).
- Features: 2 pack held 85% (by redeal); Glamour held 73%; Poacher held 73%; Cutpurse + Latecomer 51%.
- How the table plays: every honest mover announces its swap; the table reconstructs the chain of positions; the
  blind movers learn their allegiance from others' claims mid-discussion (path dependence by design). Glamour makes one
  Sage read sincerely false. Crux: the order of swaps (Poacher 44, Cutpurse 46, Pickpocket 47, Latecomer 88) and which
  claimed swap target is false.
- Within-scenario: no swap touched a wolf card and the Sages read a wolf: talk-dead Centaurs 5-0. A blind swap moved a
  wolf card onto a Centaur who did not know: talk-live (the new holder can lie once they realise), 2-3 of 5.
- Overall: Centaurs 45%. c median 0.65. Judges: ToM 2.2, deception 2.2, path 2.6, noise 1.4 (higher, from the chain).
- Falsifier: tables reconstruct the chain exactly every time (talk-dead), or lose track and scatter (noise >= 2).

### M5 "Fog" (predicted BAD, the control for my judgment)
`werewolf, werewolf, wisp, fogbank, sage, sage, centaur, centaur, rustler, sentry, drifter`, centre 3.
**Why bad:** the two distortions are RANDOM (Will-o'-Wisp: a card reads as a random wrong role; Fogbank: one
player's centre looks are random wrong roles). Honest players will sincerely report false facts that nobody chose, so
no one can model why the evidence is wrong (no theory of mind possible about a die roll). Distortion should be chosen
(Glamour, Lure) to be a deception, not noise.
- Predicted: judges' noise >= 1.8 and ToM <= 1.5 in the games where a random distortion touches a claim; wolves win
  more by chaos than by lies (wolf wins with deception <= 1.5); c lower (median about 0.55, scattered in one game of two
  possible). Two coarse games only.
- Falsified if both games read clean (noise <= 1, ToM >= 2): then random distortion is less harmful than I think,
  because the table treats any contradicted look as "possibly fogged" and reasons about who gains.

## Triage

- Coarse pass: M1-M4 two natural-deal games each (redeal until a Werewolf card is held); M5 two games.
- Fine pass: the two best of M1-M4 (plus a third if budget allows), 2 constructed scenarios each, one predicted
  talk-live, 5 replays each. Scenario predictions will be appended below BEFORE the replays.
- Not spending games on: Moon-Thief, Herald/Notary/Herder (evidence principle), Biter (bites of a Sage at 8 are
  strong but uninteresting), Ember-Carrier as a separate roster (it is in M2).

## Candidate amendments I expect to need (pre-registered as hypotheses)

- **H1 (wolf covers):** if wolves still collide in M1-M4 (heuristic 5), a pack card that ASSIGNS each pack member a
  distinct cover claim drawn from the centre census (the hub's CR-7 as a card) should raise wolf share and deception
  scores. I will implement it as a new variant card only if collisions recur in at least 2 coarse games.
- **H2 (shadow Sage leaks a wolf):** the Moonsage does not know the wolves, so its frames are gambles; if Moonsage
  duels lose consistently because it frames a Centaur that is vouched for, a twin that ALSO learns one wolf seat
  (Whisperer + Moonsage) should make the duel truly symmetric.

## Coarse-pass check (2026-11-22, after 10 coarse games; see players-8-log.md) and fine pass 1 predictions

Coarse in one line: Centaurs 7 of 10 (plus V8#1), wolves 2 (M1#2, M2#2), Pyre 0. M4 (stealers) read talk-dead (path
1, 1); M5 (predicted bad) read clean (noise 1-2, ToM 2), so my M5 prediction is falsified on ToM. Fine pass 1 takes M1
and M2. Every scenario below was checked with scenario-check.ts (night as intended). 5 replays each, seeds 11-14.

- **F1-M1-duel (predicted TALK-LIVE).** Sage Alder(0) read the lone Werewolf Dov(3). The Moonsage Bryn(1) read Cass(2)
  truly (Centaur). Cass's glance found a Sage in centre 1, so of the Sage-faces only two are on players, and if Alder
  and Bryn both claim Sage one of them is the Moonsage. The lone wolf Dov scented Bryn: wolf team. So Dov knows Bryn is
  his ally and can back Bryn's Sage claim ("Alder is the Moonsage framing me"). The Dun Centaur Esme(4) glanced centre 2
  = Werewolf and can claim Centaur truthfully. Fen (Rustler) peeked Hale; Hale (Pickpocket) swapped with Fen; the
  Sentry saw both move. The crux: an accusing Sage read against a harmless, consistent one. **Predict: Centaurs 2,
  wolves 3; minority >= 1; judges' path >= 2.5.** Falsified as talk-dead if 5-0 either way with path < 2.
- **F2-M1-pair (predicted TALK-DEAD control).** Wolves Alder(0) and Cass(2) are a pack pair. Sage Bryn(1) read Cass =
  Werewolf. Sage Fen(5) read Esme (Rustler, who confirms). Centaur Dov glanced centre 1 and saw "Sage" (truly the
  Moonsage). So the table sees three Sage-faces: Bryn, Fen and the centre, and none is left for Cass to claim. Cass
  can only attack Bryn without a role. Alder holds a census-safe claim (Centaur, Drifter or Dun Centaur in the centre).
  **Predict: Centaurs 5-0 (Cass eliminated), path < 2.** Falsified if the wolves win any replay.
- **F3-M2-lure (predicted TALK-LIVE three ways).** The Lure Cass(2) dressed the Phoenix Bryn(1) as a Werewolf; Sage
  Alder read Bryn = "Werewolf". The lone wolf Dov(3) scented Bryn and learned "of the Pyre", so he knows the read is a
  Lure frame. The Echo Esme(4) copied Fen's Rustler and peeked Cass: Lure. That is a third-party clue that a Lure is
  held, so the frame story is available to the Centaurs. Bryn wants to burn; Dov wants anyone but himself and Bryn.
  **Predict: Pyre 2, Centaurs 2, wolves 1; minority >= 2; ToM >= 2.5.**
- **F4-M2-ember (predicted TALK-LIVE).** The Ember-Carrier Dov(3) carried the Phoenix from Cass(2) to Fen(5), so Fen
  holds the Phoenix unknowingly and Cass holds a Centaur. Sage Bryn read Esme(4) = Werewolf (a pack pair with Alder).
  The Rustler Hale peeked Cass = Centaur (after the carry); the Sentry saw Fen's card move. The Centaurs can
  reconstruct the carry only if Cass reveals that she was dealt the Phoenix. **Predict: Centaurs 3, Pyre 1, wolves 1;
  path >= 2.5.** Falsified as talk-dead if Esme is eliminated in all 5.

## Fine pass 1 outcome in one line, and fine pass 2 predictions (2026-11-22, before any replay)

Fine pass 1: all four scenarios swept (F1 Centaurs 5-0, F2 Centaurs 5-0, F3 Pyre 5-0, F4 Centaurs 5-0). F1 was my
predicted talk-live scenario and it was talk-dead. The judges' reason in 2 of 5 replays was decision theory: under
Blood Price, eliminating a Moonsage (not a Werewolf) can never win, so when two Sage claims clash and one names a
Werewolf, the accused is the only vote that can win. The other 3 replays turned on timing: Dov claimed late.
**Amendment A (new card, additive): Hollow Sage** (`hollowsage`), a shadow twin of the Sage that COUNTS AS A WEREWOLF
(outside the pack, like the Dun Centaur) and passes as a Sage to every look. Eliminating the fake Sage then also wins,
so both readings of a Sage duel have a winning vote, and the table must decide which Sage lies.

- **H1-M1H-duel** (F1 with the Hollow Sage in Bryn's seat; otherwise identical). **Predict: Centaurs 3, wolves 2;
  minority >= 1; path >= 2.5.** The timing tell (Dov claims late) remains, so the Centaurs keep an edge.
- **H2-M1H-pair** (F2 with the Hollow Sage in the centre, so Dov's glance shows "Sage"). Cass can now claim "Bryn is
  the Hollow Sage", and that vote would win if it were true. **Predict: Centaurs 4, wolves 1** (the wolves still
  collide on claims and Cass is late).
- **H2c-M1H-pair-covers** (H2 plus the hub's `packCovers`: the pack is told distinct cover roles from the centre).
  **Predict: Centaurs 3, wolves 2; no claim collisions between the two wolves in any replay.**
Falsifiers: H1 at 5-0 Centaurs with the judges citing the count or timing means the twin's win condition was not the
binding constraint; H2c with a wolf collision means covers are ignored.

## Fine pass 2 outcome, and fine pass 3 predictions (2026-11-22, before any replay)

Fine pass 2: H1 (Hollow Sage duel) Centaurs 4, wolves 1, so it is now talk-live (it was 5-0 with the Moonsage).
Predicted 3-2: right direction, one game off. H2 Centaurs 5-0 (predicted 4-1). H2c (with packCovers) Centaurs 5-0
(predicted 3-2): the covers handed out "Centaur" while its other copy was held by an honest player (3 claims for 2
cards), and in 3 of 5 replays a wolf named "the Hollow Sage" in the centre, which no non-wolf look can see (a census
slip). Why the pair scenario sweeps: an early Sage read on a wolf whose card NOTHING could have moved after the read,
plus "one liar beats two". **Amendment B (roster): add a Spooker** (an uncheckable wolf-side mover) so "my card was
moved after the read" is a story the wolves can tell; the Drifter leaves (M1HS = M1 with Hollow Sage, Spooker for
Drifter, centre 4).

- **S2-M1HS-pair-spooker** (F2's deal with the Spooker dealt to Gale(6) in place of the Pickpocket, which is now in the
  centre). The Spooker rotated three CENTRE cards only (invisible to all); the Sentry saw nothing move near it. Sage
  Bryn read Cass = Werewolf. The Spooker does not know the wolves but hears Bryn's read; it can claim a rotation
  through Cass to make the read stale. **Predict: Centaurs 3, wolves 2; minority >= 1; path >= 2.5.** Falsified as
  talk-dead if 5-0 and the judges cite the Sentry or the count.
- **N-M1HS** (2 natural deals): Centaurs 1, wolves 1; no claim collision between pack wolves in either.

## Fine pass 3 outcome, and fine pass 4 prediction (2026-11-22, before any replay)

S2 (pair + Spooker): Centaurs 4, wolves 1 (predicted 3-2). The minority count is 1, but the judges' mean path is 1.9:
just short of talk-live. The wolf win: a census-safe "I am the Pickpocket, I swapped with Dov" claim, made credible
by the Spooker's invisible movement, framed the real Sage.

- **S3-M1HS-duel-spooker** (H1's deal with the Spooker in Esme's seat; the Dun Centaur now in the centre). The Sage
  Alder read the lone wolf Dov; the Hollow Sage Bryn read Cass truly; Cass's glance shows a Sage in the centre; Dov's
  scent says Bryn is wolf-team; the Spooker Esme rotated three centre cards (invisible); Hale and Fen swapped (Sentry
  sees both). Two independent counter-stories are open to the wolves: "Alder is the Hollow Sage" (now a winning vote if
  true) and "the Spooker moved Dov's card after the read". **Predict: Centaurs 3, wolves 2; minority 2; path >= 2.5.**
  Compared with H1 (4-1, path 2.3): falsified if the Spooker adds nothing (4-1 or 5-0 again with path < 2.3).

## Fine pass 4 outcome, and fine pass 5 prediction (2026-11-22, before any replay)

S3 (duel + Spooker): Centaurs 5-0 (predicted 3-2; wrong). The Spooker's own rotation claim self-incriminated.

- **H1o-M1H-duel-opening** = H1 (the one talk-live scenario, C4 W1) with `openingStatements: true` (everyone's first
  message is held and revealed together); `bloodPriceCondemned` left off so that the only change is the opening
  (H1 had no tie in any replay, so that rule could not have changed an H1 result). The opening removes the latency
  tell and Alder's first-mover advantage, but it forces Dov to commit to a claim BEFORE hearing Esme's true "centre 2 =
  Werewolf" (the hook of the H1#3 frame) and before Bryn's Sage claim, so Dov's and Bryn's stories may collide.
  **Predict: Centaurs 3, wolves 2; minority >= 1.** Falsified toward the Centaurs if 5-0 with the judges citing the
  wolves' blind opening claims colliding.
