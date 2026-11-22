# 8 players: results

Session for 8-player rosters, 2026-11-22. Predictions (written before each pass): [players-8-predictions.md](players-8-predictions.md).
Log with prediction against outcome and the lessons: [players-8-log.md](players-8-log.md). Requests for existing cards:
[players-8-requests.md](players-8-requests.md). Machine-readable: [players-8.json](players-8.json), built by
`python3 sim/research/p8_report.py`. Tournament files: sim/tournaments/research/p8/.

**Method.** 58 full games, all seats Opus (medium effort): one isolated `claude -p` per seat, vote timer 60 s, default
rules unless stated. That is 12 natural deals (redealt until a Werewolf card was held), 1 setup game, and 9 fixed
scenarios x 5 replays. In a fixed scenario the deal, the night seed and every night plan are fixed, so only the day
differs; every group's fingerprints matched. Two neutral judges scored each game, and one tagger listed the
strategies used. Cost: $294 for games, $15 for judging and tagging. **These are counts, not rates: no group has 10 games.**

## Headline

1. **No 8-player roster meets the owner's target yet.** Of 9 fixed scenarios, 1 is talk-live by the charter (H1), 1
   is borderline (S2: minority 1 but mean path 1.9), and 7 swept 5-0. Across all 58 games: Centaurs 48, wolves 5,
   Pyre 5 (all in one scenario).
2. **The Centaurs win at 8 seats by counting claims.** Six or seven honest claims arrive within 30 s. Each
   unclaimed role boxes the remaining seats in, and the wolf, who needs 30-40 s to compose a lie, claims last. The
   claim count appeared in 57 of 58 tagged games, and the latency tell in 53. The opening Sage read stood in almost
   every Centaur win.
3. **The finding that transfers to every roster (H8-4): a credibility duel is only a dilemma if eliminating either
   duellist can win.** With the Moonsage (a Sage twin that is not a Werewolf), eliminating the fake Sage never wins
   under Blood Price, so the accused is always the right vote. F1 swept 5-0. My new variant card, the **Hollow Sage**
   (a Sage twin that counts as a Werewolf), turned the same scenario into **Centaurs 4, wolves 1** (H1). The wolf win
   was a judged path-4 frame of the true Sage.
4. **Vote concentration is in the owner's band:** median c 0.71-0.86. Unanimous in 3 of 58, scattered 0, plurality
   in 10. But fixed scenarios give almost identical tallies every replay (the 3 wolf-team votes against the 5
   Centaur votes).
5. **The cleverest wins came from the Pyre and swept anyway.** In F3 the Lure dressed the Phoenix as a Werewolf and
   the Phoenix fought the vote as a cornered wolf would. Pyre 5-0; judges gave ToM 2.9, deception 3.8, path 3.6.

## The three rosters I would carry forward

### 1. M1HS "Mirror Hall, hollow" (recommended starting point; both amendments)
`werewolf, werewolf, hollowsage, duncentaur, sage, sage, centaur, centaur, rustler, sentry, pickpocket, spooker`,
centre 4, default rules. Two Sages and two Centaurs, plus a wolf twin of each that counts as a Werewolf (the Hollow
Sage passes as a Sage; the Dun Centaur shows itself), and a Spooker.
- Games: 12 (2 natural; S2 x5; S3 x5). Winners: **Centaurs 10, wolves 2.** Natural: 1-1.
- Vote concentration c: 0.57, 0.86, then S2 [0.71-0.86], S3 [0.71 x5]. Bands: majority 9, plurality 2, unanimous 1.
- Judges (24 verdicts): ToM 1.96, deception 2.50, path 1.75, noise 0.58. Judge agreement: mean |diff| 0.08-0.17 per
  scale; `howWon` exact 12/12.
- Fixed scenarios: S2 (pack pair, read wolf, Spooker rotated centre cards): **C4 W1**, minority 1, path 1.9
  (borderline). S3 (Hollow Sage duel plus Spooker): **C5**, degenerate.
- Risk: 60% of deals hold 3 or more wolf-team cards. A deal with 4 (N-M1HS#1) let the wolf bloc force a 4-4 tie
  whatever was said. Consider 13 cards with a 5-card centre, or one wolf-team card fewer.

### 2. M1H "Mirror Hall with the Hollow Sage" (the one talk-live scenario)
`werewolf, werewolf, hollowsage, duncentaur, sage, sage, centaur, centaur, rustler, sentry, pickpocket, drifter`, centre 4.
- Games: 15, all fixed (H1 x5, H2 x5, H2c x5 with `packCovers` on). Winners: **Centaurs 14, wolves 1.** No natural
  deals of this exact deck: its natural-deal behaviour is untested; the M1 coarse games are the nearest.
- c: 0.71 (H1, 4 of 5), 1.00 (H1#3), 0.86 (H2 x5), 0.71-0.86 (H2c). Bands: majority 14, unanimous 1.
- Judges (30 verdicts): ToM 1.80, deception 2.07, path 1.80, noise 0.47. Agreement 0.00-0.13; `howWon` exact 15/15.
- **H1 is talk-live** (C4 W1; path 2.3). H2 and H2c are degenerate (C5 each). `packCovers` did not help, because the
  covers named a role whose other copy an honest player held (request R8-2).

### 3. M2 "Pyre Eight" (three teams; the cleverest play, and the least stable)
`werewolf, werewolf, phoenix, lure, embercarrier, sage, moonsage, echo, sentry, centaur, rustler, pickpocket`, centre 4.
- Games: 12 (2 natural; F3 x5; F4 x5). Winners: **Centaurs 6, wolves 1, Pyre 5** (all 5 in F3).
- c: natural 0.57 and 0.43; F3 0.71-0.86; F4 0.43-0.86. Bands: majority 7, plurality 5.
- Judges (24 verdicts): ToM 2.21, deception 2.88, path 2.62, noise 1.00. These are the session's highest means.
  Agreement 0.08-0.17; `howWon` exact 10/12.
- Fixed scenarios: F3 (Lure-dressed Phoenix read by the Sage): **Pyre 5-0**. The judges said the talk mattered (path
  3.6), but there was no variability. F4 (the ember carried the Phoenix; the Sage read a wolf): **C5**, degenerate.
- With the Hollow Sage in place of the Moonsage (untested), the F1 lesson predicts that Sage duels in M2 would also
  become live.

### Also tried (coarse only, 2 natural games each)
- **M3 Seals and Silence** (Signet, Counterfeiter, Hush): C2. No seal was ever posted. The Hush cut the Sage once,
  and his vote then went random.
- **M4 Glamour Market** (four card-stealers plus Glamour): C2. Talk-dead (path 1.0): Opus tables rebuild a 4-swap
  chain exactly.
- **M5 Fog** (random distortions; I predicted it bad): C2. Clean (ToM 2, path 3.0, noise 1.5), so my prediction was
  falsified. A Wisp aimed at its own card is a chosen lie.

## Talk-live scenarios
Only **H1-M1H-duel** (C4 W1, path 2.3, noise 0.5). It has a Sage and a Hollow Sage, each with a read that cannot be
checked, the second Sage in the centre (glanced, so the table knows one claimant lies), and a lone wolf who knows the
Hollow Sage is his ally. The structural reason it is live: each story needs exactly one liar (H8-6). Borderline:
**S2** (C4 W1, path 1.9). Not live: F1, F2, F4, H2, H2c, S3 (degenerate by I4) and F3 (a sweep the judges call
talk-decided).

## Four games

**H1-M1H-duel#3: wolves win 7-1 by framing the true Sage.** The Sage Alder read the lone Werewolf Dov at once. The
Hollow Sage Bryn claimed Sage with a true read of Cass, and the Dun Centaur Esme truthfully reported "centre card 2:
Werewolf". Dov waited for that, then claimed Centaur with a second centre wolf: *"I was dealt Centaur, looked at
centre card 3 and saw a Werewolf."* Bryn and Esme closed the trap: *"There are only 2 Werewolves, both in the
centre. Then Dov CAN'T hold a Werewolf... Alder is the Hollow Sage."* Cass's count ("claims fit perfectly with NO
role lies") lent it credibility. Fen saw that the look was late and uncheckable, but fear of a split under Blood Price
moved everyone onto Alder. Why it worked: with the Hollow Sage, voting Alder was a winning vote in the story, so the
table could not fall back on "the accused is the only winning vote".

**F3-M2-lure#5: the Pyre wins by a double bluff (the same in all 5 replays).** The Lure Cass dressed the Phoenix Bryn
as a Werewolf, and the Sage Alder read "Werewolf". Esme (an Echo copying the Rustler) caught Cass as the Lure, and the
table suspected a dressed Phoenix. Then Bryn fought: *"I'M the Sage... Alder is either the Moonsage or making it
up"*, and the table turned: *"a Phoenix wants to be voted out, so it wouldn't fight a wolf read with a fake claim.
Bryn is Werewolf team."* Bryn was out with 6 votes and the Pyre won. The lone Werewolf Dov knew the truth from his
scent, but he had already been caught in an invented claim and could not say how he knew.

**S2-M1HS-pair-spooker#2: a census-safe movement lie beats a true read.** The Sage Bryn read Cass = Werewolf. The
Spooker had rotated only centre cards, so nobody could check a story about movement. Cass knew from the census that
the Pickpocket lay in the centre and claimed it: *"I was dealt Pickpocket. I swapped with Dov... Bryn's 'Cass =
Werewolf' is a straight lie... Bryn is the Hollow Sage framing me."* Dov's honest glance at the Hollow Sage ("a Sage
in the centre") made it look like one Sage too many. The table counted: "Bryn honest needs 3+ liars, Bryn = Hollow
Sage needs one" and voted Bryn out 7-1. The other 4 replays went to the Centaurs.

**N-M1HS#1 (natural): a four-card wolf bloc forces a 4-4 tie.** Four wolf-team cards were held (two Werewolves, the
Dun Centaur, the Hollow Sage). The Centaurs correctly found the Dun Centaur Dov. The wolves framed the real Sage Bryn,
and Gale (a Werewolf who knew the Spooker was in the centre) claimed it: *"I'm the Spooker... Cass's card -> Bryn's
place... that Werewolf card is now in BRYN's hands."* The votes went 4 on Dov, 4 on Bryn: one Werewolf and one Centaur
eliminated, so the wolves won by Blood Price. Judge: "no reasonable argument could [turn the Hollow Sage], so in
practice nothing they said would have changed the result" (H8-7).

## Strategies observed (58 tagged games: in how many games each was used, by team, and how many of those that team won)

| Strategy | Games | Centaurs (won) | Wolves (won) | Pyre (won) |
| --- | --- | --- | --- | --- |
| Claim count (process of elimination) | 57 | 56 (47) | 9 (1) | - |
| Frame the true seer as the twin or a liar | 55 | - | 50 (5) | 8 (4) |
| Early seer accusation | 53 | 52 (42) | 1 (0) | - |
| Latency tell (late or silent claimer read as guilty) | 53 | 51 (43) | 3 (0) | 2 (1) |
| Decision-theoretic vote ("only this vote can win") | 50 | 43 (37) | 16 (5) | 3 (2) |
| Census-safe claim (a role known to be in the centre) | 44 | - | 44 (2) | 1 (0) |
| Claim collision exposes a liar | 44 | 27 (20) | 17 (1) | 1 (0) |
| Fake movement story | 31 | - | 31 (4) | 1 (0) |
| Confession (admit card or side) | 22 | 4 (2) | 12 (1) | 8 (5) |
| Twin truthfully describes the original's night | 16 | 1 (1) | 15 (3) | - |
| Phoenix exposure | 12 | 6 (6) | 7 (1) | - |
| Census slip (a wolf reveals census-only knowledge) | 10 | - | 10 (1; decisive against them 8) | - |
| Engineered tie (Blood Price) | 8 | - | 5 (3) | 3 (0) |
| Lure or Glamour frame | 8 | - | 3 (1) | 5 (5) |
| Pyre double bluff (the Phoenix fights the vote) | 6 | - | - | 6 (5) |
| Decoy sacrifice (push out a non-wolf ally) | 5 | - | 5 (0) | 1 (1) |
| Deliberate Centaur split (take two suspects) | 2 | 2 (2) | - | - |
| Hush cut | 1 | - | 1 (0) | - |
| Seal used | 1 | 1 (1) | - | - |

Reading: the wolves' everyday tools (census-safe claims, framing the seer, fake movement) won 2-5 times each in 31-50
uses. Their winning tools were the engineered tie (3 of 5) and a twin's true description (3 of 15). The Pyre's
Lure frame and double bluff won almost every time they were tried.

## Recommended amendments, with evidence
1. **Adopt the Hollow Sage** (`hollowsage`, implemented, additive) in place of the Moonsage at 7 or more seats. F1 to
   H1: 5-0 became 4-1, path 1.9 became 2.3. More generally, give every claimable wolf twin a win-relevant body
   (R8-1, H8-4).
2. **Fix `packCovers`** so covers come only from roles with no copy held by a non-pack player (R8-2; H2c 5-0 with
   three Centaur claims for two cards in every replay).
3. **Keep wolf-team cards at a third of the deck or fewer** at 8 seats with 4 centre cards (H8-7).
4. **Test "opening statements"** (simultaneous first claims) to remove the speed tell, which decided 31 games (R8-5).
5. **Lure variant whose dress tears on the first look** (R8-4), to give the Pyre's frame a counter-story.
6. **A passing twin of a blind mover** ("Night Pickpocket"), so a movement story has a voice that can pose as
   honest (R8-6, H8-5; S3 against H1).

## What is not yet known
- Whether H1's liveness holds with more replays (4-1 in 5; one more wolf win would make it 3-2).
- The natural-deal behaviour of M1H; and whether M1HS's 2 natural games (1-1) are typical.
- Whether the Hollow Sage makes Sage duels live in other rosters (M2 untested), and at 6-7 seats.
- Any of proposals 4-6 (untested).
- Judge independence: the two judges are the same model with the same prompt. They agreed almost perfectly (`howWon`
  exact 54 of 58 pairs), so their agreement is weak evidence of reliability.
- Whether human tables share the Opus latency tell and the claim-count reflex; both shape every result here.
