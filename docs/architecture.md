# Architecture

## The game

`players + 3` cards are dealt: one to each seat, three face down in the centre. The night runs as a fixed timetable of
turns (dusk, then every night role in the deck in wake order). Then the day: talk, vote, and the seat or seats with the
most votes are eliminated, unless nobody received more than one. You win or lose by the card you **hold** at the end,
which may not be the card you were dealt.

- The village wins if a Werewolf is eliminated. With no Werewolf at the table, it wins only if nobody is eliminated.
- The Werewolf team wins if no Werewolf is eliminated.
- An eliminated Glitch wins alone.

### Starting roles

These are a first set to make the game playable; they are meant to be replaced and extended.

| Role | Team | Night | Notes |
| --- | --- | --- | --- |
| Werewolf | Werewolf | Sees the pack. A lone wolf may scent one player's team | |
| Whisperer | Werewolf | Told one Werewolf at random | Human; wins with the wolves even if eliminated |
| Sage | Village | Reads one other player's card | |
| Rustler | Village | Peeks at a player's card, then decides whether to trade with it | Conditional |
| Farrier | Village | Peeks at a centre card, then may give it to any player | Conditional |
| Courier | Village | Passes one player's card to the next seat clockwise, unseen | Uses the circle |
| Wanderer | Village | Trades their card for a centre card; learns only its team | |
| Sentry | Village | Wakes last; learns whether their own and neighbours' cards moved | Uses the circle |
| Archer | Village | None | Vote counts twice |
| Villager | Village | None | |
| Glitch | Alone | None | Wins only by being eliminated |

## Roles are data

A role's night action is a script of **steps**; a step may ask for targets and applies **effects**:

| Effect | Meaning |
| --- | --- |
| `look` | See the card, or only its team, at one or more slots |
| `swap` | Two slots trade cards |
| `learnSeats` | Learn which other seats were dealt a tagged role (all, or a random few) |
| `learnMoved` | Learn whether nearby cards moved tonight |

Slots are named relative to the actor (`self`, the nth pick of this step, the nth pick of an earlier step, the next
seat clockwise from another slot), so one engine runs every role. Because steps are data, the plan builder, the
forced-random mover, the journal, the table's click targets and the post-game log need no role-specific code.

**To add a role:** add an entry to `ROLES` in `shared/roles.ts` and a `public/art/<id>.webp`. If it needs a new
primitive, add an `Effect` kind and its case in `applyEffect` (`shared/engine.ts`) and a sentence in `describe`
(`src/app/text.ts`).

### Room for richer roles

The model was shaped to reach what one-night hidden-role games commonly need. Present and working: multi-step actions,
optional steps, steps that depend on earlier picks and on what was seen, passive knowledge, position-based effects,
vote weight, team wins and lone wins, acting by dealt role while winning by held role. The vote count also handles a
role that protects whoever it votes for and a role whose death takes its vote target down, but no starting role uses
those two yet and they have no tests. Not built yet, with where each would go:

- **Copying another role's action** (wake, look at a card, then act as it): an `adopt` effect that appends the seen
  role's steps to the actor's script in `advance`. Plans for adopted steps can only be made live.
- **Public reveals and tokens** (a card turned face up, a shield that blocks swaps): a `faceUp`/`tokens` field on
  `GameState`, checked in `applyEffect`, shown by `Table`.
- **Steps with more than one target**: supported by the engine and registry; the plan builder's chips currently set
  one target per click.
- **Extra cards or conditional wakes** (a role that only wakes if another is in play): an `onlyIf` predicate beside
  `onlyIfAlone`.

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

The game lives in one document (`rooms.game`). `convex/rooms.ts` `view` is the only reader that returns it, filtered
for the caller: your dealt role, your plan, your progress and your own log entries. Other roles, the centre, the full
log and who voted for whom are returned only once the phase is `ended`.

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
 (the only        (lists, dims,      (enabled iff       (MCP tools; planned)
  mutation)        explains)          available)
```

- **Server.** `commands:run({ id, token, code, args })` validates `args` with the registry's schema, builds the
  `CommandContext` from the room, checks `availability`, then calls the handler. Nothing else mutates the game except
  the two timers.
- **Palette.** Lists the registry, hides what can never apply to this viewer, dims what cannot run now and says why.
  `src/palette/pages.ts` describes how a person supplies each command's arguments.
- **Buttons.** `<CommandButton id=…>` and `useCommand(id)` use the same `availability`, so a button, its palette row
  and the server cannot disagree.

### MCP (planned, not implemented)

`toolDefinitions()` already returns each server command as `{ name, title, description, inputSchema, annotations }`.
The remaining work:

1. **Credential.** A command `room.createAgentKey` that mints a key bound to one room and one seat, with a grant of
   `read` or `act`. `run` accepts a key in place of the browser token and refuses commands above its grant.
2. **Server.** A Convex HTTP action speaking MCP over streamable HTTP: `tools/list` returns `toolDefinitions()`
   filtered by `availability` for the key's seat; `tools/call` forwards to `run`.
3. **Reading.** One read tool, `room_view`, returning the same filtered view the app gets, so an agent sees exactly
   what its seat may see.
4. **The embedded assistant** uses the same tool list in-process, so the bottom panel and a remote agent have
   identical powers.

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
