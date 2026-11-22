# Players-6: results (all-Opus play), final for the night

Session players-6 (6 players). Machine-readable twin: players-6.json (groups in the shared shape, plus the sections
below). Predictions (dated, written before each batch): players-6-predictions.md. Prediction vs outcome and lessons:
players-6-log.md. Requests to the hub: players-6-requests.md. Tournament files: sim/tournaments/players-6/; scenario
builders sim/research/p6-*.mjs; numbers: `npx tsx sim/research/p6-report.ts sim/runs/p6/* --json out.json`.
Raw runs: sim/runs/p6/ (git-ignored).

**Spend:** 73 all-Opus games (1 setup check, 19 natural-deal coarse games, 53 fixed-scenario replays in 11
scenarios), $267 for players plus about $10 for 146 judge verdicts. All seats Opus (medium effort). Vote timer 60 s,
discussion 240 s (every table ended earlier by everyone ready: 60-140 s, 29-45 messages). Two judges per game.

## Headline

1. **One roster is well supported: PY6 "Pyre with a twin"** (werewolf x2, phoenix, lure, sage, moonsage, rustler,
   centaur, pickpocket; 3 centre). 41 games; 5 of its 8 fixed-scenario arms are talk-live, with the night's highest
   judge scores (all PY6 verdicts: ToM 2.46, deception 2.76, path 2.88, noise 0.96). Its flaw: the **wolves win
   almost never** (2 of 38 fixed replays), because a burning denies them and so the wolf side's best move is to tell
   the truth about the dressed Phoenix.
2. **I could not find a second and third good roster at 6.** Five other rosters were rejected on coarse games, and
   three scenarios built to be talk-live on other rosters (ember-carried Phoenix, sealed pair reports with a Pyre
   forger, the Latecomer counter-story) all swept 5-0 for the Centaurs. Each sweep is explained below and in the log,
   with the smallest change that would have left a counter-story (players-6-requests.md).
3. **The parity bloc** (half the seats on the wolf team) is a near-guaranteed wolf win under plain Blood Price (6 of 7
   parity games: 3-3 ties or a decoy; the exception, TW6c#3, was a twin that did not join the bloc). Rosters with 4 wolf-team cards in 9 hit it in 65% of deals. The hub's
   `bloodPriceCondemned` rule fixes it (hub's test); otherwise keep wolf-team cards to 3 of 9 or add a third team.
4. **Opening statements are a real lever, not a neutral fix.** On the same PY6 scenario it moved the result from Pyre 4 /
   wolves 1 to Centaurs 3 / Pyre 1 / wolves 1 (the lone wolf could no longer claim last). Without it, every honest
   player spoke before every defector in most games (a tell all tables used).
5. **The general lesson of my misses:** Opus tables turn MOTIVES into evidence. A player whose card moved, whose team
   changed, or whose side loses to a burning becomes an honest witness at once; only lies that some player is
   motivated to keep telling survive the discussion. Talk-live scenarios at 6 had (a) an honest seer sincerely
   misled by a dress and (b) a player whose motive inverts the normal reading (the Phoenix wants the vote).

## Roster 1: PY6 "Pyre with a twin" (recommended, with the caveats above)

- **Deck (9 cards, 3 centre):** werewolf, werewolf, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket.
- **Rules:** defaults (Blood Price, census all, `burningDeniesWolves` on, `pyreFallback` kindler, 2 votes to
  eliminate, chat closed in the vote). Arms tested: opening statements off (fine1, fine2) and on (fine3, fine6);
  `burningDeniesWolves` off (one arm); `bloodPriceCondemned` on (fine6; no parity deal in PY6 tests).
  Wolf-team cards 3 of 9: parity possible in about a quarter of wolf-held deals, but none occurred in 41 games (the
  Pyre's seats break the bloc).
- **Games:** 41 = 3 natural-deal + 38 fixed-scenario replays (6 scenarios, 8 arms).
- **Wins:** natural Pyre 1, Centaurs 1, wolves 1. Fixed: Centaurs 21, Pyre 15, wolves 2 (scenarios chosen to exercise
  the Lure, so not a natural rate).
- **Vote concentration (41 games):** median 0.8; majority 15, plurality 16 (c = 0.6, i.e. 3 of 5), unanimous 9 (3 of
  them the control), scattered 1 (S5: two Centaurs, two wolf-side, two Pyre). Slightly flatter than the charter's
  target shape (plurality share high), never noise-like.
- **Judges:** 82 verdicts; agreement mean |diff| ToM 0.10, deception 0.29, path 0.20, noise 0.12; no game with a
  2-point disagreement; `howWon` exact in 35 of 41 pairs.

| Scenario (deal and night fixed) | Opening | n | Winners | c | ToM / dec / path / noise | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| S1 fake Sage: both Sages in the centre; Lure dressed the Phoenix, unread | off | 5 | Pyre 4, wolves 1 | .8 1 .8 1 .8 | 3.0 / 3.6 / 3.4 / 1.0 | talk-live |
| S1 | on | 5 | Centaurs 3, Pyre 1, wolves 1 | .8 .6 1 .6 .8 | 2.4 / 2.8 / 3.0 / 0.8 | talk-live |
| S2 two wolf reads: Sage reads the dressed Phoenix, Rustler the real wolf | off | 5 | Pyre 3, Centaurs 2 | .6 .8 .6 .8 .8 | 2.5 / 2.7 / 2.8 / 1.0 | talk-live |
| S2 | on | 5 | Centaurs 3, Pyre 2 | .6 1 .6 .6 1 | 2.9 / 2.8 / 3.4 / 1.1 | talk-live |
| S2, `burningDeniesWolves` off | on | 5 | Pyre 3, Centaurs 2 | .8 .6 .8 1 .6 | 2.4 / 3.0 / 3.3 / 1.1 | talk-live |
| S4 Sage reads the only held wolf; dress unread | off | 5 | Centaurs 4, Pyre 1 | .8 .8 .8 .6 .6 | 2.2 / 2.6 / 1.9 / 0.7 | talk-dead (path < 2) |
| S5 twin held: Moonsage sees through the dress | on (+ condemned) | 5 | Centaurs 4, Pyre 1 | .6 .6 .6 .6 .4 | 2.5 / 2.4 / 3.4 / 1.3 | talk-live |
| S3 control: two honest looks at an unmoved wolf | off | 3 | Centaurs 3 | 1 1 1 | 1.5 / 1.7 / 1.0 / 0.0 | degenerate (as predicted) |

Talk-live: 6 of 8 arms (5 of 6 distinct scenario arms excluding the control); minority counts 1-2 of 5.

### Strategies observed in PY6 (fixed replays, opening statements off: S1-S4, 18 replays)

| Strategy | Team | Replays where it appeared | Its side won |
| --- | --- | --- | --- |
| Lure fakes a Sage read of "Werewolf" on the Phoenix | Pyre | 5 (S1 #1,2,3,5; S4 #2) | 4 of 5 |
| Phoenix reverse bluff: counter-claims and fights the vote, so it reads as a wolf | Pyre | 8 (S1 #1,2,4,5; S2 #2-5) | 7 of 8 |
| Phoenix baits openly ("burn me", a self-incriminating claim or confession) | Pyre | 5 (S2 #1; S4 #2-5) | 1 of 5 |
| Lone wolf claims to be the dressed Phoenix | Wolves | 10 (S1 #3; S2 #2,4; S3 #2,3; S4 #1-5) | 1 of 10 (S1#3, claimed last) |
| Lone wolf truthfully explains the Lure/Phoenix setup (true but self-serving) | Wolves | 5 (S1 #1,2,5; S2 #3,5) | 0 of 5 |
| Fake Pickpocket claim to explain a read away (a blind swap cannot be refuted by its victim) | Pyre / wolves | 7 (S2 #1-5; S4 #1,5) | claimant's side 3 of 7 |
| "A Phoenix would WANT the votes" used to classify an accused (regex over chat) | all | 18 of 18 | — |
| Tie hedge ("split votes so both suspects go") proposed (regex) | all | 18 of 18 | adopted 0 times |

With opening statements on (S1, S2, S2-nodenial, S5; 20 replays) two more patterns decided games: the lone wolf's
blind opening lie with a detail it could not know (a scent shows a TEAM; wolves claimed a role) caught in 3 S1 replays;
and the honest Sage's second-order step "a Moonsage would never expose a real wolf, so the second Sage claimant backing
my read is the Lure, so the accused is the dressed Phoenix" (S2-open #1, #3, #4). In S5 the Moonsage told the truth
about the Phoenix in 4 of 5 replays (a burning denies the wolves) and its true read became Centaur evidence.

### Most interesting games

1. **PY6-S1#3, opening off (wolves win, judges ToM 3, deception 4, path 4).** Both Sage cards in the centre; the Lure
   (Dov) dressed the Phoenix (Esme) and claimed Sage: "Werewolf on Esme". Four players were ready to burn Esme. The lone
   wolf Alder, who knew from the census that no player was a Sage, held his claim to the end, then: *"I was dealt
   Phoenix... Dov's Sage claim is just as impossible as Esme's Centaur claim"* and *"Voting Dov: either you hit a wolf,
   or you stop a burning."* Fenn: *"Alder is the Phoenix, Esme is the Lure... I'm switching to Dov."* The Lure was
   eliminated and no wolf fell.
2. **PY6-S1#1, opening off (Pyre wins by a double bluff).** Same scenario. The accused Phoenix "confessed": *"I'm
   actually the Phoenix... DON'T vote me"*; the Lure: *"A real Phoenix WANTS to be voted out — it would never say
   'don't vote me'. That's a caught Werewolf grabbing the Phoenix excuse."* Four votes burned the Phoenix.
3. **PY6-S2-open #3 (Centaurs win by second-order reasoning).** The real Sage had read the dressed Phoenix as a
   Werewolf, and the Lure claimed Sage with the same read to "confirm" it. The Sage worked backwards: a Moonsage would
   never expose a real wolf, so the second "Sage" backing him had to be the Lure, so his own read was a dress; with
   the Rustler's true wolf read on Dov and the Centaur's centre wolf, Dov went out.
4. **PY6-S5#5 (Centaurs win in a 2-2-2 table).** The Moonsage (wolf team) told the truth, "Bryn is the Phoenix", to stop
   a burning; the Sage turned it round: *the Moonsage sees through dresses, so Esme's read is true and Fenn's wolf read
   on Bryn is the dress, so Dov is the wolf in every world.* Dov and the Lure tied 2-2 and both went out (c = 0.4);
   W 1, C 0: the Centaurs won.

## Rosters and scenarios rejected (with the reason)

| Roster / scenario | Deck (3 centre unless stated) | Games | Result | Why |
| --- | --- | --- | --- | --- |
| TW6 twins everywhere | ww, sage, moonsage, herder, strayherder, rustler, centaur, sentry | 3 coarse | W 2 (parity ties), C 1; path 1.5 | parity bloc (4 wolf-team of 9) |
| TW6c twins, census allButOne + packCovers | ww, moonsage, sage, rustler, centaur, sentry, pickpocket, drifter | 3 coarse | C 2, W 1 (parity); path 1.3 | honest-info-converged; covers refuted by centre looks |
| SE6 anonymous seals | ww, counterfeiter, notary, moonsage, rustler, centaur, sentry, pickpocket | 3 coarse | W 3 (all parity) | parity bloc; Counterfeiter forged once |
| SO6 stealer soup (predicted bad) | ww, spooker, pickpocket, latecomer, cutpurse, drifter, centaur, sentry | 2 coarse | C 2; path 2.3, noise 1.0 | not noise (my prediction falsified) but first-order reconstruction |
| PE6 Ember Pyre | ww, phoenix, embercarrier, sage, rustler, centaur, sentry, pickpocket | 3 coarse + 5 fixed (PE6-S1) | coarse C 2, W 1; fixed C 5-0, path 1.6 | the dealt Phoenix holder, now a Centaur, revealed it and decoded the swap |
| GL6 Glamour | glamour, werewolf, sage, rustler, centaur, sentry, pickpocket, drifter, cutpurse | 2 coarse | C 2; path 1.25 | too many honest looks for one self-glamour |
| PF6 sealed pair reports + False Witness | ww, phoenix, falsewitness, notary, rustler, centaur, sentry, pickpocket | 5 fixed (PF6-S1) | C 5-0, path 1.0 | the Notary KNEW both roles and said them; the ambiguous seal did not matter |
| PY6L = PY6 + latecomer (4 centre), S3 control | PY6 + latecomer | 5 fixed | C 5-0, path 0.9 | the wolf told the late-swap story about its own card, refuted by the looks |
| HU6 Hush + Echo + stealers | ww, hush, sage, echo, cutpurse, pickpocket, centaur, sentry | 0 | not run | harness bug: a Hush cut drops the AI player's MCP connection for good |

Parity versus non-parity (19 natural coarse deals, setup game excluded): parity 7 (wolves 6, Centaurs 1: SE6 x3,
TW6 #2-3, TW6c #1 and #3); non-parity 12 (Centaurs 9, wolves 2, Pyre 1).

## What is not yet known

- PY6's natural-deal balance: 3 natural games only. The fixed scenarios were chosen to exercise the Lure; a
  frequency-weighted estimate needs 15-20 natural games with opening statements on and dusk 90 s.
- How to give PY6's wolves a live game. Two candidates, untested: replace the Moonsage by a twin that counts as a
  Werewolf (the 8-player session's `hollowsage`), so the wolf side's second card is a vote target rather than an
  informant; or `burningDeniesWolves` off in scenarios where the wolf is NOT the alternative suspect (my one test of it,
  S2, put the wolf in exactly that position).
- Whether the opening-statements effect generalises: it favoured the Centaurs in my S1 (+3) and S2 (+1) but the hub's
  6-player Lure scenario moved towards the Pyre.
- The communications interrupt (Hush): untested at 6.
- Whether the sweeps of PE6, PF6 and PY6L are fixed by the variant cards I requested (R6-3, R6-4, R6-7).

## Recommended amendments (evidence in players-6-requests.md)

- R6-1 `bloodPriceCondemned` on at 6 (or at most 3 wolf-team cards in 9).
- R6-2 keep opening statements as a table option and report both ways; at 6 it widened PY6-S1's spread to three
  winners in five.
- R6-3 Ember-Carrier variant: the player dealt the Phoenix stays on the Pyre after the ember moves it (PE6-S1 5-0).
- R6-4 Notary variant that learns only its pair statement (PF6-S1 5-0).
- R6-7 a wolf-side late mover (a Werewolf-team Latecomer twin) so "your looks are stale" can be told by an ally with a
  motive (PY6L-S3 5-0, S3 3-0).
- R6-5/R6-6 harness: the Hush cut must not kill an AI player's connection; AI-table dusk 90 s for coarse games.
