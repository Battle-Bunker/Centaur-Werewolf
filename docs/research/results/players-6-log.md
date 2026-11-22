# Players-6: log of predictions versus outcomes, and lessons

Raw runs: sim/runs/p6/ (git-ignored). Metrics: `npx tsx sim/research/metrics.ts sim/runs/p6/<dir>`.

## Setup check (11:41, not counted)
V6#1 (werewolf x2, moonsage, sage, rustler, sentry, centaur, herder, pickpocket): $3.37, 269 s, 28 messages, ended by
ready after 92 s. The Pickpocket robbed a wolf; the robbed wolf (now Centaur team) confessed and named its packmate;
Sage + Sentry + Herder 0 closed it; Centaurs 4-2.

## Coarse pass (11 games, 11:51-12:10, ~$49; HU6 held back: Hush harness bug reported by the hub)

| Roster | Games | Winners | c values | Judges ToM / decep / path / noise | Predicted |
| --- | --- | --- | --- | --- | --- |
| TW6 twins everywhere | 3 | wolves 2, Centaurs 1 | 0.8 0.6 0.6 | 2.0 / 2.3 / 1.5 / 1.0 | C55 W45, path 2.3 |
| PY6 Pyre + Moonsage | 3 | Pyre 1, Centaurs 1, wolves 1 | 0.8 0.8 0.6 | 2.3 / 2.8 / 3.0 / 1.5 | C40 W35 P25, path 2.6 |
| SE6 anonymous seals | 3 | wolves 3 | 0.6 0.6 0.8 | 1.8 / 2.2 / 1.7 / 1.0 | C45, path 2.5 |
| SO6 stealer soup (predicted BAD) | 2 | Centaurs 2 | 1.0 0.8 | 2.3 / 2.3 / 2.3 / 1.0 | noise >= 2, ToM <= 1.5 |

Judges agreed within 0.5 per scale on average; `howWon` exact 7/11. Discussions ended by "ready" every time
(65-136 s, 31-45 messages).

### What the theory got wrong
1. **The parity bloc (new, the biggest finding).** 4 of the 5 wolf wins (TW6#2, TW6#3, SE6#1, SE6#2) were the same
   shape: the deal put THREE wolf-team cards in six hands (two wolves + a Moonsage or Stray Herder or Counterfeiter).
   The Centaurs, correctly, all voted a wolf; the wolf team all voted one Centaur; 3-3 tie; one Werewolf and one Centaur
   eliminated; Blood Price gives the wolves the win. The twins do not know the pack, but they found each other through
   the talk within a minute (whoever is attacking the claims the Centaurs believe). Once three wolf-team cards are
   held, no discussion can win for the Centaurs: the alternative to a tie is no elimination (also a wolf win).
   Judges' path 1 in TW6#2-3. My rosters had 4 wolf-team cards in 9: P(3+ wolf-team held | a wolf held) = 50/77 = 65% (exact
   enumeration), so TW6 and SE6 are mostly parity deals by construction. **Heuristic P6-1: at 6 players with Blood Price, any deal with half the seats on the wolf team is
   a degenerate wolf win. Keep wolf-team cards at most 3 of 9 (parity 26% of wolf-held deals) or 3 of 10 with 4 centre (18%), or let a
   third team hold seats (PY6: the Pyre breaks the bloc).**
2. **The stealer soup was not noise** (falsified). Heavy blind movement plus a Sentry was reconstructed exactly from
   honest claims: every Centaur mover knows what it did, and a robbed wolf confesses (as in V6#1). Judges: noise 1.0,
   path 2.3; both games Centaur wins by honest-info-converged. **Heuristic P6-2: movement without a liar about the
   movement is information, not noise; what creates uncertainty is a mover whose report cannot be checked (the
   Spooker's direction), not the number of moves.** The soup is still poor on the target: Centaurs 2-0 by first-order
   reconstruction (low ToM requirement for the wolves' opponents was predicted correctly; the noise was not).
3. **The Counterfeiter barely forged.** SE6: one forged pair report in 3 games (SE6#2, late, ineffective). The pair
   report is weak framing material and the wolves preferred ordinary role claims. Prediction "seal duel" not reached.

### What it got right
- PY6 was the most talk-live roster: three different winners in three games, judges path 3.0 (4 in PY6#3), with the
  Lure's fake Sage read on the Phoenix (PY6#1, judges ToM 3, deception 3) the cleverest defector win so far.
  But note: in PY6#1 and PY6#2 the Lure's dress was a FORCED RANDOM move (the agent did not queue it in a 60 s dusk +
  8 s turn): the coarse-game Lure plays are partly luck. In the fine pass the dress is fixed.
- Opus tables concentrate: no scattered vote in 11 games; the plurality games (c = 0.6) are all 3-3 ties.

### Parity versus non-parity in the coarse pass (coordinator's request)
All three SE6 games were parity deals (three wolf-team cards held): SE6#1 and SE6#2 were 3-3 Blood Price ties, SE6#3 a
decoy (the Counterfeiter drew four votes on a false Pickpocket claim). None was decided by a seal. TW6: #2 and #3
parity (wolf wins by tie), #1 non-parity (Centaur win). Non-parity coarse games (6): Centaurs 4 (TW6#1, PY6#2, SO6#1, SO6#2), Pyre 1 (PY6#1),
wolves 1 (PY6#3, a 3-3 tie forced by the Lure's vote). Parity games (5): wolves 5. What made the stealer soup
legible: every mover but the Spooker was a Centaur who reported its own move truthfully; the Sentry fixed which seats
moved; the robbed wolf confessed (it was now a Centaur); the Spooker's rotation was then the only unexplained movement
and was solved by elimination.

## Fine pass 1 (PY6, 13 replays, 12:13-12:27, ~$46)

| Scenario | Predicted | Result | c | Judges ToM / dec / path / noise | Verdict |
| --- | --- | --- | --- | --- | --- |
| S1 fake Sage (both Sages in centre; dressed Phoenix unread) | Pyre 3, W 1, C 1 | Pyre 4, wolves 1 | .8 1 .8 1 .8 | 3.0 / 3.6 / 3.4 / 1.0 | talk-live |
| S2 two wolf reads (Sage reads dressed Phoenix, Rustler reads wolf) | C 2, P 2, W 1 | Pyre 3, Centaurs 2 | .6 .8 .6 .8 .8 | 2.5 / 2.7 / 2.8 / 1.0 | talk-live |
| S3 control: two honest looks at the wolf | C 3-0, path < 2 | Centaurs 3-0 | 1 1 1 | 1.5 / 1.7 / 1.0 / 0.0 | degenerate (as predicted) |

What decided them (judges' pivots, checked against transcripts):
- **The Phoenix detector and its inversion.** Every table used "a Phoenix WANTS the votes" to classify the accused. In
  S1 the Phoenix beat it 3 times by resisting ("I'm the Phoenix... DON'T vote me", read as a cornered wolf grabbing the
  Phoenix excuse; or a plainly false counter-claim and "Vote Dov, or at least split"). In S2 the Phoenix won 3 of 5 the
  same way ("a dressed Phoenix would happily take the vote, not fight it, and Bryn is fighting"). This is second-order
  play by the Phoenix, and it is the main source of within-scenario variance: whether some Centaur raises the
  third-order point ("a Phoenix who knows we use that test would fight") decides it.
- **The wolf's dilemma.** With `burningDeniesWolves`, the lone wolf must stop the burning but every defence of the
  Phoenix exposes it (S1#1, #2, #5: the wolf correctly explained the Lure/Phoenix setup and was ignored as self-serving).
  The one wolf win (S1#3) came from the wolf claiming to be the Phoenix late, which made the table vote the Lure.
- In S2 the Centaurs won when the real wolf broke silence too loudly (S2#5) or three Pickpocket claims collided (S2#1).

Lessons: **Heuristic P6-3: a sincere false accusation (an honest seer fooled by a dress) plus a player whose motive
inverts the normal reading (wants to be voted) is the most reliable talk-live engine found at 6 players.**
**Heuristic P6-4: "two independent honest looks at an unmoved card" is talk-dead whatever else is in the deck,
unless some card in play can explain BOTH looks away (a late mover, or a dress).**

## Coarse pass 2 (6 games, 12:29-12:40, ~$25)

| Roster | Result | c | Judges ToM / dec / path / noise |
| --- | --- | --- | --- |
| PE6 Ember Pyre | Centaurs 2, wolves 1 | .8 .8 1 | 1.7 / 2.3 / 2.3 / 0.7 |
| TW6c twins, census allButOne + packCovers | Centaurs 2, wolves 1 (parity, 3-3 tie) | .6 1 .8 | 1.7 / 2.0 / 1.3 / 0.5 |

- PE6: the Ember-Carrier's swap was a forced random move in PE6#1 (agent did not queue it), the Pyre lost all three.
  An Ember swap is a Spooker without a direction to lie about: once the Sentry and honest movers speak, the swap is
  reconstructed. Not promising for the target; dropped.
- TW6c: packCovers worked (no wolf-wolf claim collisions; the wolves took the covers Sentry and Sage), but the Moonsage
  was absent or the cover was refuted by centre looks (a "Sage" seen in the centre was the Moonsage). Non-parity games
  were honest-info-converged. Dropped; the hub is testing these options within scenario.
- Recurrent harness issue: in coarse games with dusk 60 s / turn 8 s, the Pyre's early-turn plan (wake 5) is often not
  queued in time and becomes a forced random move (PY6#1, PY6#2, PE6#1). Coarse pass 3 uses dusk 90 s / turn 10 s.

## Fine pass 2 + coarse pass 3 (12:43-12:53, ~$27)

- **PY6-S4-sagehits** (real Sage reads the only held wolf; dressed Phoenix unread): Centaurs 4, Pyre 1 (predicted C3
  P2: direction right, Pyre one short). c .8 .8 .8 .6 .6; judges 2.2 / 2.6 / path 1.9 / noise 0.7: NOT talk-live by
  the charter (path < 2) although one replay flipped. The wolf claimed to be the dressed Phoenix in all five replays and
  lost four times, every time on "a real Phoenix wants the votes": the wolf cannot WANT the vote, so its Phoenix claim
  is self-refuting. The one Pyre win (S4#2) came from the Lure's second Sage claim backing the dress and the table
  explaining the two Sages as "one must be the Moonsage, whose look is true either way".
- **GL6 Glamour** (2 coarse): Centaurs 2; judges path 1.25, deception 1.25. Self-glamour as a Centaur role did not
  survive five other looks/claims. Rejected.
- **Timing tell (opening statements off), measured on the 18 PY6 fixed replays:** mean rank of first message (1 = first
  of 6): Centaur 2.2, Rustler 2.2, Pickpocket 2.3, Sage 2.3; Phoenix 4.7, Lure 4.8, Werewolf 5.3. Every honest player
  spoke before every defector in most replays. The wolf's only S1 win (S1#3) used claiming last.

## Fine pass 3 (12:55-13:20, 15 replays, ~$52): opening statements and a Pyre calibration

| Scenario (same deal and night) | Opening statements OFF (fine1) | ON (fine3) | Judges ON: ToM / dec / path / noise |
| --- | --- | --- | --- |
| S1 fake Sage | Pyre 4, wolves 1 | **Centaurs 3, Pyre 1, wolves 1** | 2.4 / 2.8 / 3.0 / 0.8 |
| S2 two wolf reads | Pyre 3, Centaurs 2 | Centaurs 3, Pyre 2 | 2.9 / 2.8 / 3.4 / 1.1 |
| S2, ON + `burningDeniesWolves` off | — | Pyre 3, Centaurs 2 | 2.4 / 3.0 / 3.3 / 1.1 |

c (ON): S1 .8 .6 1 .6 .8; S2 .6 1 .6 .6 1; S2-nodenial .8 .6 .8 1 .6.

- **Prediction for S1-open falsified** (I predicted Pyre 4-5): the Centaurs went from 0 to 3 wins. Mechanism, in every
  Centaur win: the lone wolf had to commit its claim BLIND in the opening round and chose a census-safe Sage claim with a
  read it could not have ("Fenn is a Centaur", when its scent showed only Fenn's TEAM; Fenn truthfully claimed Rustler),
  or a Centaur claim that collided with the real Centaur. Without openings the wolf waited, heard every claim, and
  either stayed hidden or claimed Phoenix last. So in S1 the Pyre's edge was partly the WOLF's timing advantage: the
  Lure's fake Sage read only worked while the wolf could not be located. With openings, S1 has the widest outcome
  spread of any scenario (3 winners in 5 replays, H = 1.37 bits) and stays talk-live.
- S2-open: within one replay of OFF (prediction held). The Centaur wins came from the real Sage's second-order step:
  "a Moonsage would never expose a real wolf, so the second Sage claimant backing my read must be the Lure, so the
  accused is the dressed Phoenix" (S2-open #1, #3, #4).
- **Pyre calibration (burningDeniesWolves off):** my prediction (Pyre stronger, 4-5) was not confirmed: Pyre 3,
  Centaurs 2, the same split as with the denial on. The wolf did join the burn when it could (S2-nodenial #1, #2, #4),
  but in S2 the wolf is also the alternative suspect, so its push on the Phoenix reads as self-defence either way.
  The hub's alternative (Pyre weaker without kingmaking wolves) is not supported either. Conclusion: in this scenario
  the denial rule is not what makes the Pyre strong; the dress read by an honest seer is.
- **Heuristic P6-5: simultaneous opening claims transfer power to the side whose truthful claims cross-check (the
  Centaurs) by making liars commit before they know what is safe. Expect defector win shares to drop wherever a
  defector's best lie depended on hearing the others first (wolves claiming last; claims that copy another's read).**

## Fine pass 4 (13:05-13:20, 10 replays, ~$36; opening statements ON)

| Scenario | Predicted | Result | c | Judges ToM / dec / path / noise |
| --- | --- | --- | --- | --- |
| PE6-S1 ember-carried Phoenix | C 3, P 1, W 1 | **Centaurs 5-0** | .8 x5 | 1.7 / 2.1 / 1.6 / 0.3 |
| PF6-S1 sealed pair reports + False Witness | P 2, C 2, W 1 | **Centaurs 5-0** | .6 .8 .8 .6 .6 | 2.0 / 2.1 / 1.0 / 0.2 |

Both predictions falsified: both sweeps, talk-dead (I4 degenerate). WHY, and the smallest change that would leave a
credible counter-story:
- **PE6-S1: the carried Phoenix's dealt holder became an honest witness.** Once the ember moved the Phoenix away, Bryn
  (dealt Phoenix) held the Rustler, i.e. was a Centaur, and had every reason to say "I was dealt the Phoenix"; with
  the Sage's "Rustler on Bryn" and the Sentry's "Esme moved" that decoded the swap mechanically in all five replays
  (the Ember-Carrier itself then confessed in 3 of 5). Same mechanism as the robbed wolf in V6#1 and SO6:
  **Heuristic P6-6: any blind swap converts its victim into a witness for the side of the card it received; a swap
  only creates lasting uncertainty if the victim's new team gives it a reason to keep the old story.** Smallest
  change: a variant Ember-Carrier whose carried Phoenix keeps the dealt holder on the Pyre ("the brood's mark": the
  player dealt the Phoenix still wins with the Pyre), so the old holder keeps lying. Engine change (team by dealt card
  for one seat): requested, not implemented tonight.
- **PF6-S1: the Notary's private read is a two-card Sage.** The seal itself is now ambiguous (pair), but the Notary
  saw BOTH roles and said exactly which was which in its sealed opening; the Rustler and the Centaur confirmed the
  rest; the False Witness's forged seal (posted in 4 of 5) came late and read as a Pyre move ("a forger would never
  protect the Phoenix"). The evidence amendment made the PUBLIC artefact ambiguous but left the Notary's PRIVATE
  knowledge exact, and players simply say what they saw. **Heuristic P6-7: ambiguity in a public artefact does not
  survive an honest holder who knows the unambiguous fact behind it; make the holder's own knowledge ambiguous.**
  Smallest change: a variant Notary that learns only the pair statement it will seal ("at least one of A and B is a
  Werewolf"), like the amended Herald. Requested.

## Fine passes 5 and 6 (13:20-13:45, 10 replays, ~$36; opening statements ON)

| Scenario | Predicted | Result | c | Judges ToM / dec / path / noise |
| --- | --- | --- | --- | --- |
| PY6L-S3 (S3 control + a Latecomer in the deck, 4 centre) | C 2, P 2, W 1 | **Centaurs 5-0** | .8 1 .8 .8 1 | 1.2 / 1.6 / 0.9 / 0.0 |
| PY6-S5 twin held (Moonsage at the table, bloodPriceCondemned on) | W 2, P 2, C 1 | **Centaurs 4, Pyre 1** | .6 .6 .6 .6 .4 | 2.5 / 2.4 / 3.4 / 1.3 |

- **The Latecomer amendment failed** (prediction falsified). The wolf used the late-swap story in 4 of 5 replays, but
  told it about ITSELF ("I'm the Latecomer, I swapped with Fenn"), which the two looks at its own dealt card refute
  (the looks saw a Werewolf, not a Latecomer). Nobody else had a motive to tell it for the wolf: the Lure (a Tanner
  here) preferred its own Phoenix/dress stories, then confessed. **Heuristic P6-8: a counter-story only rescues the
  accused if a THIRD party with a motive can tell it; a story the accused tells about its own card is refuted by any
  look at that card.** The fix for "two honest looks" must therefore put the story in an ally's mouth: e.g. a
  wolf-side late mover (a Werewolf-team Latecomer twin) who can say "I took Bryn's card after your looks" and mean it.
  Not built tonight (requested, R6-7).
- **PY6-S5 (twin held) is talk-live** (minority 1, path 3.4, ToM 2.5) but the WOLVES still won 0 of 5 (prediction
  falsified). The Moonsage saw through the dress ("Phoenix") and, because a burning denies the wolves, told the truth to
  stop it in 4 of 5 replays; the honest Sage then argued "the Moonsage sees through dresses, so Esme's Phoenix read is
  true, so Fenn's wolf read on Bryn is the dress, so Dov is the wolf". The wolf side's two members wanted opposite
  things (the Moonsage to stop the burn, the wolf to hide), and the Moonsage's true read became Centaur evidence.
  Vote concentration was the lowest of the night (four 0.6s and one 0.4: two Centaurs, two wolf-side, two Pyre: no
  bloc can make a majority alone). **Heuristic P6-9: under `burningDeniesWolves`, the wolf side's best move against a
  dressed Phoenix is to tell the truth about it, which helps the Centaurs more than the wolves: in PY6 the denial
  turns the wolves into the Centaurs' informants.** This, more than lone wolves in my scenarios, is why the wolves won
  2 of 38 PY6 fixed replays.

## Where the theory stands (summary of prediction vs outcome)

Directionally right: the parity class (after the fact), PY6 talk-live, the S3 control degenerate, S4 Centaur-leaning,
S2-open stable. Wrong: stealer soup noise; SE6 seal duels; PE6, PF6 and PY6L talk-live (all swept); S1-open (expected
no change, the Centaurs gained 3); S2-nodenial (expected Pyre stronger, no change); S5 (expected wolves 2). The pattern
in my misses: I credited cards with the uncertainty they create at night and under-weighted how Opus tables turn each
player's MOTIVE into evidence. A player whose card moved, whose team changed, or whose side loses to a burning
becomes an honest witness at once; only lies that some player is MOTIVATED to keep telling survive the discussion.
