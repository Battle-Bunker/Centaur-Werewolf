# Architecture

## The game

`players + centre` cards are dealt (3 to 6 centre cards, a room setting): one to each seat, the rest face down in the
centre. The night runs as a fixed public timetable of equal-length turns: dusk, then every night role in the deck in
wake order, whether a player holds it or not. Dawn publishes the proclamations and the egg and tells a bitten player or
an Imago. Then the day: talk, a Moon-Thief may queue a swap, vote. You win or lose by the card you **hold** at the count
(unless you were bitten or became an Imago), which may not be the card you were dealt.

The rules come from [docs/design/synthesis.md](design/synthesis.md) ("Recommendation"): defector mechanics for the
Werewolf team and a third faction, the Wildwood, whose creatures win or lose alongside the main result.

### Roster and wake order

| Wake | Role | Team | Tags | Night | Win / notes |
| --- | --- | --- | --- | --- | --- |
| 8 | Elderbark | Wildwood | wild | Learns which seats were dealt creatures (Moth included) | Wins if not eliminated and no other creature or Imago is; eliminated, no other creature wins |
| 10 | Werewolf (×3) | Werewolf | wolf pack | Pack + census; alone: scents a team | Team |
| 11 | Stalking Horse | Werewolf | pack | Pack + census; alone: scents a team | Not a Werewolf. Eliminated: the Werewolf team wins (`decoy`) |
| 12 | Glamour | Werewolf | wolf pack | Pack + census; one card shows a chosen deck role to every look until dawn | Team |
| 13 | Moon-Thief | Werewolf | wolf pack | Pack + census | Day: queues a swap of two other players' cards, made as the votes lock (`dayPower`) |
| 15 | Tracker | Werewolf | wolf pack | Pack + census; one information role's seat | Team |
| 20 | Whisperer | Werewolf | | Told one Werewolf's seat | Team |
| 25 | Cuckoo | Wildwood | wild | Looks at a card; lays a public egg on a seat (random at dawn if unheld) | Holder wins if the egged seat falls and they do not |
| 30 | Sage | Centaur | seer | Reads a player's card | Team |
| 35 | Centaur (×4) | Centaur | | Looks at a centre card | Team |
| 40 | Herald | Centaur | seer | Proclaims a centre card (two with 5+ centre), published at dawn | Team |
| 42 | Forger | Werewolf | | Sees the Herald's proclamation; forges as many, published with it | Needs a Herald and dawn proclamations |
| 45 | Rustler | Centaur | | Peeks at a player; may trade (conditional) | Team |
| 50 | Farrier | Centaur | | Peeks at a centre card; may give it to self or clockwise | Team |
| 55 | Spooker | Werewolf | | Rotates three cards, unseen | Team |
| 80 | Herder | Centaur | seer | Counts wolf cards in the centre (truth, never glamoured) | Team |
| 85 | Oxpecker | Wildwood | wild | Looks at a player and bonds to that seat | Holder wins exactly when the bonded seat wins (after the curse) |
| 90 | Sentry | Centaur | | Learns whether own/neighbours' cards moved | Team |
| 93 | Eavesdropper | Werewolf | wolf pack | Pack + census; names a non-pack night role and copies its holder's night (or a ghost result) | Team |
| 96 | Biter | Werewolf | wolf pack | Pack + census; looks at a true card, may bite (conditional): the seat joins the Werewolf team at dawn | Team |
| – | Chiron | Centaur | | – | Vote counts twice |
| – | Signet | Centaur | | – | One signed chat message |
| – | Moth | Centaur | wild | – | If its dealt seat's card moved: that seat is an Imago (wins only if eliminated) (`metamorph`) |
| – | Sporeling | Wildwood | wild | – | Holder wins if eliminated; their voters lose (`curse`) |

Retired: Sagittarius (a published role in substance), Augur (folded into the Cuckoo), Hybrid (folded into the Oxpecker)
and the Forger's unsigned chat message (`chat: "unsigned"` stays a primitive no card uses; its command is gone).

### Rule settings

Table-wide variants are room settings (`shared/settings.ts`), set by the host with `setup.setRule { rule, value }` in
the lobby, shown in both views and described in the MCP rules text. A game copies them into `GameState.rules` at the deal.

| Rule | Default | Values | What it does |
| --- | --- | --- | --- |
| `bloodPrice` | true | bool | Centaurs win only if more wolf cards than Centaur-team players are eliminated |
| `census` | `"all"` | all / three / off | What the pack learns of the roles dealt to the centre |
| `dawnProclamations` | true | bool | Proclamations published together at dawn in random order (required with a Forger) |
| `randomVotesCurse` | false | bool | Whether a vote cast at random triggers the Sporeling's curse |
| `biteNamesBiter` | true | bool | Whether the bitten player is told the Biter's seat |
| `eavesdropGhost` | true | bool | Unheld named role: a ghost result from the Eavesdropper's seat, or nothing |
| `thiefMinPlayers` | 7 | 3–12 | Smallest table that may hold a Moon-Thief |
| `eliminationVotes` | 2 | 2–4 | Votes needed (with the most votes) to be eliminated |

`LEGACY_RULES` (Blood Price, census and dawn proclamations off) is the control arm for play-tests.

### How a game is decided (`resolveVote`)

1. **Swap.** The Moon-Thief's queued swap is applied (`endDay`, before counting).
2. **Tally.** Votes weighted by the voter's held card; eliminated = all seats tied on the most votes, if ≥ `eliminationVotes`.
3. **Teams.** Bitten seat → Werewolf team, no creature rules; Imago → Wildwood; everyone else → their held card's team.
4. **Main result.** (a) a held `decoy` (Stalking Horse) eliminated → its team wins; (b) no wolf card held → Centaurs win
   if nobody fell, else surviving Werewolf-team players win (or nobody); (c) Centaurs win iff W > C under Blood Price
   (W ≥ 1 without), W = wolf cards eliminated, C = Centaur-team players eliminated; otherwise the Werewolf team wins.
5. **Creatures.** Sporeling holder / Imago win if eliminated; Cuckoo holder if the egged seat fell and they did not;
   Elderbark holder if alive and no other creature fell; Elderbark eliminated → no other creature wins.
6. **Curse.** Seats whose own vote (random ones only under `randomVotesCurse`) went to an eliminated Sporeling holder lose.
7. **Oxpecker.** Wins if its bonded seat is a winner after step 6 and the Elderbark did not fall; then the curse applies to it.
8. **Report.** `Outcome.why[seat]`: one sentence per seat, "Won: …" or "Lost: …".

## Roles are data

A role's night action is a script of **steps**; a step may ask for targets (`pick`), name a role (`names: "deck" |
"nightNonPack"`), be optional, apply only when alone (`onlyIfAlone`), and applies **effects**:

| Effect | Meaning |
| --- | --- |
| `look` | See the card, or its team, at slots, as it is at that moment (glamour fools everyone but the Werewolf team) |
| `swap`, `rotate` | Cards move, carrying their tokens (glamour) with them |
| `learnSeats` | Which other seats were dealt a tagged role (all, or a random few) |
| `learnMoved` | Whether nearby cards moved tonight |
| `announce` | A public proclamation (at dawn under `dawnProclamations`) |
| `count` | How many tagged cards lie in the centre (truth) |
| `census` | The roles dealt to the centre, per the `census` rule |
| `glamour` | A token on the picked card: looks show the named role until dawn |
| `witness`, `forge` | See a role's proclamations tonight; add a forged one published as that role's |
| `overhear` | Copy what the holder of the named role learned (first clockwise), or a ghost result |
| `bite` | The target seat joins the Werewolf team at dawn unless its card is already on it |
| `mark` | Bind a seat to the actor's dealt card (public at dawn, or private): the egg, the bond |

Role flags the resolution reads: `win` (`eliminated`, `markEliminated`, `markWins`, `keystone`), `decoy`, `curse`,
`metamorph`, `vote` (weight; `protectsTarget` and `takesTargetDown` remain primitives no card uses), `chat`, `dayPower`.
Tags: `wolf` counts as a Werewolf at the count; `pack` wakes with the pack and gets the census; `seer` is the
Tracker's quarry; `wild` is on the Elderbark's map.

Slots are named relative to the actor (`self`, the nth pick of this step, the nth pick of an earlier step, the next
seat clockwise from another slot), so one engine runs every role. Because steps are data, the plan builder, the
forced-random mover, the journal, the table's click targets and the post-game log need no role-specific code.
`dawn()` runs after the last turn: random egg for an unheld Cuckoo, Imagos, the bite notice, shuffled proclamations.

**To add a role:** add an entry to `ROLES` in `shared/roles.ts` and a `public/art/<id>.webp` (512×512). If it needs a
new primitive, add an `Effect` kind, its case in `applyEffect` (`shared/engine.ts`) and a sentence in `shared/text.ts`.
A queued step that turns out not to happen logs a `void` entry, and a conditional decision records the branch it took
(`LogEntry.cond`). What only the post-game log may show goes in `LogEntry.hidden` (views strip it until the end).

## Night timing and plans

At the deal the server fixes the whole timetable (`game.turns`) and schedules the end of the first turn. When a turn
begins, each actor's script runs as far as their queued plan decides it (`advance`); when the turn's time is up,
`advance(..., { force: true })` gives every undecided step a uniformly random legal decision. Then the next turn begins.

A plan is per step:

```ts
interface StepPlan {
  branches: { roles: RoleId[]; decision: Decision }[]; // first branch naming the card seen earlier wins
  otherwise?: Decision;                                // everything else; alone, an unconditional decision
}
```

`night.planStep` is the only way to decide, before the turn or during it. During the actor's own turn it runs at once,
so "queue" and "decide live" are the same command.

Conditions are sets of cards, not fixed categories. "Werewolf team" is a shortcut that ticks that team's cards; any
card can then be unticked, which returns it to Otherwise, and ticking a card in one branch takes it from any other.
Outcomes no branch or Otherwise covers are asked live.

## Secrecy

The game lives in one document (`rooms.game`). `convex/rooms.ts` `view` (the app) and `convex/agent.ts` `view` (MCP)
are the only readers, filtered for the caller: your dealt role, plan, progress and own log entries (with `hidden`
stripped), dawn notices addressed to you (bitten, Imago), proclamations once published (without the forged flag or
real turn), public marks after dawn, and your own queued day swap. Other roles, the centre, glamours, forgeries,
the eavesdrop source, the day swap, the full log and who voted for whom are returned only once the phase is `ended`.

**Play-test tables** (`room.create { playtest: true }`, shown to everyone as a badge) let the host fix the next deal
(`setup.fixDeal { seed?, seats?, cards? }`, `setup.clearDeal`), abandon a round (`game.abandon`), and see the deal in
the app view (`game.playtestDeal`, host only; never in the MCP view). Other players learn only that a deal is fixed.
Deals draw seating and cards from independent generators (`secureRng`, or two streams of the seed);
`sim/deal-uniformity.ts` checks uniformity through the real server.

Identity is a random token kept in the browser's localStorage. There are no accounts yet.

## Commands

`shared/commands.ts` declares every operation: id, title, a description for a model, a tooltip for a person, keywords,
group, a zod parameter schema, the phases it applies in, who may call it, whether it needs confirming, and an optional
`available(ctx, args)` check.

```
                         shared/commands.ts
                                 │
        ┌──────────────┬─────────┴────────┬──────────────────┐
        ▼              ▼                  ▼                  ▼
 convex `run`     command palette    CommandButton      toolDefinitions()
 (the only        (lists, dims,      (enabled iff       (MCP tools)
  mutation)        explains)          available)
```

- **Server.** `commands:run({ id, token, code, args })` validates `args` with the registry's schema, builds the
  `CommandContext` from the room, checks `availability`, then calls the handler. Nothing else mutates the game except
  the two timers.
- **Palette.** Lists the registry, hides what can never apply to this viewer, dims what cannot run now and says why.
  `src/palette/pages.ts` describes how a person supplies each command's arguments.
- **Buttons.** `<CommandButton id=…>` and `useCommand(id)` use the same `availability`, so a button, its palette row
  and the server cannot disagree.

### MCP

`convex/mcp.ts` serves the registry as MCP tools over streamable HTTP (`POST /mcp`), authenticated by key or OAuth
(`convex/auth.ts`) and narrowed by grant (read / act / host). The tool list is static per grant; a tool that cannot
run now answers with the reason. Every write goes through `dispatch`. Reads: `room_view { compact?, chatSince? }`
(`convex/agent.ts`: every top-level key always present, seats paired with names, caveats for the deck, a countdown to
your own turn, per-seat `why` after the game), `room_wait { version, until: any|phase|chat|turn, seconds }` (versions
are named parts that do not tick on the clock or others' turns; `versionKey` in `shared/commands.ts`), `rules_read`
(rules text with the resolution order and this table's rule settings).

## Layout

```
┌ header: brand · room · [Search or do…  Ctrl K][☰] ───────────────────────────┐
├ turn track (same for everyone) ───────────────────────────┬ side panel ──────┤
│                                                           │ setup / role and │
│   the table: seats on an ellipse, you at the bottom,      │ plan / journal / │
│   centre cards in the middle                              │ results and log  │
│                                                           │ (can be hidden)  │
├ assistant dock: collapsed bar, opens to an adjustable height ────────────────┤
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Assistant.** `AssistantDock` in `Shell.tsx` is the panel: toggled by `ui.toggleAssistant` (`A`), resized by
  dragging its top edge, height remembered per browser. It is a placeholder until the assistant exists.
- **Video.** Each seat's `.seat-media` is a 4:3 box sized from the table's dimensions and the player count. A video
  element replaces the avatar inside it; the card thumbnail, notes and name bar are overlays and stay. Hovering a seat
  enlarges it; an active-speaker class can reuse that rule. Hiding the side panel gives the table the full width.

## Known limits

- Countdowns use each browser's clock against server timestamps; a badly wrong clock shows a wrong countdown (the
  server's schedule is unaffected).
- A player who leaves mid-game keeps their seat; their moves and vote become the forced random ones.
- Colours: forest green `#1f5d3b` and royal purple `#5b2c91` were chosen to fit the brief; swap the two variables at
  the top of `src/styles.css` for the exact brand values.
