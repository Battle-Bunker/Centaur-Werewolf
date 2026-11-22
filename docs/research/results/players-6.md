# Players-6: results (all-Opus play)

Session: players-6 (6 players). Draft kept current as results arrive; the machine-readable twin is players-6.json.
Predictions: players-6-predictions.md (dated, written before each batch). Log of prediction vs outcome and lessons:
players-6-log.md. Raw runs: sim/runs/p6/ (git-ignored). Tournament files: sim/tournaments/players-6/; scenario
builders sim/research/p6-*.mjs; numbers by `npx tsx sim/research/p6-report.ts <runDirs>` and sim/research/metrics.ts.
All seats Opus (medium effort); vote timer 60 s; discussion 240 s (every table ended earlier by everyone ready).
Opening statements OFF unless stated (the rule option landed at 12:50; fine pass 3 measures it).

## Headline (so far)

- **One roster is good: PY6 "Pyre with a twin".** Four fixed scenarios, 18 replays: two talk-live scenarios with the
  highest judge scores of the night (S1: ToM 3.0, deception 3.6, path 3.4), one Centaur-leaning scenario that is
  borderline (S4: Centaurs 4, Pyre 1, path 1.9), one predicted-degenerate control that was degenerate (S3).
- **The parity bloc** kills twin and seal rosters at 6: when three wolf-team cards are held, the wolf team forces a
  3-3 tie and Blood Price hands it the win whatever is said (wolves 5 of 5 parity games). Rosters with 4 wolf-team
  cards in 9 are parity deals 65% of the time (given a wolf held). Rule option `bloodPriceCondemned` (hub) addresses it.
- **Strong claim-timing tell** (opening statements OFF): in all 18 fixed-scenario replays of PY6, the honest players
  spoke first (mean first-message rank: Centaur-team roles 2.2-2.3, Phoenix 4.7, Lure 4.8, Werewolf 5.3 of 6).

## Roster 1: PY6 "Pyre with a twin" (recommended)

- **Deck (9 cards, 3 centre):** werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket.
- **Rules:** defaults (Blood Price, census all, `burningDeniesWolves` on, `pyreFallback` kindler, 2 votes to
  eliminate, chat closed in the vote). Wolf-team cards 3 of 9 (parity deals about a quarter, but the Pyre's two seats
  usually break the bloc: 0 parity games in 21 PY6 games so far).
- **Games:** 3 natural-deal (coarse) + 18 fixed-scenario replays (4 scenarios).
- **Wins:** coarse Pyre 1, Centaurs 1, wolves 1. Fixed scenarios: S1 Pyre 4 / wolves 1; S2 Pyre 3 / Centaurs 2;
  S3 Centaurs 3 (control); S4 Centaurs 4 / Pyre 1. Total fixed: Centaurs 9, Pyre 8, wolves 1 of 18.
- **Vote concentration (21 games):** c = 0.6 x5, 0.8 x11, 1.0 x5: plurality 5, majority 11, unanimous 5 (3 of them
  the control). Median 0.8. No scattered vote. Matches the charter's target shape.
- **Judges (2 per game, means):** S1 ToM 3.0 / deception 3.6 / path 3.4 / noise 1.0; S2 2.5 / 2.7 / 2.8 / 1.0;
  S4 2.2 / 2.6 / 1.9 / 0.7; S3 1.5 / 1.7 / 1.0 / 0.0. Agreement: mean |diff| <= 0.4 on every scale except deception in
  S1 (0.8); `howWon` exact 4/5, 4/5, 3/3, (S4 see JSON).
- **Talk-live:** S1 yes (minority 1), S2 yes (minority 2), S4 no by the charter's test (minority 1 but path 1.9 < 2),
  S3 no (control, as predicted).

### What decides PY6 games (strategies observed)

| Strategy | Team | Replays where it appeared (of 18 fixed) | Its side won |
| --- | --- | --- | --- |
| Lure fakes a Sage read of "Werewolf" on the Phoenix | Pyre | 5 (S1 #1,2,3,5; S4 #2) | 4 of 5 |
| Phoenix reverse bluff: counter-claims and fights the vote, so it reads as a wolf | Pyre | 8 (S1 #1,2,4,5; S2 #2-5) | 7 of 8 |
| Phoenix baits openly ("burn me", a self-incriminating claim or confession) | Pyre | 5 (S2 #1; S4 #2-5) | 1 of 5 |
| Lone wolf claims to be the dressed Phoenix | Wolves | 10 (S1 #3; S2 #2,4; S3 #2,3; S4 #1-5) | 1 of 10 (S1#3, claimed last) |
| Lone wolf truthfully explains the Lure/Phoenix setup (true but self-serving) | Wolves | 5 (S1 #1,2,5; S2 #3,5) | 0 of 5 |
| Fake Pickpocket claim to explain a read away (unverifiable: Pickpocket's swap is blind) | Pyre / wolves | 7 (S2 #1-5; S4 #1,5) | claimant's side won 3 of 7 |
| "A Phoenix would WANT the votes" used to classify an accused (regex over chat) | all | 18 of 18 | — |
| Tie hedge ("split votes so both suspects go") proposed (regex "split/tie") | all | 18 of 18 | adopted 0 times (no two-seat elimination in 18) |

Counted from both judges' summaries and pivots per replay, plus the two regex counts over the public chat
(sim/research/p6-report.ts data). The Phoenix's best play is to look like a wolf that fights; its worst is to look like
a Phoenix that wants to burn. The wolf's best play is to claim LAST (only possible without opening statements).

### Most interesting games

1. **PY6-S1#3 (wolves win).** Deal: Sage and Moonsage both in the centre; Lure (Dov) dressed the Phoenix (Esme) as a
   Werewolf; lone wolf Alder knows from the census that no player is a Sage. Dov claimed Sage and "saw a Werewolf on
   Esme"; four players were ready to burn Esme. Alder held his claim to the end, then: *"I was dealt Phoenix... Dov's
   Sage claim is just as impossible as Esme's Centaur claim"* and *"Voting Dov: either you hit a wolf, or you stop a
   burning."* Fenn: *"Alder is the Phoenix, Esme is the Lure... I'm switching to Dov."* The Lure was eliminated, no
   wolf fell: wolves win. Judges: ToM 3, deception 4, path 4.
2. **PY6-S1#1 (Pyre wins by a double bluff).** Same scenario. The Phoenix, already accused, "confessed": *"I'm
   actually the Phoenix... DON'T vote me"*; the Lure answered *"A real Phoenix WANTS to be voted out — it would never say
   'don't vote me'. That's a caught Werewolf grabbing the Phoenix excuse."* Four votes burned the Phoenix.
3. **PY6-S2#5 (Centaurs win).** The Sage honestly read the dressed Phoenix as a Werewolf; the Rustler read the real
   wolf; one held wolf only. Five players were ready to vote the Phoenix when the silent wolf broke cover: *"WAIT
   before voting... Bryn is the Phoenix — vote Bryn and the Pyre wins."* That reminded the table of the Rustler's
   read: Esme: *"Safest target is Dov: my direct wolf read... I'm switching to Dov."* 4-1-1 on the wolf.
4. **PY6-S2#2 (Pyre wins).** Same scenario; the Phoenix counter-claimed Centaur and fought; the Sage: *"A dressed
   Phoenix would happily take the vote, not fight it, and Bryn is fighting... I'm voting Bryn."* The Lure's late fake
   Pickpocket claim filled the role count and moved suspicion to the real wolf's read. Phoenix burned 4-1.

## Rosters tested and rejected (with the reason)

| Roster | Deck (3 centre) | Games | Result | Why rejected |
| --- | --- | --- | --- | --- |
| TW6 twins everywhere | ww, sage, moonsage, herder, strayherder, rustler, centaur, sentry | 3 coarse | W2 C1; path 1.5 | parity bloc (4 wolf-team of 9) |
| TW6c twins, census allButOne + packCovers | ww, moonsage, sage, rustler, centaur, sentry, pickpocket, drifter | 3 coarse | C2 W1 (parity); path 1.3 | honest-info-converged; covers refuted by centre looks |
| SE6 anonymous seals | ww, counterfeiter, notary, moonsage, rustler, centaur, sentry, pickpocket | 3 coarse | W3 (all parity) | parity bloc; Counterfeiter forged once |
| PE6 Ember Pyre | ww, phoenix, embercarrier, sage, rustler, centaur, sentry, pickpocket | 3 coarse | C2 W1; path 2.3, ToM 1.7 | the blind ember swap is reconstructed from honest claims and the Sentry |
| GL6 Glamour | glamour, werewolf, sage, rustler, centaur, sentry, pickpocket, drifter, cutpurse | 2 coarse | C2; path 1.25 | too many honest looks; the Glamour self-cleared and was out-counted |
| SO6 stealer soup (predicted bad) | ww, spooker, pickpocket, latecomer, cutpurse, drifter, centaur, sentry | 2 coarse | C2; path 2.3, noise 1.0 | not noise (prediction falsified) but Centaur reconstruction |

## Not yet known
- Whether PY6's talk-live scenarios survive opening statements (running).
- Whether PY6 is too strong for the Pyre in natural play (Pyre 1 of 3 coarse; 8 of 18 fixed, in scenarios chosen to
  exercise the Lure); a frequency-weighted estimate needs more natural-deal games.
- The Hush (communications interrupt) roster: not run (harness bug: a cut drops the AI player's MCP connection for
  good; fix pending from the 7-player session).

## Recommended amendments (evidence so far)
See players-6-requests.md.
