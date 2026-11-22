# 7 players: requests to the hub (changes to existing cards, rules or the harness)

The 7-player session does not modify existing cards or the runner; these are requests with the evidence behind them.

## R1. Harness: a Hush cut removes an AI player for good (bug; FIXED on develop, verified 13:40)
Evidence: coarse G7#1 (sim/runs/p7-coarse/G7#1, Dov.jsonl). During the cut the MCP endpoint answers a bare 503; the
`claude -p` client then drops the werewolf MCP server ("its tools are no longer available to me"), ends its session, and
the runner's resumes cannot reconnect. The cut player stayed silent for the rest of the day, the discussion ran to its
timer (he could not mark ready) and his vote was random. With people, a cut lasts 60 s; with AI players it is a
permanent removal plus a random vote: outcome noise the game does not have.
Request: the shim turns an upstream 503 on a tool call into a tool-level error result (isError, "unreachable: the server
could not be reached; try again shortly"), so the client keeps the server; and arena-player.md says to keep calling
`room_wait` after such errors. Until then, Hush results from AI tables are not evidence about the Hush.

## R2. Sentry + census give a dealt wolf too clean a reason to defect (observation, no change proposed yet)
Evidence: F-S7-confession, 5/5 replays: the dealt wolf Gale, told publicly by the Sentry that his card moved, confessed
and named his packmate every time; the Centaurs won 4 of 5 by following him. Not a sweep and judged talk-live (path
3.8), but the wolves' only counter (their own partner's lies) rarely survives. If later data show sweeps in
"Sentry reports a dealt wolf's card moved" scenarios, the smallest change is a Sentry that reports only its own card
and ONE chosen neighbour (less public certainty about a specific wolf's card).

## R3. Rosters: drop the lone Herder at 7 or pair it with a twin
The S7 deck (setup game) has a lone Herder; in every recommended 7-player roster I pair the Herder with a Stray or Grey
Herder (K7) or leave it out (P7, G7). Hub heuristic 6 and the evidence principle.

## R4. Twins that are not pack collide with the pack (evidence for the hub's packCovers and my Grey Herder)
F-K7-duel: 3 of the 4 Centaur wins came from the lone Werewolf and the Stray Herder (who do not know each other)
claiming the same role or contradictory roles. Amendment A1 (Grey Herder, a twin that wakes with the pack) is under
test in my batch 2; if it works, consider making it the default Stray Herder behaviour, and the same for the Moonsage.

**R1 status (13:45).** The lead's shim fix (1139d4a) and my equivalent one (057a472, superseded by the lead's wording in
the merge) were verified twice with a forced 60 s cut of the Sage 20 s into the day (sim/research/force-cut.ts,
sim/tournaments/players-7/hush-check.json): the cut agent received repeated "could not be reached" errors, kept retrying,
posted again when the minute was over ("Back. My connection was cut, most likely by the Hush") and cast its own vote.
Hush results from games before the fix (G7#1) remain contaminated.

## R5. Latency tell confirmed at 7 (data for the opening-statements rule)
Over my 57 games (all before opening statements existed): median first day message 16 s for players dealt a
Centaur-team card (218 first messages) vs 28 s for players dealt a defector card (181). A regex over the chat finds
"claimed last / stalled / waited until others claimed" arguments in 17 of 57 games. Every players-7 result is
"opening statements OFF".
