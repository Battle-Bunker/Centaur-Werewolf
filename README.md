# Centaur Werewolf

A one-night hidden-role game for 3 to 12 players, built on [Convex](https://convex.dev) and React. Werewolves hide
among villagers and centaurs; everyone acts once in the night, talks in the day, and votes once.

What is different from a table-top night:

- **Timed night turns.** Every role in the deck gets one turn of exactly the same length, whether a player holds it or
  it lies in the centre. Everyone sees which turn is happening and the same countdown.
- **Queued moves.** Decide your night action before your turn; it plays by itself. A step that follows a peek can
  branch on what you will see ("if Werewolf team → keep mine, otherwise → trade").
- **Forced random moves.** Anything still undecided when your turn ends is chosen at random, and marked so in the log.
- **A journal.** What you did and learned stays on screen through the day, pinned to the seats it concerns.
- **One command registry.** Every action is declared once and reaches the server, the command palette (`Ctrl/⌘ K`),
  the buttons and (planned) MCP tools from that one declaration.

![The night: a queued conditional plan beside the table](docs/screenshots/night-plan.webp)

More: [command palette](docs/screenshots/palette.webp), [seven players](docs/screenshots/night-seven.webp), [results and log](docs/screenshots/ended.webp).

## Run it

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` starts Convex and Vite together. The first run asks you to log in to Convex or choose a local
deployment, and writes `VITE_CONVEX_URL` to `.env.local`. Without an account:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev
```

Other scripts: `npm test` (engine and registry tests), `npm run typecheck`, `npm run build`.

To try it alone, create a room, add two or more practice bots, and start. Bots never decide anything, so they play the
forced random moves.

## Where things are

| Path | What |
| --- | --- |
| `shared/roles.ts` | Roles as data: team, night steps built from primitive effects, vote modifiers, win rule |
| `shared/engine.ts` | Pure game logic: deal, plans, running a night script, forced moves, the vote, who wins |
| `shared/commands.ts` | The command registry, `availability()`, and `toolDefinitions()` for MCP |
| `convex/commands.ts` | The single `run` mutation every change goes through |
| `convex/rooms.ts` | The per-viewer room query: the only place hidden information leaves the server |
| `convex/game.ts`, `convex/timers.ts` | Turn and day transitions, and their scheduled ends |
| `src/palette/` | The command palette and its argument pages |
| `src/components/` | Shell (layout), Table (the circle), PlanBuilder (conditional plans), SidePanel |
| `public/art/` | Character art |

See [docs/architecture.md](docs/architecture.md) for the design, the starting roles, how to add a role, and the plans
for MCP, the assistant panel and video.
