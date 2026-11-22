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

export type Phase = "home" | "lobby" | "night" | "day" | "ended";
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
  voted: boolean;
  /** The unused once-per-game chat power of the card the viewer was dealt, if any. */
  chatPower: "signed" | "unsigned" | null;
}
export const HOME_CONTEXT: CommandContext = { phase: "home", member: false, seated: false, host: false, players: 0, center: CENTER_DEFAULT, deck: [], openSteps: [], voted: false, chatPower: null };

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
  /** Checks beyond phase and caller. Pure. */
  available?(ctx: CommandContext, args?: Record<string, unknown>): Availability;
}

const define = <P extends z.ZodObject>(c: CommandDef<P>): CommandDef<P> => c;
const none = z.object({}).strict();
const name = z.string().trim().min(1).max(24).describe("A display name, 1 to 24 characters.");
const roleId = z.enum(ROLES.map(r => r.id) as [string, ...string[]]).describe("A role id, e.g. \"werewolf\".");
const slot = z.object({ k: z.enum(["p", "c"]).describe("p: a player's seat. c: a centre card."), i: z.number().int().min(0).max(63) }).strict();
const decision = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pick"), targets: z.array(slot).min(1).max(4) }).strict(),
  z.object({ kind: z.literal("do") }).strict(),
  z.object({ kind: z.literal("skip") }).strict(),
]);
const stepPlan = z.object({
  branches: z.array(z.object({ roles: z.array(roleId).min(1), decision }).strict()).max(12)
    .describe("Conditional decisions, tried in order: the first whose roles include the card seen at the earlier step applies."),
  otherwise: decision.optional().describe("The decision for every outcome no branch names. Alone, it is an unconditional decision."),
}).strict();

export const TIMERS = {
  dusk: { label: "Dusk (read your card, queue your move)", min: 5, max: 120 },
  turn: { label: "Each night turn", min: 5, max: 120 },
  day: { label: "Day discussion", min: 30, max: 1800 },
} as const;

export const COMMANDS = [
  // ── room ──
  define({
    id: "room.create", title: "Create a room", group: "room", runs: "server", effect: "write", confirm: "none", caller: "anyone", contexts: ["home"],
    description: "Creates a new room with the caller as host and returns its four-letter code. Others join with the code.",
    tooltip: "Open a new table and invite others with its code.", keywords: ["new", "host", "table", "game"],
    params: z.object({ name }).strict(),
  }),
  define({
    id: "room.join", title: "Join a room", group: "room", runs: "server", effect: "write", confirm: "none", caller: "anyone", contexts: ["home"],
    description: "Joins the room with this code under a display name. Joining a game in progress seats the caller as a spectator until the next round.",
    tooltip: "Sit down at a table using its code.", keywords: ["enter", "code", "sit"],
    params: z.object({ code: z.string().trim().length(4).describe("The room's four-letter code."), name }).strict(),
  }),
  define({
    id: "room.rename", title: "Change your name", group: "room", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby"],
    description: "Changes the caller's display name in the room.", tooltip: "Change the name others see.", keywords: ["nickname", "rename"],
    params: z.object({ name }).strict(),
  }),
  define({
    id: "room.leave", title: "Leave the room", group: "room", runs: "server", effect: "destructive", confirm: "inline", caller: "member", contexts: ["lobby", "ended"],
    description: "Removes the caller from the room. If the host leaves, the longest-seated person becomes host.",
    tooltip: "Give up your seat at this table.", keywords: ["exit", "quit"], params: none,
  }),
  define({
    id: "room.addBot", title: "Add a practice bot", group: "room", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Seats a bot that never decides anything, so every one of its night moves and its vote are the forced random ones. For trying the game alone.",
    tooltip: "Fill a seat with a bot that plays at random.", keywords: ["ai", "fill", "seat", "practice"], params: none,
    available: ctx => (ctx.players >= 12 ? no("The table is full (12 seats).") : OK),
  }),
  define({
    id: "room.remove", title: "Remove a player", group: "room", runs: "server", effect: "destructive", confirm: "inline", caller: "host", contexts: ["lobby"],
    description: "Removes another player or a bot from the room.", tooltip: "Take a player or bot off the table.", keywords: ["kick", "bot"],
    params: z.object({ player: z.string().describe("The player's id, from the room view.") }).strict(),
  }),
  // ── setup ──
  define({
    id: "setup.addRole", title: "Add a role to the deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Adds one copy of a role to the deck. The deck must hold one card per player plus the centre cards.",
    tooltip: "Put one more copy of a role in the deck.", keywords: ["card", "include", "deck"],
    params: z.object({ role: roleId }).strict(),
    available: (ctx, args) => {
      const r = args?.role as RoleId | undefined;
      if (r && ROLE[r] && ctx.deck.filter(x => x === r).length >= ROLE[r].max) return no(`The deck already has every copy of ${ROLE[r].name}.`);
      return OK;
    },
  }),
  define({
    id: "setup.removeRole", title: "Remove a role from the deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Removes one copy of a role from the deck.", tooltip: "Take one copy of a role out of the deck.", keywords: ["card", "exclude", "deck"],
    params: z.object({ role: roleId }).strict(),
    available: (ctx, args) => {
      const r = args?.role as RoleId | undefined;
      if (r && !ctx.deck.includes(r)) return no("That role is not in the deck.");
      return ctx.deck.length ? OK : no("The deck is empty.");
    },
  }),
  define({
    id: "setup.useRecommended", title: "Use the recommended deck", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Replaces the deck with a balanced one for the current number of players.",
    tooltip: "Fill the deck with a balanced set for this many players.", keywords: ["preset", "default", "auto", "deck"], params: none,
    available: ctx => (ctx.players < 3 ? no(`Needs 3 players (${ctx.players} seated).`) : OK),
  }),
  define({
    id: "setup.setTimer", title: "Set a timer", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Sets how long dusk, each night turn, or the day discussion lasts, in seconds. Every night turn lasts exactly the turn time, whoever is awake.",
    tooltip: "Change how long dusk, a night turn or the day lasts.", keywords: ["duration", "time", "seconds", "night", "day", "speed"],
    params: z.object({ timer: z.enum(["dusk", "turn", "day"]), seconds: z.number().int().min(5).max(1800) }).strict(),
    available: (_ctx, args) => {
      const t = args?.timer as keyof typeof TIMERS | undefined, s = args?.seconds as number | undefined;
      if (t && s !== undefined && (s < TIMERS[t].min || s > TIMERS[t].max)) return no(`Between ${TIMERS[t].min} and ${TIMERS[t].max} seconds.`);
      return OK;
    },
  }),
  define({
    id: "setup.setCenter", title: "Set the number of centre cards", group: "setup", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Sets how many cards lie face down in the centre (3 to 6). More centre cards mean more roles that nobody holds, so claims are harder to check.",
    tooltip: "Choose how many cards lie face down in the centre (3 to 6).", keywords: ["middle", "centre", "center", "cards", "extra"],
    params: z.object({ count: z.number().int().min(CENTER_MIN).max(CENTER_MAX) }).strict(),
  }),
  // ── talk ──
  define({
    id: "chat.send", title: "Say something to the table", group: "talk", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "day", "ended"],
    description: "Posts a chat message everyone in the room can read. The table is silent at night: chat is open in the lobby, during the day discussion and after the game. Use it to make claims, ask questions and argue for a vote.",
    tooltip: "Send a message to everyone at the table.", keywords: ["chat", "message", "talk", "claim", "say", "text"],
    params: z.object({ text: z.string().trim().min(1).max(600).describe("The message, up to 600 characters.") }).strict(),
    contextReasons: { night: "The table is silent at night." },
  }),
  define({
    id: "chat.sendSigned", title: "Post your signed message", group: "talk", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day"],
    description: "Once per game, the player DEALT Signet may post a message the game itself marks as sent by the player dealt Signet. It proves the dealt card, not the card held now.",
    tooltip: "Post your one message that the game marks as coming from the player dealt Signet.", keywords: ["signet", "seal", "verified", "prove"],
    params: z.object({ text: z.string().trim().min(1).max(600) }).strict(),
    available: ctx => (ctx.chatPower === "signed" ? OK : no("Only the player dealt Signet can do this, once.", true)),
  }),
  define({
    id: "chat.sendUnsigned", title: "Post your unsigned message", group: "talk", runs: "server", effect: "write", confirm: "inline", caller: "seated", contexts: ["day"],
    description: "Once per game, the player DEALT Forger may post a message with no name on it. Who sent it is shown only after the game.",
    tooltip: "Post your one message with no name on it.", keywords: ["forger", "anonymous", "unsigned"],
    params: z.object({ text: z.string().trim().min(1).max(600) }).strict(),
    available: ctx => (ctx.chatPower === "unsigned" ? OK : no("Only the player dealt Forger can do this, once.", true)),
  }),
  // ── connect an assistant ──
  define({
    id: "connect.createKey", title: "Connect an assistant with a key", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Creates a key that lets an AI assistant act as the caller in this room over MCP. The key is shown once.",
    tooltip: "Make a key your AI assistant can use to play as you in this room.", keywords: ["mcp", "ai", "agent", "claude", "api key", "token", "assistant"],
    params: z.object({ permission: z.enum(["read", "act", "host"]), label: z.string().trim().min(1).max(40) }).strict(),
    surfaces: { except: ["mcp"], because: "consent" },
    available: (ctx, args) => (args?.permission === "host" && !ctx.host ? no("Only the host can hand over the table.") : OK),
  }),
  define({
    id: "connect.revoke", title: "Disconnect an assistant", group: "connect", runs: "server", effect: "destructive", confirm: "inline", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Revokes one of the caller's assistant connections at once.", tooltip: "Cut off one of your connected assistants.", keywords: ["revoke", "remove", "mcp", "key", "disconnect"],
    params: z.object({ connection: z.string() }).strict(),
    surfaces: { except: ["mcp"], because: "consent" },
  }),
  define({
    id: "connect.approve", title: "Approve an assistant's request to connect", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Approves a pending OAuth request so that assistant can act as the caller in this room.", tooltip: "Let the assistant that asked play as you in this room.", keywords: ["oauth", "allow"],
    params: z.object({ request: z.string().min(20), permission: z.enum(["read", "act", "host"]), completion: z.string().min(20) }).strict(),
    surfaces: { except: ["mcp", "palette"], because: "consent" },
    available: (ctx, args) => (args?.permission === "host" && !ctx.host ? no("Only the host can hand over the table.") : OK),
  }),
  define({
    id: "connect.deny", title: "Refuse an assistant's request to connect", group: "connect", runs: "server", effect: "write", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Refuses a pending OAuth request.", tooltip: "Refuse the assistant that asked.", keywords: ["oauth", "deny"],
    params: z.object({ request: z.string().min(20), completion: z.string().min(20) }).strict(),
    surfaces: { except: ["mcp", "palette"], because: "consent" },
  }),
  // ── reading, for assistants (the app shows all of this on screen) ──
  define({
    id: "room.view", title: "Look at the table", group: "view", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Returns everything the caller may see right now: phase, players by seat, the deck, timers, the night's timetable and current turn, the caller's dealt card, the steps of their night action with the legal choices for each, what they have learned, what has been shown to everyone, the chat, who has voted, and after the game every card, vote and the full log. Call it first, and again whenever `version` changes.",
    tooltip: "See the table.", keywords: ["state", "look"], params: none,
    surfaces: { except: ["palette"], because: "shown" },
  }),
  define({
    id: "room.wait", title: "Wait for something to happen", group: "view", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Waits until the table changes (a new phase or turn, a chat message, a vote, your step resolving) or `seconds` pass, then returns the new `version` and what changed. Pass the `version` from your last room_view or room_wait. Use it instead of polling room_view.",
    tooltip: "Wait for the table to change.", keywords: ["poll"],
    params: z.object({ version: z.string().optional().describe("The version you last saw; omit to wait for the next change from now."), seconds: z.number().int().min(1).max(25).default(20) }).strict(),
    surfaces: { except: ["palette"], because: "shown" },
  }),
  define({
    id: "rules.read", title: "Read the rules", group: "help", runs: "server", effect: "read", confirm: "none", caller: "member", contexts: ["lobby", "night", "day", "ended"],
    description: "Returns how the game works, how to win, how plans and timers work, and the rule of every role in this room's deck. Read it once before playing.",
    tooltip: "How the game works.", keywords: ["help", "how to play"], params: none,
    surfaces: { except: ["palette"], because: "shown" },
  }),
  // ── play ──
  define({
    id: "game.start", title: "Start the game", group: "play", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["lobby"],
    description: "Seats the players in a random circle, deals the deck (three cards to the centre) and begins the night.",
    tooltip: "Deal the cards and begin the night.", keywords: ["begin", "deal", "go", "play"], params: none, shortcut: "S",
    available: ctx => { const p = deckProblem(ctx.deck, ctx.players, ctx.center); return p ? no(p) : OK; },
  }),
  define({
    id: "night.planStep", title: "Queue a night move", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["night"],
    description: "Sets the caller's decision for one step of their night action, before or during their turn. A plan may be unconditional (only `otherwise`) or branch on the card seen at an earlier step. It runs by itself when the turn comes; during the caller's own turn it runs at once. Steps left undecided when the turn ends get a random legal move.",
    tooltip: "Decide a step of your night action now; it plays by itself when your turn comes.", keywords: ["plan", "decide", "move", "action", "target", "swap", "look"],
    params: z.object({ step: z.string().describe("The step id, from your role's steps."), plan: stepPlan }).strict(),
    available: (ctx, args) => {
      if (!ctx.openSteps.length) return no("You have nothing left to decide tonight.");
      if (args?.step && !ctx.openSteps.includes(String(args.step))) return no("That step is already done.");
      return OK;
    },
  }),
  define({
    id: "night.clearStep", title: "Clear a queued move", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["night"],
    description: "Removes the caller's queued decision for a step that has not happened yet.",
    tooltip: "Undo a queued decision that has not played yet.", keywords: ["undo", "unqueue", "reset", "plan"],
    params: z.object({ step: z.string() }).strict(),
    available: (ctx, args) => (args?.step && !ctx.openSteps.includes(String(args.step)) ? no("That step is already done.") : ctx.openSteps.length ? OK : no("You have nothing queued.")),
  }),
  define({
    id: "day.vote", title: "Vote to eliminate", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day"],
    description: "Casts or changes the caller's vote for the seat to eliminate. The day ends when every human has voted or the timer runs out; anyone who has not voted then votes at random.",
    tooltip: "Vote for who you think is a Werewolf. You can change it until the day ends.", keywords: ["accuse", "eliminate", "kill", "choose"],
    params: z.object({ seat: z.number().int().min(0).max(63).describe("The seat number of the player to vote for.") }).strict(),
  }),
  define({
    id: "day.clearVote", title: "Take back your vote", group: "play", runs: "server", effect: "write", confirm: "none", caller: "seated", contexts: ["day"],
    description: "Withdraws the caller's vote.", tooltip: "Withdraw your vote while you think again.", keywords: ["undo", "unvote", "retract"], params: none,
    available: ctx => (ctx.voted ? OK : no("You have not voted.")),
  }),
  define({
    id: "day.endDiscussion", title: "End the day now", group: "play", runs: "server", effect: "write", confirm: "inline", caller: "host", contexts: ["day"],
    description: "Counts the votes immediately. Anyone who has not voted votes at random.",
    tooltip: "Count the votes now. Anyone who hasn't voted votes at random.", keywords: ["finish", "count", "skip", "tally"], params: none,
  }),
  define({
    id: "game.playAgain", title: "Play again", group: "play", runs: "server", effect: "write", confirm: "none", caller: "host", contexts: ["ended"],
    description: "Returns the room to the lobby with the same players, deck and timers.",
    tooltip: "Go back to the lobby with the same table.", keywords: ["rematch", "restart", "new round", "lobby"], params: none,
  }),
  // ── view (client only) ──
  define({
    id: "ui.toggleAssistant", title: "Show or hide the assistant panel", group: "view", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "ended"],
    description: "Shows or hides the assistant panel at the bottom of the screen.", tooltip: "Open or close the assistant panel at the bottom.", keywords: ["ai", "chat", "panel", "bottom"], params: none, shortcut: "A",
  }),
  define({
    id: "ui.toggleSidebar", title: "Show or hide your notes panel", group: "view", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "ended"],
    description: "Shows or hides the side panel with the caller's role, plan and journal.", tooltip: "Open or close the side panel, to give the table more room.", keywords: ["side", "journal", "role", "plan", "focus"], params: none, shortcut: "N",
  }),
  define({
    id: "ui.showRoles", title: "Read the roles", group: "help", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["home", "lobby", "night", "day", "ended"],
    description: "Opens the role reference: every role, its team and its rule.", tooltip: "See every role and what it does.", keywords: ["rules", "help", "characters", "cards", "how to play"], params: none, shortcut: "R",
  }),
  define({
    id: "ui.copyInvite", title: "Copy the invite link", group: "room", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "ended"],
    description: "Copies a link that opens this room.", tooltip: "Copy a link others can use to join this table.", keywords: ["share", "url", "code", "invite"], params: none,
  }),
  define({
    id: "ui.goHome", title: "Go to the front page", group: "room", runs: "client", effect: "read", confirm: "none", caller: "anyone", contexts: ["lobby", "night", "day", "ended"],
    description: "Leaves the room's page without giving up the seat.", tooltip: "Back to the front page. You keep your seat.", keywords: ["home", "back", "exit"], params: none,
  }),
] as const satisfies readonly CommandDef[];

export type CommandId = (typeof COMMANDS)[number]["id"];
export const COMMAND: Record<string, CommandDef> = Object.fromEntries(COMMANDS.map(c => [c.id, c]));

const PHASE_WORDS: Record<Phase, string> = { home: "on the front page", lobby: "in the lobby", night: "at night", day: "during the day", ended: "after the game" };
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
