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
