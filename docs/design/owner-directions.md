# Owner directions (binding requirements)

These directions came from the game's owner after the first tournament round. They are **requirements, not
experiments**: later sessions may retune them (every family can be switched on or off by deck composition or a room
setting) but must not remove them. Where they differ from [synthesis.md](synthesis.md), they take priority.

## 1. Duplicates and shadow twins

**Direction.** Any card may appear in a deck any number of times. Enemy-team near-duplicates of Centaur roles act in
the original's turn with the same action, so a defector can truthfully describe a real role's night.

**Realised.**
- Copy limits are 12 for every role (`deckProblem` checks only size and the deck rules). Several holders of one role all
  act in its turn, each with their own result.
- Cards are **instances** (`GameState.inst`, `cinst`, `instRole`): seat *s*'s dealt card is instance *s*, the *n*th
  centre card instance `players + n`. Anything bound to "the card" (the Cuckoo's egg, the Oxpecker's bond) is keyed by
  instance and follows that physical card. Bites are a list (several Biters).
- Twins (`RoleDef.twinOf`, `looksAs`): Moonsage (Sage), Dun Centaur (Centaur), Pale Herald (Herald), Dusk Rustler
  (Rustler), Stray Herder (Herder). `nightTurns` groups a twin under its original's turn, so the public timetable shows
  one turn for the pair (and the original's turn even when only the twin is in the deck).
  - **Passes** (`looksAs` = the original): Moonsage, Pale Herald, Stray Herder are allies that are *not* Werewolves and
    read as the original to every look (except Werewolf-team looks).
  - **Shows itself**: Dun Centaur and Dusk Rustler are Werewolves (they count for elimination and the Herder's count)
    that do not wake with the pack, and read as themselves.

## 2. Several card-stealing roles

**Direction.** Variants of "swap my card with another's", across teams, several per deck, mostly mandatory.

**Realised** (all mandatory, built from `swap` + `look`): Cutpurse (swap, then look at what you took), Pickpocket
(blind swap), Drifter (swap with a centre card, then look), Poacher (Werewolf-team; swap then look, so its team goes to
the victim), Latecomer (late, wake 88, blind). The Rustler remains "look, then choose". The room rule
`mandatorySteps` (default off) makes every optional step mandatory, for A/B tests of the round-1 finding that AI
players decline optional moves.

## 3. Deliberate noise at night

**Direction.** Defector cards corrupt what others see, the victim never told, as one parameterised primitive.

**Realised** as `Effect { kind: "distort"; target: "card" | "viewer"; value: "chosen" | "random" }`:
- Glamour (card, chosen; a Werewolf), Will-o'-Wisp (card, random), Mistweaver (viewer, chosen), Fogbank (viewer, random).
- **Card** distortions apply to every look at the card until dawn and **travel with the card** when it moves. A random
  card distortion draws its wrong role once, so every viewer agrees.
- **Viewer** distortions apply to every look that player takes **at a centre card** tonight (glances, peeks, a Herald's
  proclamation); a random one draws afresh at each look. Looks at players' cards are untouched.
- **Interactions.** Team-only looks show the team of the role seen. The Herder's count and every Werewolf-team look see
  the truth. A proclamation publishes what its maker saw. Conditional plans branch on what the viewer **saw**.
  **Stacking:** a passing twin's disguise, then the latest card distortion, then the viewer's veil (applied last).
- The post-game log shows both what was seen and what was true (`LogEntry.hidden.truth`, and the role a random
  distortion showed).

## 4. Forged authenticated messages

**Direction.** Defectors can post messages carrying a Centaur role's authentication, indistinguishable until the end.

**Realised.** An authenticated message has a claimed source role (`messages.seal`). Real and forged messages are the
same artefact (same text format, same seal, same note "The game confirms this was sent by the player DEALT <role>");
only a hidden `forged` flag differs, revealed after the game.
- Signet: free text (`chat.sendSigned`).
- Notary (new, a seer): reads a card at night; once in the day posts a **sealed report composed by the engine** from
  that look (`chat.sendReport`): "Sealed report: at night, <player> (seat n)'s card was <role>."
- Counterfeiter (Werewolf ally): once, `chat.forgeSeal` as Signet (text of its choosing) or as Notary (seat and role of
  its choosing), only for a sealing role in the deck.
- The Forger already forges the Herald's dawn proclamation. Rules text and caveats tell every player that seals and
  proclamations can be forged when a forger is in the deck.

## 5. A separate, timed vote phase

**Direction.** lobby → night → discussion → vote → ended, with its own timer and random votes for latecomers.

**Realised.** Phase `vote` with `settings.voteSeconds` (default 20, 5 to 120, `setup.setTimer { timer: "vote" }`).
Discussion ends by its timer, by the host (`day.endDiscussion`), or when every seated human is ready (`day.ready`,
public). `day.vote` works only in the vote phase (refused in discussion with how to get there). The vote ends on its
timer or once every seated human has voted; missing votes are uniformly random, kept in `forcedVotes`, marked
`voteWasRandom` and "did not vote in time: voted at random". Chat closes during the vote unless `chatDuringVote`. The
Moon-Thief's swap may be queued in discussion or the vote and fires as the vote ends, before counting.

## 6. The Hush, and presence as architecture

**Direction.** A wolf-side card cuts one player off for a minute, indistinguishable from their connection dropping until
the results; presence and every perceivable signal go through one central gate.

**Realised.**
- Presence: heartbeats (`presence.heartbeat` from the app every 5 s; every authenticated MCP call). One function,
  `liveness` (convex/presence.ts), derives online/offline (16 s without a heartbeat); both views use it.
- One gate, `gateOf(game, phase, rules, seat, now)`: may this player emit or receive now. A **seat effect** (a general
  time-window primitive, `Game.seatEffects`) of kind `blackout` closes it. The dispatcher refuses every call from a
  closed seat with the same unreachable error; the app view refuses to serve them; the MCP endpoint answers a bare 503.
  Their heartbeats fail too, so others see the normal lag before "offline" and the return on the first heartbeat after
  the window: exactly a real drop.
- Every registry command declares `perceivable` (a test fails if one does not); the dispatcher applies seat effects
  from that one property, so future commands cannot forget.
- The Hush: `day.cutLine { seat }`, once per game; rules `cutSeconds` (default 60) and `cutDuringVote` (default on).
  Revealed only in the results (`cutOff` per seat, a log line, `seatEffects`).
- Contract for future real-time channels (video, audio): see docs/architecture.md, "Presence and the gate".

## 7. Round-1 fixes folded in

`room_wait` holds a server slot for at most 4 s and says when no version was given; times are absolute (`endsAt`,
`serverNow`) and computed in the HTTP action; learnSeats lines use their label; every game records its deal seed
(shown after the game); forced random moves are uniform over every legal decision (ordered multi-target choices and
declining included); the MCP view lists centre-card targets in a per-viewer order and gives a ready-to-edit
conditional plan built from the legal choices.
