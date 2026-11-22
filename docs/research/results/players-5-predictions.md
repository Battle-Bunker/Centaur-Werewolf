# 5 players: pre-registered predictions

Written 2026-11-22 BEFORE any 5-player research game of this session (one setup-verification game on the old A5 deck
was running while this was written; its result is not used for these predictions). Measures: docs/research/charter.md.
Deal-class frequencies: exact enumeration (sim/research/classes.ts), conditional on a player holding a Werewolf card.

## Constraints I design under

- **Evidence principle (owner, binding):** no pure, easy confirmation. I use no Herald, Pale Herald, Notary (a public
  or engine-composed statement of a card's true identity) and no Herder without its twin (the hub's coarse pass: the
  Herder's uncontestable count was the proof in 6 of 9 Centaur wins). Signet / Counterfeiter only in their new form
  (sealed as a ROLE, never as a player).
- **Hub lessons I build on:** (5) pack members collide on "safe" census claims, so I prefer decks with ONE pack card;
  (6) no uncontested global number; (7) a mirror is only unanswerable if no third party can vouch for the original;
  Opus discussions are short (about 90 s, 5 messages each) and concentrate votes.
- **What makes a 5-player scenario talk-live (my working theory).** At 5 players the Centaurs hold about 3 cards and
  have 2-3 private looks between them. If two looks touch the same seat and nothing could have moved or disguised it,
  the scenario is talk-dead. So every roster needs at least one of: a mover whose parameters are invisible (Spooker
  direction, blind stealers), a card whose claim mirrors a true one (Moonsage), or a distortion (Glamour, Lure). The
  talk-live scenarios are those where the defector's lie can be told so that it is consistent with every honest look;
  the outcome then turns on who commits to details first and whether the table models incentives ("who gains from
  this claim?") rather than counting.

## General predictions (5 players, all Opus)

- **P0.** Vote concentration high: median c about 0.75 (3 of 4 possible votes on one seat), unanimous in about a
  third, scattered rare (at most 1 in 10).
- **P0b.** Fixed scenarios: about half sweep (5-0). Talk-live ones are those with an invisible mover parameter or a
  twin duel with no third-party vouch.
- **P0c.** Judges: mean ToM about 2, deception 2 to 2.5, noise at most 1.2 on the good rosters; noise higher (about
  1.5-2) on the blind-stealer roster.

## Rosters

### Q1 "Moon and Stampede" (twin + invisible mover; my favourite)
`werewolf, moonsage, spooker, sage, rustler, sentry, centaur, centaur`, centre 3, default rules.
One Werewolf (no pack collisions; it scents if alone, which is always), a Moonsage (shadow Sage, not pack, does not
know the wolf) and a Spooker (blind 3-rotation; its direction is invisible).
- Classes (wolf held): Moonsage+Spooker 17%; Moonsage+Sage 17%; Spooker+Sage 17%; all three 11%; Moonsage only 11%;
  Spooker only 11%; Sage only 11%; none 3%.
- How the table plays: the Sage claims at once with its read. The Moonsage, if held, also claims Sage (a duel) or, if
  the real Sage is quiet, an uncontested Sage with a true read it can twist (it does not know the wolf, so its frame is
  a gamble). The Spooker claims a Centaur role or confesses a rotation in a direction that relocates suspicion. Crux:
  the two Sage stories and where the rotation put the cards; the Sentry constrains which seats moved, not where.
- Within-scenario prediction: Sage+Moonsage duel with no third-party vouch: Centaurs 2-3 of 5 (talk-live). Spooker
  rotation through the read seat: talk-live, 2-3 of 5. Sage read the wolf, nothing moved it, no Moonsage: Centaurs 5-0
  (talk-dead).
- Overall: Centaurs about 50%. c median 0.75. Judges: ToM 2.3, deception 2.5, path 2.5, noise 0.8.
- Falsifier: duels decided the same way in every replay by a fixed rule ("the first Sage claim is true"), or the
  Moonsage never claims Sage.

### Q2 "Three Hands" (several card-stealers)
`werewolf, werewolf, cutpurse, pickpocket, latecomer, sage, sentry, centaur`, centre 3.
Three mandatory player-to-player swaps (Cutpurse sees what it took; Pickpocket and Latecomer are blind).
- Classes: every stealer held in most deals; the two blind ones together in about 40%.
- Play: every mover announces its swap (Opus is honest by default); the table reconstructs the chain; the wolf card's
  final position is deducible unless a mover lies about its target. The Cutpurse that took a wolf is a knowing
  defector and will lie about its target. Crux: the order of swaps (Cutpurse 46, Pickpocket 47, Latecomer 88) and
  whether one claimed target is false.
- Within-scenario: when no stealer touched a wolf card: talk-dead, Centaurs 4-5 of 5. When the Cutpurse took a wolf
  and lies: talk-live 2-3 of 5. When a blind stealer took a wolf: path-dependent (the new holder learns it from the
  table's reconstruction and switches sides mid-talk): talk-live.
- Overall: Centaurs about 55%. c median 0.7. Judges: ToM 2.0, deception 2.0, path 2.3, noise 1.5 (blind swaps).
- Falsifier: noise >= 2 (results nobody could foresee), or the chain always reconstructed exactly (talk-dead).

### Q3 "Little Pyre" (three-way at 5)
`werewolf, werewolf, phoenix, lure, sage, rustler, sentry, centaur`, centre 3.
- Classes (wolf held): Phoenix+Lure 30% (incl. 2-wolf deals), Phoenix without Lure 24%, Lure without Phoenix 24%.
- Play: the Lure dresses the Phoenix as a Werewolf; a Sage who reads it condemns it sincerely; the wolves know (they
  see true cards via census logic only for the centre; they do NOT see the Phoenix's card) that the accused is not of
  the pack and must defend it without exposing themselves. At 5 the Pyre needs only one extra vote beside its own.
- Within-scenario (Phoenix+Lure held, Sage read the dressed Phoenix): Pyre 2, Centaurs 2, wolves 1 of 5 (talk-live).
- Overall: Centaurs 40%, wolves 35%, Pyre 25%. c median 0.7. Judges: ToM 2.5, deception 2.5, path 2.8, noise 1.0.
- Falsifier: the Pyre never wins, or the Phoenix always burns when the Lure is held.

### Q4 "Echo Chamber" (copiers)
`werewolf, werewolf, gleaner, echo, sage, rustler, sentry, centaur`, centre 3.
The Gleaner copies a centre card (a centre Werewolf makes it a hidden wolf the pack does not know); the Echo copies a
player (an early true read; copying a wolf makes it a wolf).
- Play: duplicate true claims (an Echo-Sage and a Sage both read; an Echo-wolf is a defector who can truthfully describe
  the Echo's night). The pack may not know a third wolf exists, so wolves' claims can collide with a wolf-Gleaner's.
- Within-scenario: copier became a wolf: talk-live 2-3 of 5. Copier copied a Centaur role: two honest looks, talk-dead.
- Overall Centaurs about 55%. c median 0.75. Judges: ToM 2.0, deception 2.0, path 2.0, noise 1.0.
- Falsifier: the copied-wolf class is always caught (the copier's own true "Echo" claim plus a read pins it).

### Q5 "Open Book" (PREDICTED BAD: the control on my judgment)
`werewolf, werewolf, sage, sage, centaur, centaur, sentry, herder`, centre 3.
No defector credibility card, two Sages, a Herder. Prediction: Centaurs win at least 4 of 5 coarse games; every fixed
scenario I could build with one wolf held sweeps 5-0 for the Centaurs; judges' path below 2 and ToM about 1
(mechanical elimination). Reason: two Sages plus a Herder count leave the lone wolf no claim that survives a
first-order check. Falsified if the wolves win 2 or more of 3 natural games, or a fixed scenario splits.

### Q6 "Quiet Seal" (forged role-signed message + communications interrupt)
`werewolf, counterfeiter, hush, signet, sage, rustler, sentry, centaur`, centre 3.
- Play: the Signet posts one sealed (role-signed) message; the Counterfeiter forges a second "Signet" seal: the table
  knows one is fake and judges by content. The Hush cuts one player for 60 s of a short (about 90 s) discussion.
- Prediction: the Hush cut is mostly wasted (the victim posts when back, the table waits for its ready) or reads as a
  tell; the forged seal makes a talk-live duel in about half its scenarios. Centaurs about 55%. Judges: path 2.0,
  noise 1.3. Lower priority (coarse only if budget allows).

## Triage: which get games
- Coarse pass (2-3 natural deals each): Q1, Q2, Q3, Q4 and the control Q5 (2 games). Q6 only if budget allows.
- Fine pass: Q1 (a Sage/Moonsage duel and a Spooker-through-the-read scenario), and the next best two from the coarse
  pass, 2-3 scenarios each, 5 replays.
