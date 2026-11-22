# Balance research: summary for the owner

DRAFT 1 (13:15 UTC). Refreshed at 16:30 and 18:30 UTC with the per-count sessions' final files. Machine-readable
companion: [overnight-summary.json](overnight-summary.json) (built by `npx tsx sim/research/overnight.ts` from
`docs/research/results/*.json`). Method and measures: [charter.md](charter.md). Full record: [log.md](log.md).

## How to read the numbers

- Every game is all-Opus (medium effort), one isolated AI per seat, on the current rules. Nothing here comes from
  random play.
- **Fixed scenario**: the same deal, the same night seed and the same night decisions, replayed 5 times (3 for
  controls) with fresh players; only the discussion can differ. A scenario is **talk-live** when at least one replay
  ends with a different winner AND the two neutral judges score path dependence >= 2. "Swept by argument" means one
  side won every replay although the judges say the talk mattered (a reliable winning argument).
- Judges: two independent AI evaluators per game, seeing only the public transcript and the post-game truth. Scales:
  ToM 0-3 (0 none, 1 mechanical deduction, 2 modelling what others would claim, 3 modelling what others believe about
  one's own claims); deception 0-4; path dependence 0-4; noise 0-4 (lower is better). They agreed within about 0.3
  points per scale on average and on the "how won" category in about four games of five.
- **Vote concentration** c = votes on the most-voted seat / (players - 1). Target band 0.6 <= c < 1.
- **Sample sizes are small**: 5 replays of a scenario are reported as counts ("3-2"), never as rates. A roster's
  verdict rests on 1-3 scenarios. Results before 13:00 UTC predate the opening-statement option (see artefacts);
  they were played with free-for-all opening messages, where Centaurs speak first.

## Top rosters (provisional; ranked on the primary target: talk-live fixed scenarios, then ToM, then consensus)

### 1. "Pyre seven" (7 players, 3 centre, default rules) — from the 7-player session
Deck: werewolf, werewolf, phoenix, lure, embercarrier, sage, rustler, sentry, centaur, pickpocket.
- Games: 2 natural-deal + 1 fixed scenario x 5 replays. Wins in the fixed scenario: **Pyre 2, wolves 2, Centaurs 1**
  (the only scenario of the night where all three teams won). Coarse: Pyre 1, Centaurs 1.
- Fixed scenario talk-live; judges (10 verdicts) ToM 2.7, deception 3.1, path 3.3, noise 1.5; c 0.67 .67 .5 .5 .83.
- Why it works: the Ember-Carrier (now a blind NIGHT swap) carries the Lure-dressed Phoenix to a player who does not
  know it; the honest Sage sincerely reads "Werewolf" on him; the lone wolf, who scented him as Pyre, must stop the
  burning without revealing his scent. Every side has a credible story and a private reason to distrust the others.
- Weakness: one fixed scenario only; noise at the limit (1.5); two of five votes at c = 0.5 (three agendas split the
  vote). Unknown: how it plays when the Phoenix is in the centre.

### 2. "Pyre six" (6 players, 3 centre) — hub D6 and the 6-player session's PY6
Deck (D6): werewolf, werewolf, phoenix, lure, sage, rustler, sentry, centaur, herder.
- Hub: 2 coarse + 3 fixed scenarios x 5 = 17 games. Fixed: Centaurs 4 (+2 with a side burning), Pyre 9 of 15.
  All three fixed scenarios talk-live; judges ToM 2.7, deception 3.0, path 3.3, noise 1.2; c in band in 14 of 17.
- The richest talk of the night (judges' highest scores): an honest Sage sincerely condemns a Lure-dressed Phoenix;
  the one real wolf knows the read is false but cannot say how it knows; the Centaurs win by motive analysis, the
  Pyre by a "reverse bluff" (the Phoenix fights the votes so that it looks like the wolf).
- Weakness: **the Pyre is too strong when the Lure dresses the Phoenix** (S9: Pyre 4 of 5; with opening statements
  Pyre 4 of 5), and the wolves are nearly spectators (the 6-player session: 1 wolf win in 18 replays). A fix is under
  test now (`lureSparesPhoenix`, below). With the fix this is my candidate for the best 6-player roster.

### 3. (provisional) "Shadow Court" K7 (7 players) or the 5-player Spooker roster
To be decided at 16:30 when the 5-, 6- and 8-player sessions' result files are in. Current evidence:
- **K7** (7-player session; twins duel): fixed scenario Centaurs 4, wolves 1; talk-live; ToM 2.4, path 3.4, c in band
  6 of 7.
- **A5 "Spooker" (5 players, 3 centre)**: werewolf, werewolf, spooker, sage, rustler, farrier, sentry, centaur.
  3 fixed scenarios x 5, all talk-live: wolves 10, Centaurs 5. Judges deception 3.1, path 3.2, but ToM 1.9 and noise
  1.5: the Centaurs' wins were mostly the wolf side's lies colliding, not Centaur insight. Wolf-favoured.

## Interesting games (more per roster at the refresh)

**D6, S5#5 (Centaurs win by motive analysis).** Dealt: Sage, Phoenix, Werewolf, Lure, Herder, Sentry. Night: the Lure
dressed the Phoenix (Bryn) as a Werewolf; the Sage read Bryn: "Werewolf"; the Herder counted one wolf in the centre.
Crux: the Lure claimed Rustler to "corroborate" the read; the real wolf (Cass) and the Phoenix both claimed Centaur.
The table was heading for Bryn (a burning) when the Herder asked who benefits: *"If Bryn were a real wolf, why would a
non-wolf Dov need to lie? That's the Lure propping up a Phoenix it dressed as Werewolf... the one wolf is Cass."*
Alder: *"Esme convinced me."* Vote 4-1 on Cass; Centaurs win.

**D6, S9#5 (Pyre wins by reverse bluff).** Night: the Lure dressed the Phoenix (Cass) as a Werewolf; the honest Rustler
saw "Werewolf" on Cass; the Sage truly read the wolf Esme. Crux: the Lure claimed to have seen "the Lure in the
centre" ("nobody dressed anything tonight"); Cass denied being the Phoenix: *"I'm NOT the Phoenix — a Phoenix would
just take the wolf read and smile, not fight it."* The two real wolves told the truth (Cass is a dressed Phoenix) but,
as rival claimants, had no credibility. The Sage abandoned his own true read: *"We crossed messages. FINAL: Cass."*
Cass burned; the Pyre won.

**A5, S2#1 (wolves win by framing their own ally).** The lone wolf learned from the census that the Sage was in the
centre, so a Sage claim could never be contested, and from its scent that Dov was wolf-team (the Spooker). It claimed:
*"I'm the Sage. I looked at Dov's card and it was a Werewolf."* The Sentry truthfully confirmed Dov's card had not
moved; Dov's late Rustler claim looked guilty; 4-1 on Dov. Eliminating a wolf-team non-wolf is a wolf win.

**A5, S1#2 (wolves win by a reversed rotation).** The Spooker really moved Cass->Alder->Dov and claimed the reverse:
*"I rotated Alder -> Cass -> Dov -> Alder... whatever Cass was dealt is now with Dov."* A dealt wolf believed it,
thought her wolf card had left her, and "confessed" to point at Dov, who in fact held the Sage. Four votes on Dov.

**B5, S3#2 (a sweep decided by a second-order argument).** Four players were about to eliminate the real Sage when it
said: *"No wolf would claim Sage into a guaranteed counterclaim when Sentry is a safe unclaimed role... Bryn claimed
CENTAUR — a role his census told him nobody holds."* The swing voter: *"Alder's census point is real and I can't answer
it."* The Centaurs won all 5 replays this way.

## Strategies observed (hub games: 76 tagged by a neutral AI tagger; per-count sessions' tables at the refresh)

| Strategy (team that used it) | Games used | That team won | Marked decisive |
| --- | --- | --- | --- |
| Census-safe claim of a centre role (wolves) | 75 | 19 | 10 |
| Motive analysis: who benefits from a lie (Centaurs) | 62 | 37 | 18 |
| Claim-count collision exposes a liar (Centaurs) | 61 | 39 | 21 |
| Claim-timing tell: late or hedged claim read as guilt (Centaurs) | 59 | 37 | 15 |
| Corroboration chain of honest results (Centaurs) | 56 | 31 | 16 |
| Census backward induction: "a wolf would never claim X" (Centaurs) | 48 | 33 | 18 |
| Fake read of a player (wolves) | 33 | 13 | 13 |
| Counter-claim of an information role (wolves) | 30 | 4 | 4 |
| Two wolf-side players' stories collide (wolves) | 24 | 4 | 5 |
| False movement story, e.g. a rotation's direction (wolves) | 19 | 9 | 13 |
| Fake read (Pyre) | 19 | 9 | 7 |
| Phoenix baiting: a Pyre player presented as a wolf (Pyre) | 17 | 11 | 11 |
| Frame an ally whose elimination wins (Pyre / wolves) | 11 / 6 | 7 / 4 | 8 / 4 |
| Fake confession (wolves / Pyre) | 11 / 6 | 2 / 3 | 2 / 3 |
| Re-target the swapper rather than the read wolf (Centaurs) | 3 | 3 | 3 |

Reading: the defectors' most effective tools are the ones that cannot be checked mechanically (a false movement story:
decisive in 13 of 19 uses; framing an ally; Phoenix baiting). Counter-claiming an information role almost never works
(won 4 of 30). The Centaurs' most decisive tools are claim counting and the census backward induction.

## What we learned about balance

1. **Talk decides when a claim is credible but unverifiable.** Every talk-live scenario contained one: a twin, a
   blind mover's direction, a dressed card read sincerely, a wolf-team decoy. Scenarios without one are decided by
   first-order deduction.
2. **Information handed to liars becomes a tell** (the design principle in log.md). The Den Census was meant to help
   the wolves lie; because the rules are common knowledge, the Centaurs run the wolf's decision backwards ("a wolf
   would never claim Sage"). It decided a 5-player duel 15 times out of 15 under three variants (full census, partial
   census, simultaneous claims). Prefer mechanics where the defector's safe option is not computable by the table.
3. **The defectors' main weakness is coordination, not information.** Two pack members choosing claims independently
   collide (24 games); a wolf-side mover's lie can convince its own wolf that its card moved, and that wolf confesses
   and names its partner (the 7-player session: 5 of 5 replays of one scenario).
4. **Wolf-team non-wolves are decoys**: eliminating a Spooker or Moonsage is a wolf win, so a wolf frames its own ally.
5. **Under Blood Price, a side that can force a tie with its own votes wins by arithmetic** (the parity bloc; fixed by
   `bloodPriceCondemned`, below).
6. **When a team cannot win it becomes a kingmaker**: doomed wolves voted the Phoenix to deny the Centaurs.
7. **Simultaneous commitment changes who is favoured**: opening statements helped whoever has a fixed plan at dawn
   (Pyre, framers) and hurt whoever wins by reacting.
8. **Falsified predictions** (as useful as the confirmed ones): the Moon-Thief's after-talk swap was NOT degenerate
   (the table re-targeted the Thief: Centaurs 3-0); a partial census and opening statements did NOT break the census
   sweep; the Pyre was weaker than predicted without opening statements and stronger with them; many honest movers make
   the night MORE deducible, not noisier (5-, 6- and 7-player sessions). **The owner's Ember-Carrier prediction (the
   vote-lock swap makes the Pyre always win) was never tested**: the card was redesigned as a night swap on calibration
   grounds before any game. Its structural twin, the Moon-Thief, was answerable by talk because eliminating the Thief
   itself wins for the Centaurs; eliminating an Ember-Carrier (not a Werewolf) would not, so the owner's prediction
   very likely held for the old card.

## Artefacts found and fixed

- **Timing**: AI liars take longer to compose their first claim (median 7.1 s vs 2.7 s for honest players), and tables
  read late claims as guilt (the "claim-timing tell" in 59 of 76 games). Built the `openingStatements` option (first
  messages held and revealed together in seat order). Later messages show no real asymmetry (5.3 vs 5.9 s).
- **Gleaner leak**: before 13:00 UTC an AI Gleaner's planning view listed the roles actually dealt to the centre.
  Fixed; copier results before the fix (the 5-player copier roster) are contaminated.
- **Hush harness**: a cut AI player never came back (the headless client dropped the server after the 503); fixed in the
  harness by the 7-player session.
- **Parity bloc**: see rule changes.

## Proposed rule and default changes (for the owner)

1. **`bloodPriceCondemned` ON by default at 6 and 8 players** (and probably everywhere): a Centaur eliminated only by
   Werewolf-team votes does not count in the Blood Price. Parity scenario: wolves 3-0 (degenerate) without it, Centaurs
   4-1 (talk-live) with it; the free hedge stays dead. Not changed tonight to keep the sessions' runs comparable.
2. **Deck composition**: keep wolf-team cards in hands below half the table (at 6 players at most 3 wolf-team cards of
   9), or include a third team.
3. **Herder only with a Stray Herder** (CR-6): an uncontestable count proved the wolf in about two thirds of Centaur
   wins. Pre-registered, held until the sessions finish.
4. **`openingStatements` as an option, not a default**: it removes a measured harness artefact in the first message,
   but it rewards whoever has a fixed plan at dawn.
5. **Lure may not dress the Phoenix** (`lureSparesPhoenix`): result at the refresh.
6. **Den Census**: under test (census off on the 5-player duel); result at the refresh.

## What is not yet known

- Every roster verdict rests on 1-3 fixed scenarios; the top rosters need 2-3 more scenarios each (including deals
  where the Phoenix is in the centre and where two wolves are held).
- Whether the results hold with human players (talk speed, patience, the timing tell).
- 8 players: all four fixed scenarios swept (8-player session); no 8-player roster is recommendable yet.
