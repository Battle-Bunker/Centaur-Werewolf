# Balance research: how to run it

The method and the measures are in [charter.md](charter.md); card theory in [card-calibration.md](card-calibration.md);
pre-registered predictions in [predictions.md](predictions.md); results, lessons and the running heuristics in
[log.md](log.md); proposed card/rule changes in [change-requests.md](change-requests.md). Per-count sessions write
`docs/research/results/players-N.md` and their own log; the hub integrates lessons into log.md.

Rule of the method: **predict first** (write it in predictions.md, dated, before any game), then test, then write
prediction vs result and the general lesson in the log. Random-play or random-vote simulation is never evidence.

## 0. Environment

```bash
# local backend (once per container; delete .convex/local/default/convex_local_backend.sqlite3 first if the schema changed)
CONVEX_AGENT_MODE=anonymous nohup npx convex dev > <scratchpad>/convex.log 2>&1 &
until grep -q "Convex functions ready" <scratchpad>/convex.log; do sleep 2; done
npx tsx sim/smoke.ts            # must print "all checks passed"
```
Never merge or edit shared/ or convex/ while games are running: the dev server hot-reloads and a schema/code change
crashes every live game. Merge only between runs.

## 1. A coarse batch (natural deals)

Tournament file (see sim/tournaments/research/coarse1.json):
```json
{ "timers": { "dusk": 60, "turn": 8, "day": 240, "vote": 60 },
  "agents": { "model": "opus", "effort": "medium" },
  "redeal": "wolfDealt",
  "tables": [ { "label": "A5#1", "deck": ["werewolf","werewolf","spooker","sage","rustler","farrier","sentry","centaur"],
                "center": 3, "players": ["Alder","Bryn","Cass","Dov","Esme"] } ] }
```
- `deck` = one card per player + the centre; `players` = names (any; 5-8 of them). Per-table `rules` override defaults
  (e.g. `{"daySwap": true, "thiefMinPlayers": 5}`). `"replays": R` expands a table into `#1..#R`.
- `redeal`: `"wolfDealt"` or `{ "dealtAnyOf": ["werewolf", "tag:wolf", "team:pyre"] }`: the runner deals before any agent
  exists and redeals until a player was dealt a match (logged as "discarded").
```bash
npx tsx sim/arena.ts sim/tournaments/research/<file>.json --out sim/runs/research/<name> --dry      # check
nohup npx tsx sim/arena.ts sim/tournaments/research/<file>.json --out sim/runs/research/<name> --concurrency 3 > sim/runs/research/<name>.log 2>&1 &
grep "done in\|FAILED" sim/runs/research/<name>.log
```
Concurrency 3 on a 4-CPU machine (an 8-player table is 8 `claude` processes). Cost so far: 5p about $2.5-3.5,
6p $3-4, 7p $4-6, 8p $5.5-7 per game; 4-6 minutes wall each. A re-run skips tables that already have result.json.

## 2. A fixed-scenario replay batch (the real test)

Each table carries a `scenario`; the runner creates a play-test table, fixes the deal and the night seed
(`setup.fixDeal { seats, cards, nightSeed }`), starts the game, queues EVERY seat's night plan with that seat's own key
during dusk, and launches the agents WITHOUT the night-planning tools, so only the day can differ.
```json
{ "timers": { "dusk": 8, "turn": 2, "day": 240, "vote": 60 },
  "agents": { "model": "opus", "effort": "medium" },
  "tables": [ { "label": "S1-A5-direction", "replays": 5, "center": 3,
    "deck": ["..."], "players": ["Cass","Alder","Esme","Bryn","Dov"],
    "scenario": { "seed": 7,
      "cards": ["werewolf","sage","sentry","spooker","werewolf", "farrier","centaur","rustler"],
      "plans": { "Alder": [{ "step": "read", "plan": { "branches": [], "otherwise": { "kind": "pick", "targets": [{ "k": "p", "i": 3 }] } } }],
                 "Bryn":  [{ "step": "stampede", "plan": { "branches": [], "otherwise": { "kind": "pick", "targets": [{"k":"p","i":0},{"k":"p","i":1},{"k":"p","i":4}] } } }],
                 "Cass":  [{ "step": "scent", "plan": { "branches": [], "otherwise": { "kind": "skip" } } }] } } } ] }
```
- `players` are in SEAT order (seat 0 first); `cards[i]` goes to `players[i]`, the rest to centre cards 1, 2, 3 in order.
- Plans: `{kind:"pick", targets:[slot...], role?}`, `{kind:"name", role}`, `{kind:"skip"}` (optional steps), `{kind:"do"}`.
  Slot `{k:"p", i:seat}` or `{k:"c", i:index}` where centre card 1 is index 0. A copier's plan for the copied role
  adds `"as": "<role>"`. Step ids: in shared/roles.ts (e.g. sage `read`, centaur `glance`, rustler `peek`/`trade`,
  farrier `peek`/`shoe`, spooker `stampede`, werewolf `scent`, eavesdropper `listen`, lure `lure`, echo `echo`,
  gleaner `glean`, embercarrier `carry`). Do NOT queue a step the role does not have (e.g. `scent` for a Moon-Thief or
  Eavesdropper): the server refuses it and the runner aborts that table. An undecided step is not fatal: it gets a
  seeded (so replayable) random move, and the runner logs a note.
- **Check every scenario for free before spending games:**
  `npx tsx sim/research/scenario-check.ts <file>.json [label,...]` runs each night with no agents and prints the night
  log and fingerprint. Read it: is that the night you meant?
- **Fingerprint:** each result carries `result.scenario.fingerprint` (deal + night seed + rules + every night event).
  metrics.ts groups by label and reports whether all replays share one fingerprint; a group with more than one is
  NOT a fixed scenario (fix the plans).
- To skip queued tables of a run already started, create `<out>/<label>#k/result.json` (any JSON without `result`).

## 3. Judges and metrics

```bash
npx tsx sim/research/judge.ts sim/runs/research/<name> [--only label,...] [--judges 2] [--concurrency 4]
npx tsx sim/research/metrics.ts sim/runs/research/<name> [more dirs] --json <out>.json > <out>.txt
npx tsx sim/research/classes.ts 6 werewolf,werewolf,phoenix,lure,sage,rustler,sentry,centaur,herder --require tag:wolf --key werewolf,phoenix,lure,sage
```
- Judges: two independent `claude -p` calls per game, public transcript + post-game truth only, fixed rubric (charter
  I3); ~$0.05-0.08 each; writes `<game>/judge-1.json`, `judge-2.json`; skips games already judged.
- metrics.ts prints per group: I1 winners/eliminated/how-won with entropy and minority count, I2 concentration c and
  bands, I3 judge means and agreement, I4 verdict (only for 2+ replays of one fingerprint), diagnostics (messages,
  discussion length, forced night moves, cost, wall time).
- To read a game: `npx tsx -e 'import {loadGames,publicTranscript,truth} from "./sim/research/game"; const g=loadGames(["sim/runs/research/<name>"]).find(g=>g.label==="<label>")!; console.log(truth(g)); console.log(publicTranscript(g))'`;
  one agent's reasoning: `npx tsx sim/transcript.ts <game>/<Name>.jsonl`; debriefs: `<game>/<Name>.debrief.json`.

## 4. Result files per table (`sim/runs/research/<name>/<label>/`)

table.json (room, keys, config) · run.json (scenario, timers, agents) · result.json (host's final view: `result` with
seats, votes, night log, scenario fingerprint; `chat`; `proclamations`; `marks`) · timeline.json (phase times, ready and
vote events, message times) · agents.json (per seat model, cost, tokens, segments) · `<Name>.jsonl` (full stream) ·
`<Name>.debrief.json` · judge-k.json.

## 5. Pitfalls already hit

- **Vote timer 60 s for AI tables** (a harness setting, not a rules change): one AI turn takes 15-40 s; at the human
  default of 20 s missed votes become random and add noise.
- **Discussions are short:** Opus tables mark ready after ~5 messages each; discussion 46-180 s (median ~90 s). That is
  their natural play; note it when comparing to human expectations.
- **Shim:** agents reach the server through sim/mcp-shim.ts (serves `room_wait` locally) because the local backend has
  ~4 HTTP action slots; do not use `--direct` with several tables.
- **Play-test flag:** scenario tables must be play-test tables (the runner sets it); 1-2 s turn timers are refused
  otherwise ("Between 5 and 120 seconds").
- **Agents need time to start** (~10-20 s): at a scenario table they join during the short night and just wait.
- **Natural deals rarely produce the class a roster was built for** (coarse pass 1: the B5 duel 1 of 2, the C6 mirror
  0 of 2). Construct the scenarios you want to measure, and check them with scenario-check.ts.
- An agent that misses its night plan gets a random move ("random: out of time" in the night log) at coarse tables:
  count them (metrics `forced night moves`).
- `git commit` may be denied in a session; keep the record on disk (log, predictions, results files).
