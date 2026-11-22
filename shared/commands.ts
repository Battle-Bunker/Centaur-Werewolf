/**
 * The command registry: every operation a person (or, later, an assistant over MCP) can perform, declared once.
 *
 *  - the server runs every `runs: "server"` command through ONE Convex mutation (convex/commands.ts `run`), which
 *    checks `availability` and validates `params` from this file before calling the handler;
 *  - the command palette lists exactly these entries, dimming the ones `availability` rejects, with its reason;
 *  - buttons use `useCommand(id)`, so a button is enabled exactly when the palette row and the server agree it is;
 *  - `toolDefinitions(grant)` turns the same entries into the MCP tools convex/mcp.ts serves to connected assistants.
 *
 * Nothing here imports Convex or React.
 */
import { z } from "zod";
import { deckProblem } from "./engine";
import { CENTER_DEFAULT, CENTER_MAX, CENTER_MIN, ROLE, ROLES, type RoleId } from "./roles";
import { DEFAULT_RULES, RULE_DEFS, ruleValueProblem, type Rules } from "./settings";

export type Phase = "home" | "lobby" | "night" | "day" | "vote" | "ended";
export type Caller = "anyone" | "member" | "seated" | "host";
export type Group = "play" | "talk" | "room" | "setup" | "connect" | "view" | "help";
/** The surfaces generated from the registry besides the server itself and the app's buttons. */
export type Surface = "palette" | "mcp";
/** What an assistant's connection may do: only look, play as the player, or also run the table as host. */
export type Grant = "read" | "act" | "host";
export const GRANTS: Record<Grant, string> = { read: "Look only", act: "Play for me", host: "Play and run the table" };
export type Effect = "read" | "write" | "destructive";
/** none: runs at once. inline: the palette asks for a second Enter and names the consequence. */
export type Confirm = "none" | "inline";

/** Everything availability depends on. The client builds it from its room subscription, the server from the room. */
export interface CommandContext {
  phase: Phase;
  member: boolean;
  /** Holds a seat in the game in view (a member who joined mid-game watches, unseated). */
  seated: boolean;
  host: boolean;
  players: number;
  /** How many cards the centre holds at this table. */
  center: number;
  deck: RoleId[];
  /** Night: the ids of the viewer's own steps that still take a decision. */
  openSteps: string[];
  /** Night, copiers: the roles the viewer may still plan for ("any" before copying; the copy's role while its script is open). */
  adoptOpen: RoleId[] | "any";
  voted: boolean;
  /** The unused once-per-game chat power of the card the viewer was dealt, if any. */
  chatPower: "signed" | "unsigned" | "report" | "forge" | null;
  /** The unused day power of the card the viewer was dealt, if any (the Moon-Thief's swap, the Hush's cut). */
  dayPower: "swap" | "cut" | "ember" | null;
  /** Day: the viewer has said they are ready to vote. */
  ready: boolean;
  /** The viewer has a day swap queued. */
  swapQueued: boolean;
  /** A play-test table: chosen when the room was created, shown to everyone, and the only kind where the deal can be fixed. */
  playtest: boolean;
  /** The table's rule settings. */
  rules: Rules;
}
export const HOME_CONTEXT: CommandContext = { phase: "home", member: false, seated: false, host: false, players: 0, center: CENTER_DEFAULT, deck: [], openSteps: [], adoptOpen: [], voted: false, chatPower: null, dayPower: null, ready: false, swapQueued: false, playtest: false, rules: DEFAULT_RULES };

export type Availability = { ok: true } | { ok: false; reason: string; hidden?: boolean };
const OK: Availability = { ok: true };
const no = (reason: string, hidden = false): Availability => ({ ok: false, reason, hidden });

export interface CommandDef<P extends z.ZodObject = z.ZodObject> {
  /** `namespace.verb`. */
  id: string;
  /** Verb first, for a person: "Start the game". */
  title: string;
  /** For a model: what it does, when to use it, what comes back. */
  description: string;
  /** For a person, one sentence. */
  tooltip: string;
  /** Palette search aliases. */
  keywords: string[];
  group: Group;
  params: P;
  /** The phases it is offered in. */
  contexts: Phase[];
  caller: Caller;
  effect: Effect;
  confirm: Confirm;
  /** server: the Convex `run` mutation. client: a view operation on this person's own layout. */
  runs: "server" | "client";
  shortcut?: string;
  /** Why it is not offered in a phase it leaves out, where the general "Only …" would not say. Such rows are dimmed, not hidden. */
  contextReasons?: Partial<Record<Phase, string>>;
  /** Surfaces it is left off, and why. `consent`: authorising an assistant must be a person's own click. */
  surfaces?: { except: Surface[]; because: "consent" | "shown" | "agent" };
  /** Arguments that are a seat number: the palette and the MCP description pair them with names. */
  seatArgs?: string[];
  /**
   * Whether running it produces a signal other players can perceive in real time (a chat line, a ready or "has voted"
   * mark, presence, and later typing, reactions, video, audio). Required on every command: the dispatcher enforces
   * seat effects that silence a player (convex/presence.ts) from this one property, so a new command cannot forget.
   */
  perceivable: boolean;
  /** Checks beyond phase and caller. Pure. */
  available?(ctx: CommandContext, args?: Record<string, unknown>): Availability;
}

const define = <P extends z.ZodObject>(c: CommandDef<P>): CommandDef<P> => c;
const none = z.object({}).strict();
const name = z.string().trim().min(1).max(24).describe("A display name, 1 to 24 characters.");
const roleId = z.enum(ROLES.map(r => r.id) as [string, ...string[]]).describe("A role id, e.g. \"werewolf\".");
const slot = z.object({ k: z.enum(["p", "c"]).describe("p: a player's seat. c: a centre card."), i: z.number().int().min(0).max(63).describe("The seat number (from 0), or the centre card's index (from 0).") }).strict();
const seatNo = (what: string) => z.number().int().min(0).max(63).describe(`${what}: a seat number from the room view's players list (seats count from 0).`);
const decision = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pick"), targets: z.array(slot).min(1).max(4).describe("Exactly targetsNeeded slots, copied from legalTargets."), role: roleId.optional().describe("Only at a step that also names a role (legalRoles): the role to name.") }).strict(),
  z.object({ kind: z.literal("name"), role: roleId.describe("A role from legalRoles.") }).strict(),
  z.object({ kind: z.literal("do") }).strict(),
  z.object({ kind: z.literal("skip") }).strict(),
]);
const DECISION_SHAPES = '{ "kind": "pick", "targets": [{ "k": "p", "i": 2 }] } (a seat), { "kind": "pick", "targets": [{ "k": "c", "i": 0 }] } (a centre card, counted from 0), { "kind": "pick", "targets": [...], "role": "sage" } (a step that also names a role), { "kind": "name", "role": "sage" } (a step that only names a role), { "kind": "do" } or { "kind": "skip" }';
const ruleValue = z.union([z.boolean(), z.number().int(), z.string()]);
const stepPlan = z.object({
  branches: z.array(z.object({ roles: z.array(roleId).min(1), decision }).strict()).max(12)
    .describe("Conditional decisions, tried in order: the first whose roles include the card seen at the earlier step applies."),
  otherwise: decision.optional().describe("The decision for every outcome no branch names. Alone, it is an unconditional decision."),
}).strict();

export const TIMERS = {
  dusk: { label: "Dusk (read your card, queue your move)", min: 5, max: 120 },
  turn: { label: "Each night turn", min: 5, max: 120 },
  day: { label: "Day discussion", min: 30, max: 1800 },
  vote: { label: "Vote", min: 5, max: 120 },
} as const;

export const COMMANDS = [
  // ── room ──
  define({
    id: "room.create", perceivable: false, title: "Create a room", group: "room", runs: "server", effect: "write", confirm: "none", caller: "anyone", contexts: ["home"],
    description: "Creates a new room with the caller as host and returns its four-letter code. Others join with the code. `playtest: true` makes a play-test table (shown to everyone as such): its host can fix the deal and sees every card.",
    tooltip: "Open a new table and invite others with its code.", keywords: ["new", "host", "table", "game"],
    params: z.object({ name, playtest: z.boolean().optional().describe("A play-test table: everyone sees the badge; the host may fix the deal and sees all cards. Default false.") }).strict(),
  }),
  define({
    id: "room.join", perceivable: true, title: "Join a room", group: "room", runs: "server", effect: "write", confirm: "none", caller: "anyone", contexts: ["home"],
    description: "Joins the room with this code under a display name. Joining a game in progress seats the caller as a spectator until the next round.",
    tooltip: "Sit down at a table using its code.", keywords: ["enter", "code", "sit"],
    params: z.object({ code: z.string().trim().length(4).describe("The room's four-letter code."), name }).strict(),
  }),
  define({
    id: "room.rename", perceivable: true, title: "Change your name", group: "room", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby"],
    description: "Changes the caller's display name in the room.", tooltip: "Change the name others see.", keywords: ["nickname", "rename"],
    params: z.object({ name }).strict(),
  }),
  define({
    id: "room.leave", perceivable: true, title: "Leave the room", group: "room", runs: "server", effect: "destructive", confirm: "inline", caller: "member", contexts: ["lobby", "ended"],
    description: "Removes the caller from the room. If the host leaves, the longest-seated person becomes host.",
    tooltip: "Give up your seat at this table.", keywords: ["exit", "quit"], params: none,
  }),
  define({
    id: "room.addBot", perceivable: true, title: "Add a practice bot", group: "room", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Seats a bot that never decides anything, so every one of its night moves and its vote are the forced random ones. For trying the game alone.",
    tooltip: "Fill a seat with a bot that plays at random.", keywords: ["ai", "fill", "seat", "practice"], params: none,
    available: ctx => (ctx.players >= 12 ? no("The table is full (12 seats).") : OK),
  }),
  define({
    id: "room.remove", perceivable: true, title: "Remove a player", group: "room", runs: "server", effect: "destructive", confirm: "inline", caller: "host", contexts: ["lobby"],
    description: "Removes another player or a bot from the room.", tooltip: "Take a player or bot off the table.", keywords: ["kick", "bot"],
    params: z.object({ player: z.string().describe("The player's id, from the room view.") }).strict(),
  }),
  // ── setup ──
  define({
    id: "setup.addRole", perceivable: true, title: "Add a role to the deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Adds one copy of a role to the deck. Arguments: { \"role\": <role id> }. The deck must hold one card per player plus the centre cards.",
    tooltip: "Put one more copy of a role in the deck.", keywords: ["card", "include", "deck"],
    params: z.object({ role: roleId }).strict(),
    available: (ctx, args) => {
      const r = args?.role as RoleId | undefined;
      if (r && ROLE[r] && ctx.deck.filter(x => x === r).length >= ROLE[r].max) return no(`The deck already has every copy of ${ROLE[r].name}.`);
      return OK;
    },
  }),
  define({
    id: "setup.removeRole", perceivable: true, title: "Remove a role from the deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Removes one copy of a role from the deck. Arguments: { \"role\": <role id> }.", tooltip: "Take one copy of a role out of the deck.", keywords: ["card", "exclude", "deck"],
    params: z.object({ role: roleId }).strict(),
    available: (ctx, args) => {
      const r = args?.role as RoleId | undefined;
      if (r && !ctx.deck.includes(r)) return no("That role is not in the deck.");
      return ctx.deck.length ? OK : no("The deck is empty.");
    },
  }),
  define({
    id: "setup.useRecommended", perceivable: true, title: "Use the recommended deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Replaces the deck with a balanced one for the current number of players.",
    tooltip: "Fill the deck with a balanced set for this many players.", keywords: ["preset", "default", "auto", "deck"], params: none,
    available: ctx => (ctx.players < 3 ? no(`Needs 3 players (${ctx.players} seated).`) : OK),
  }),
  define({
    id: "setup.setTimer", perceivable: true, title: "Set a timer", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Sets how long dusk, each night turn, the day discussion or the vote phase lasts, in seconds. Arguments: { \"timer\": \"dusk\" | \"turn\" | \"day\" | \"vote\", \"seconds\": n } (dusk and turn 5-120, day 30-1800, vote 5-120; the vote defaults to 20). Every night turn lasts exactly the turn time, whoever is awake.",
    tooltip: "Change how long dusk, a night turn or the day lasts.", keywords: ["duration", "time", "seconds", "night", "day", "speed"],
    params: z.object({ timer: z.enum(["dusk", "turn", "day", "vote"]), seconds: z.number().int().min(5).max(1800) }).strict(),
    available: (_ctx, args) => {
      const t = args?.timer as keyof typeof TIMERS | undefined, s = args?.seconds as number | undefined;
      if (t && s !== undefined && (s < TIMERS[t].min || s > TIMERS[t].max)) return no(`Between ${TIMERS[t].min} and ${TIMERS[t].max} seconds.`);
      return OK;
    },
  }),
  define({
    id: "setup.setCenter", perceivable: true, title: "Set the number of centre cards", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Sets how many cards lie face down in the centre (3 to 6). More centre cards mean more roles that nobody holds, so claims are harder to check.",
    tooltip: "Choose how many cards lie face down in the centre (3 to 6).", keywords: ["middle", "centre", "center", "cards", "extra"],
    params: z.object({ count: z.number().int().min(CENTER_MIN).max(CENTER_MAX) }).strict(),
  }),
  define({
    id: "setup.setRule", perceivable: true, title: "Change a table rule", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: `Sets one of the table's rule variants, shown to every player. Arguments: { "rule": <id>, "value": <value> }. Rules: ${RULE_DEFS.map(r => `${r.id} (${r.kind === "boolean" ? "true/false" : r.kind === "choice" ? r.options.map(o => JSON.stringify(o.value)).join("/") : `${r.min} to ${r.max}`}, default ${JSON.stringify(DEFAULT_RULES[r.id])}): ${r.tooltip}`).join(" ")}`,
    tooltip: "Turn one of the table's rule variants on or off, or change its value.", keywords: ["rule", "variant", "blood price", "census", "setting", "option"],
    params: z.object({ rule: z.enum(RULE_DEFS.map(r => r.id) as [string, ...string[]]).describe("The rule's id."), value: ruleValue.describe("true/false, a choice's value, or a whole number, as the rule takes.") }).strict(),
    available: (_ctx, args) => (args?.rule !== undefined && args.value !== undefined ? ((p) => (p ? no(p) : OK))(ruleValueProblem(String(args.rule), args.value)) : OK),
  }),
  define({
    id: "setup.fixDeal", perceivable: false, title: "Fix the next deal (play-test table)", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "At a play-test table only: fixes the next deal. `seed` (a whole number) makes the seating and the shuffle repeatable, so different rule arms can be played on the same deal. `seats` (player ids in the order they will sit, seat 0 first) fixes who sits where. `cards` (role ids: one per seat in seat order, then the centre cards) fixes exactly who is dealt what; it must be a rearrangement of the deck. Any of the three may be given; what is not fixed is random. The fixed deal is used by every game until cleared.",
    tooltip: "Make the next deal repeatable, or choose exactly who gets which card.", keywords: ["seed", "deal", "test", "playtest", "fix", "rig"],
    params: z.object({
      seed: z.number().int().min(0).max(2 ** 31).optional().describe("Seeds the seating and the shuffle."),
      seats: z.array(z.string()).min(3).max(12).optional().describe("Player ids in seat order (seat 0 first): every player in the room exactly once."),
      cards: z.array(roleId).min(6).max(18).optional().describe("Role ids: the card of seat 0, seat 1, …, then centre card 1, 2, …"),
    }).strict(),
    available: ctx => (ctx.playtest ? OK : no("Only at a play-test table (chosen when the room is created).", true)),
  }),
  define({
    id: "setup.clearDeal", perceivable: false, title: "Clear the fixed deal", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "At a play-test table: the next deal is random again.", tooltip: "Go back to random deals.", keywords: ["seed", "deal", "random"], params: none,
    available: ctx => (ctx.playtest ? OK : no("Only at a play-test table.", true)),
  }),
  // ── talk ──
  define({
    id: "chat.send", perceivable: true, title: "Say something to the table", group: "talk", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "day", "vote", "ended"],
    description: "Posts a chat message everyone in the room can read. Arguments: { \"text\": <up to 600 characters> }. The table is silent at night: chat is open in the lobby, during the day discussion and after the game. Use it to make claims, ask questions and argue for a vote. Name players with their seat numbers, e.g. \"Bo (seat 1)\".",
    tooltip: "Send a message to everyone at the table.", keywords: ["chat", "message", "talk", "claim", "say", "text"],
    params: z.object({ text: z.string().trim().min(1).max(600).describe("The message, up to 600 characters.") }).strict(),
    contextReasons: { night: "The table is silent at night." },
    available: ctx => (ctx.phase === "vote" && !ctx.rules.chatDuringVote ? no("Chat is closed during the vote at this table.") : OK),
  }),
  define({
    id: "chat.sendSigned", perceivable: true, title: "Post your signed message", group: "talk", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day"],
    description: "Once per game, the player DEALT Signet may post a message the game itself marks as sent by the player dealt Signet. It proves the dealt card, not the card held now.",
    tooltip: "Post your one message that the game marks as coming from the player dealt Signet.", keywords: ["signet", "seal", "verified", "prove"],
    params: z.object({ text: z.string().trim().min(1).max(600) }).strict(),
    available: ctx => (ctx.chatPower === "signed" ? OK : no("Only the player dealt Signet can do this, once.", true)),
  }),
  define({
    id: "chat.sendReport", perceivable: true, title: "Post your sealed report", group: "talk", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day"],
    description: "Once per game, the player DEALT Notary posts a sealed report the game composes from their night look: \"Sealed report: at night, <player> (seat n)'s card was <role>.\" No arguments. The game marks it as sent by the player dealt Notary (a Counterfeiter can forge such a seal).",
    tooltip: "Post the sealed report of what you saw at night.", keywords: ["notary", "seal", "report", "prove"], params: none,
    available: ctx => (ctx.chatPower === "report" ? OK : no("Only the player dealt Notary can do this, once.", true)),
  }),
  define({
    id: "chat.forgeSeal", perceivable: true, title: "Post a forged seal", group: "talk", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day"],
    description: "Once per game, the player DEALT Counterfeiter posts a message carrying another role's seal, identical in every view to the real one until the game ends. Arguments: { \"as\": \"signet\", \"text\": <up to 600 characters> } or { \"as\": \"notary\", \"seat\": <seat>, \"card\": <role id> } (published as \"Sealed report: at night, <player> (seat n)'s card was <role>.\"). The sealing role must be in the deck.",
    tooltip: "Post one message under another role's seal.", keywords: ["counterfeit", "forge", "seal", "fake"],
    params: z.object({
      as: z.enum(["signet", "notary"]).describe("The seal to forge."),
      text: z.string().trim().min(1).max(600).optional().describe("With \"signet\": the message."),
      seat: seatNo("With \"notary\": the player the report names").optional(),
      card: roleId.optional().describe("With \"notary\": the role the report says that card was."),
    }).strict(), seatArgs: ["seat"],
    available: (ctx, args) => {
      if (ctx.chatPower !== "forge") return no("Only the player dealt Counterfeiter can do this, once.", true);
      const as = args?.as as "signet" | "notary" | undefined;
      if (as === "signet" && args && args.text === undefined) return no("A Signet seal needs \"text\".");
      if (as === "notary" && args && (args.seat === undefined || args.card === undefined)) return no("A Notary seal needs \"seat\" and \"card\".");
      if (as && !ctx.deck.includes(as)) return no(`There is no ${ROLE[as].name} in this deck, so its seal would give you away.`);
      return OK;
    },
  }),
  // ── connect an assistant ──
  define({
    id: "connect.createKey", perceivable: false, title: "Connect an assistant with a key", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Creates a key that lets an AI assistant act as the caller in this room over MCP. The key is shown once.",
    tooltip: "Make a key your AI assistant can use to play as you in this room.", keywords: ["mcp", "ai", "agent", "claude", "api key", "token", "assistant"],
    params: z.object({ permission: z.enum(["read", "act", "host"]), label: z.string().trim().min(1).max(40) }).strict(),
    surfaces: { except: ["mcp"], because: "consent" },
    available: (ctx, args) => (args?.permission === "host" && !ctx.host ? no("Only the host can hand over the table.") : OK),
  }),
  define({
    id: "connect.revoke", perceivable: false, title: "Disconnect an assistant", group: "connect", runs: "server", effect: "destructive", confirm: "inline", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Revokes one of the caller's assistant connections at once.", tooltip: "Cut off one of your connected assistants.", keywords: ["revoke", "remove", "mcp", "key", "disconnect"],
    params: z.object({ connection: z.string() }).strict(),
    surfaces: { except: ["mcp"], because: "consent" },
  }),
  define({
    id: "connect.approve", perceivable: false, title: "Approve an assistant's request to connect", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Approves a pending OAuth request so that assistant can act as the caller in this room.", tooltip: "Let the assistant that asked play as you in this room.", keywords: ["oauth", "allow"],
    params: z.object({ request: z.string().min(20), permission: z.enum(["read", "act", "host"]), completion: z.string().min(20) }).strict(),
    surfaces: { except: ["mcp", "palette"], because: "consent" },
    available: (ctx, args) => (args?.permission === "host" && !ctx.host ? no("Only the host can hand over the table.") : OK),
  }),
  define({
    id: "connect.deny", perceivable: false, title: "Refuse an assistant's request to connect", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Refuses a pending OAuth request.", tooltip: "Refuse the assistant that asked.", keywords: ["oauth", "deny"],
    params: z.object({ request: z.string().min(20), completion: z.string().min(20) }).strict(),
    surfaces: { except: ["mcp", "palette"], because: "consent" },
  }),
  // ── reading, for assistants (the app shows all of this on screen) ──
  define({
    id: "room.view", perceivable: false, title: "Look at the table", group: "view", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Returns everything the caller may see right now: phase, players by seat, the table rules, the deck, timers, the night's timetable and the countdown to your own turn, your dealt card and status (bitten, Imago), the steps of your night action with the legal choices for each, what you have learned, the dawn proclamations and the egg, the chat, who has voted, your queued day swap, and after the game every card, vote, why each seat won or lost, and the full log. Every top-level key is always present (null when it does not apply in this phase). Arguments (all optional): { \"compact\": true } leaves out what does not change during a game (deck, rules, role texts, timetable); { \"chatSince\": n } returns only chat messages numbered n and later (each message has `n`; `chatCount` is the total). Call it first, and again whenever `version` changes.",
    tooltip: "See the table.", keywords: ["state", "look"],
    params: z.object({
      compact: z.boolean().optional().describe("Leave out the deck, rules, role texts and timetable."),
      chatSince: z.number().int().min(0).optional().describe("Only chat messages with n >= this. Use the chatCount you last saw."),
    }).strict(),
    surfaces: { except: ["palette"], because: "shown" },
  }),
  define({
    id: "room.wait", perceivable: false, title: "Wait for something to happen", group: "view", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Waits until something you care about changes, or `seconds` pass, then returns the new `version`, `changed`, and what changed. Arguments: { \"version\": <from your last room_view or room_wait>, \"until\": \"any\" | \"phase\" | \"chat\" | \"turn\", \"seconds\": 1-25 }. until \"any\" (default): anything you can see (phase, your night turn, your journal, chat, votes, players, settings); \"phase\": only a new phase; \"chat\": a new chat message or a new phase; \"turn\": your own night turn starting or ending, or a new phase. The version does not tick on the clock or on other players' night turns. Loop: call room_wait with the version it returned until `changed` is true, then room_view. Use it instead of polling room_view.",
    tooltip: "Wait for the table to change.", keywords: ["poll"],
    params: z.object({
      version: z.string().optional().describe("The version you last saw; omit to wait for the next change from now."),
      until: z.enum(["any", "phase", "chat", "turn"]).default("any").describe("What to wait for."),
      seconds: z.number().int().min(1).max(25).default(20),
    }).strict(),
    surfaces: { except: ["palette"], because: "shown" },
  }),
  define({
    id: "rules.read", perceivable: false, title: "Read the rules", group: "help", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Returns how the game works, how to win (the resolution order), how plans and timers work, this table's rule settings with what each means, warnings about the deck (glamour, forgery, curse…), and the rule of every role in this room's deck. Read it once before playing, and again if the host changes the deck or the rules.",
    tooltip: "How the game works.", keywords: ["help", "how to play"], params: none,
    surfaces: { except: ["palette"], because: "shown" },
  }),
  // ── play ──
  define({
    id: "game.start", perceivable: true, title: "Start the game", group: "play", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Seats the players in a random circle, deals the deck (one card each, the rest to the centre) and begins the night.",
    tooltip: "Deal the cards and begin the night.", keywords: ["begin", "deal", "go", "play"], params: none, shortcut: "S",
    available: ctx => { const p = deckProblem(ctx.deck, ctx.players, ctx.center, ctx.rules); return p ? no(p) : OK; },
  }),
  define({
    id: "night.planStep", perceivable: false, title: "Queue a night move", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["night"],
    description: `Sets the caller's decision for one step of their night action, before or during their turn. Arguments: { "step": <step id from yourNightSteps>, "plan": { "branches": [], "otherwise": <decision> } } for an unconditional decision, or with branches [{ "roles": [<role ids>], "decision": <decision> }] tried in order against the card you see at the earlier step (only where the step says canBranchOn). A decision is one of ${DECISION_SHAPES}. It runs by itself when the turn comes; during the caller's own turn it runs at once. Steps left undecided when the turn ends get a random legal move.`,
    tooltip: "Decide a step of your night action now; it plays by itself when your turn comes.", keywords: ["plan", "decide", "move", "action", "target", "swap", "look"],
    params: z.object({
      step: z.string().describe("The step id, from your role's steps (or, with \"as\", from that role's steps)."),
      plan: stepPlan,
      as: roleId.optional().describe("Copiers only (Gleaner, Echo): the plan for when you have become this role. Queue one per role you might become; the one for the role you become runs in that role's turn."),
    }).strict(),
    available: (ctx, args) => {
      if (args?.as !== undefined) {
        if (ctx.adoptOpen === "any") return OK;
        return ctx.adoptOpen.includes(String(args.as)) ? OK : no(ctx.adoptOpen.length ? `You became a ${ROLE[ctx.adoptOpen[0]]?.name ?? ctx.adoptOpen[0]}: plan for that role.` : "Only a copier (Gleaner, Echo) can plan for a role it may become, until its copy has acted.");
      }
      if (!ctx.openSteps.length) return no(ctx.adoptOpen === "any" || ctx.adoptOpen.length ? "Your own steps are done: plan your copied role's steps with \"as\"." : "You have nothing left to decide tonight.");
      if (args?.step && !ctx.openSteps.includes(String(args.step))) return no("That step is already done.");
      return OK;
    },
  }),
  define({
    id: "night.clearStep", perceivable: false, title: "Clear a queued move", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["night"],
    description: "Removes the caller's queued decision for a step that has not happened yet. Arguments: { \"step\": <step id> }.",
    tooltip: "Undo a queued decision that has not played yet.", keywords: ["undo", "unqueue", "reset", "plan"],
    params: z.object({ step: z.string().describe("The step id, from yourNightSteps."), as: roleId.optional().describe("Copiers: clear the plan for this possible role.") }).strict(),
    available: (ctx, args) => (args?.as !== undefined ? (ctx.adoptOpen === "any" || ctx.adoptOpen.includes(String(args.as)) ? OK : no("You cannot change that plan now.")) : args?.step && !ctx.openSteps.includes(String(args.step)) ? no("That step is already done.") : ctx.openSteps.length ? OK : no("You have nothing queued.")),
  }),
  define({
    id: "day.vote", perceivable: true, title: "Vote to eliminate", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["vote"],
    contextReasons: { day: "Voting opens when the discussion ends (its timer, the host, or everyone ready: day_ready { \"ready\": true })." },
    description: "During the vote phase only: casts or changes the caller's vote for the seat to eliminate. Arguments: { \"seat\": <seat number of another player> }. The vote phase ends when its timer runs out, or early once every seated human has voted; anyone who has not voted then gets a random vote, marked as such in the results.",
    tooltip: "Vote for who you think is a Werewolf. You can change it until the day ends.", keywords: ["accuse", "eliminate", "kill", "choose"],
    params: z.object({ seat: seatNo("The player to vote for") }).strict(), seatArgs: ["seat"],
  }),
  define({
    id: "day.clearVote", perceivable: true, title: "Take back your vote", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["vote"],
    description: "Withdraws the caller's vote.", tooltip: "Withdraw your vote while you think again.", keywords: ["undo", "unvote", "retract"], params: none,
    available: ctx => (ctx.voted ? OK : no("You have not voted.")),
  }),
  define({
    id: "day.queueSwap", perceivable: false, title: "Queue your day swap", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day", "vote"],
    description: "Only for the player DEALT the Moon-Thief, during discussion or the vote: queues a secret swap of two other players' cards, made the instant the vote phase ends, before anything is counted. Arguments: { \"a\": <seat>, \"b\": <seat> }, two different seats, neither your own. Call again to change it; day_clearSwap to cancel. Nobody else sees it until the game ends.",
    tooltip: "Secretly swap two other players' cards the moment voting ends.", keywords: ["moon-thief", "thief", "swap", "steal"],
    params: z.object({ a: seatNo("One player whose card moves"), b: seatNo("The other player whose card moves") }).strict(), seatArgs: ["a", "b"],
    available: ctx => (ctx.dayPower === "swap" ? OK : no("Only the player dealt the Moon-Thief can do this.", true)),
  }),
  define({
    id: "day.clearSwap", perceivable: false, title: "Cancel your day swap", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day", "vote"],
    description: "Only for the player DEALT the Moon-Thief: cancels the queued day swap.", tooltip: "Cancel your queued swap.", keywords: ["moon-thief", "undo", "swap"], params: none,
    available: ctx => (ctx.dayPower !== "swap" ? no("Only the player dealt the Moon-Thief can do this.", true) : ctx.swapQueued ? OK : no("You have no swap queued.")),
  }),
  define({
    id: "day.queueEmber", perceivable: false, title: "Carry the ember", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day", "vote"],
    description: "Only for the player DEALT an Ember-Carrier (or a copy of one): queues the seat that receives a Phoenix card the instant the vote ends (after any Moon-Thief swap, before counting): that Phoenix card and the seat's card swap places. Arguments: { \"seat\": <another player's seat> }. Call again to change it; day_clearEmber to cancel. Secret until the game ends.",
    tooltip: "Secretly send the Phoenix card to a player as the vote ends.", keywords: ["ember", "pyre", "phoenix", "kindler"],
    params: z.object({ seat: seatNo("The player who is to receive the Phoenix card") }).strict(), seatArgs: ["seat"],
    available: ctx => (ctx.dayPower === "ember" ? OK : no("Only an Ember-Carrier can do this.", true)),
  }),
  define({
    id: "day.clearEmber", perceivable: false, title: "Put the ember down", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day", "vote"],
    description: "Only for an Ember-Carrier: cancels its queued ember.", tooltip: "Cancel your queued ember.", keywords: ["ember", "undo"], params: none,
    available: ctx => (ctx.dayPower === "ember" ? OK : no("Only an Ember-Carrier can do this.", true)),
  }),
  define({
    id: "day.ready", perceivable: true, title: "Say you are ready to vote", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day"],
    description: "Marks the caller ready (or not) to end the discussion. Arguments: { \"ready\": true | false }. Everyone sees who is ready. When every seated human is ready, the vote phase begins.",
    tooltip: "Tell the table you are ready to vote; the vote starts when everyone is.", keywords: ["ready", "done", "vote", "finish"],
    params: z.object({ ready: z.boolean().describe("true: ready to vote; false: not yet.") }).strict(),
  }),
  define({
    id: "day.cutLine", perceivable: false, title: "Cut a player off", group: "play", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day", "vote"],
    description: "Only for the player DEALT Hush, once per game: cuts another player off for the table's cut length (60 s by default). For that time nothing they send goes through and nothing new reaches them, and everyone sees them drop offline and come back exactly as a lost connection looks. Revealed only in the results. Arguments: { \"seat\": <another player's seat> }.",
    tooltip: "Silently cut one player off for a minute, as if their connection dropped.", keywords: ["hush", "silence", "cut", "disconnect", "mute"],
    params: z.object({ seat: seatNo("The player to cut off") }).strict(), seatArgs: ["seat"],
    available: ctx => (ctx.dayPower !== "cut" ? no("Only the player dealt Hush can do this, once.", true) : ctx.phase === "vote" && !ctx.rules.cutDuringVote ? no("At this table the Hush may cut only during the discussion.") : OK),
  }),
  define({
    id: "day.endDiscussion", perceivable: true, title: "End the discussion now", group: "play", runs: "server", effect: "write", confirm: "inline", caller: "host", contexts: ["day"],
    description: "Ends the discussion and opens the vote phase at once.",
    tooltip: "Move on to the vote now.", keywords: ["finish", "vote", "skip"], params: none,
  }),
  define({
    id: "presence.heartbeat", perceivable: true, title: "Say you are still here", group: "view", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Keeps the caller shown as online. The app sends it every few seconds; every MCP call counts as one, so an assistant never needs to call it.",
    tooltip: "Keep your seat shown as online.", keywords: ["online", "presence", "ping"], params: none,
    surfaces: { except: ["palette", "mcp"], because: "agent" },
  }),
  define({
    id: "game.abandon", perceivable: true, title: "Abandon this round", group: "play", runs: "server", effect: "destructive", confirm: "inline", caller: "host", contexts: ["night", "day", "vote"],
    description: "At a play-test table only: ends the round with no result and returns everyone to the lobby.",
    tooltip: "Stop this round without a result and go back to the lobby.", keywords: ["abort", "stop", "cancel", "reset"], params: none,
    available: ctx => (ctx.playtest ? OK : no("Only at a play-test table.", true)),
  }),
  define({
    id: "game.playAgain", perceivable: true, title: "Play again", group: "play", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["ended"],
    description: "Returns the room to the lobby with the same players, deck, rules and timers.",
    tooltip: "Go back to the lobby with the same table.", keywords: ["rematch", "restart", "new round", "lobby"], params: none,
  }),
  // ── view (client only) ──
  define({
    id: "ui.toggleAssistant", perceivable: false, title: "Show or hide the assistant panel", group: "view", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Shows or hides the assistant panel at the bottom of the screen.", tooltip: "Open or close the assistant panel at the bottom.", keywords: ["ai", "chat", "panel", "bottom"], params: none, shortcut: "A",
  }),
  define({
    id: "ui.toggleSidebar", perceivable: false, title: "Show or hide your notes panel", group: "view", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Shows or hides the side panel with the caller's role, plan and journal.", tooltip: "Open or close the side panel, to give the table more room.", keywords: ["side", "journal", "role", "plan", "focus"], params: none, shortcut: "N",
  }),
  define({
    id: "ui.showRoles", perceivable: false, title: "Read the roles", group: "help", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["home", "lobby", "night", "day", "vote", "ended"],
    description: "Opens the role reference: every role, its team and its rule.", tooltip: "See every role and what it does.", keywords: ["rules", "help", "characters", "cards", "how to play"], params: none, shortcut: "R",
  }),
  define({
    id: "ui.copyInvite", perceivable: false, title: "Copy the invite link", group: "room", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Copies a link that opens this room.", tooltip: "Copy a link others can use to join this table.", keywords: ["share", "url", "code", "invite"], params: none,
  }),
  define({
    id: "ui.goHome", perceivable: false, title: "Go to the front page", group: "room", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "vote", "ended"],
    description: "Leaves the room's page without giving up the seat.", tooltip: "Back to the front page. You keep your seat.", keywords: ["home", "back", "exit"], params: none,
  }),
] as const satisfies readonly CommandDef[];

export type CommandId = (typeof COMMANDS)[number]["id"];
export const COMMAND: Record<string, CommandDef> = Object.fromEntries(COMMANDS.map(c => [c.id, c]));

const PHASE_WORDS: Record<Phase, string> = { home: "on the front page", lobby: "in the lobby", night: "at night", day: "during the day's discussion", vote: "during the vote", ended: "after the game" };
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

/** Whether a command can run now, and if not, why. The one rule the server, the palette and every button share. */
export function availability(cmd: CommandDef, ctx: CommandContext, args?: Record<string, unknown>): Availability {
  if (!cmd.contexts.includes(ctx.phase)) return cmd.contextReasons?.[ctx.phase] ? no(cmd.contextReasons[ctx.phase]!) : no(`Only ${list(cmd.contexts.map(p => PHASE_WORDS[p]))}.`, true);
  if (cmd.caller === "member" && !ctx.member) return no("Join the room first.", true);
  if (cmd.caller === "seated" && !ctx.seated) return no("You are watching this round.", true);
  if (cmd.caller === "host" && !ctx.host) return no("Only the host can do this.", !ctx.member);
  return cmd.available?.(ctx, args) ?? OK;
}

/** Whether a connection's grant covers a command at all, whatever the moment. */
export function grantAllows(cmd: CommandDef, grant: Grant): boolean {
  if (cmd.runs !== "server" || cmd.surfaces?.except.includes("mcp")) return false;
  if (grant === "read") return cmd.effect === "read";
  if (grant === "act") return cmd.caller !== "host";
  return true;
}
export const toolName = (id: string) => id.replace(".", "_");

/**
 * room_wait's modes. A room version is a list of named parts (round, phase, own night turn, chat count, votes, own
 * journal, settings, proclamations, own swap); each mode watches some of them. Shared so a proxy (sim/mcp-shim.ts) can
 * answer room_wait exactly as the server does.
 */
export const WAIT_PARTS: Record<string, string[]> = { any: ["r", "ph", "t", "c", "v", "j", "s", "d", "w"], phase: ["r", "ph"], chat: ["r", "ph", "c"], turn: ["r", "ph", "t"] };
export function versionKey(version: string, until: string): string {
  const parts = Object.fromEntries(version.split(".").map(x => { const m = /^([a-z]+)(.*)$/.exec(x); return m ? [m[1], m[2]] : [x, ""]; }));
  return (WAIT_PARTS[until] ?? WAIT_PARTS.any).map(k => `${k}${parts[k] ?? ""}`).join(".");
}

/**
 * The registry as MCP tool definitions for a grant. The list does not change with the phase, because MCP clients read
 * it once: a tool that cannot run now answers with the reason, as the palette's dimmed row does.
 */
export function toolDefinitions(grant: Grant = "host") {
  return COMMANDS.filter(c => grantAllows(c, grant)).map(c => ({
    name: toolName(c.id),
    title: c.title,
    description: c.description,
    inputSchema: z.toJSONSchema(c.params, { io: "input" }) as Record<string, unknown>,
    annotations: { readOnlyHint: c.effect === "read", destructiveHint: c.effect === "destructive", openWorldHint: false },
  }));
}
