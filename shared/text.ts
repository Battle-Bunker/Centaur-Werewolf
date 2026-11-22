/** Words for slots, decisions and log entries, in the second person for your own journal and the third for the log. */
import type { Decision, LogEntry, LogEvent } from "./engine";
import { ROLE, roleName, TEAM_NAME, type RoleId, type Slot, type StepDef } from "./roles";

/** All the wording needs of a table: its players' names by seat. */
export interface Names { players: { name: string }[] }

/** "Alice (seat 2)": a seat always comes with its number, so it can be used as an argument straight away. */
export const seatName = (i: number, v: Names) => `${v.players[i]?.name ?? "Seat"} (seat ${i})`;

/** "you", "Alice (seat 2)", "centre card 2". */
export function slotLabel(s: Slot, v: Names, viewer: number): string {
  if (s.k === "c") return `Centre ${s.i + 1}`;
  return s.i === viewer ? "You" : seatName(s.i, v);
}
/** "your card", "Alice (seat 2)'s card", "centre card 2". */
export function cardOf(s: Slot, v: Names, viewer: number): string {
  if (s.k === "c") return `centre card ${s.i + 1}`;
  return s.i === viewer ? "your card" : `${seatName(s.i, v)}'s card`;
}

export function decisionLabel(d: Decision, step: StepDef, v: Names, viewer: number): string {
  if (d.kind === "skip") return step.skipLabel ?? "Skip";
  if (d.kind === "do") return step.doLabel ?? "Do it";
  if (d.kind === "name") return roleName(d.role);
  return `${d.targets.map(t => slotLabel(t, v, viewer)).join(" + ")}${d.role ? ` as ${roleName(d.role)}` : ""}`;
}

const VIA: Record<LogEntry["via"], string> = { auto: "", queued: "queued", live: "chosen live", forced: "random, out of time" };
export const viaLabel = (e: LogEntry) => VIA[e.via];

const teamWords = (t: keyof typeof TEAM_NAME) => (t === "loner" ? "a loner (wins alone)" : t === "pyre" ? "of the Pyre" : `on the ${TEAM_NAME[t]}`);
const seatWord = (i: number, v: Names, viewer: number) => (i === viewer ? "you" : seatName(i, v));

/**
 * One event as a sentence. `who` is the subject ("You", "Bo (seat 1)", "The Sage"); `self` is the actor's seat (whose
 * card is "their own card" in the third person); `viewer` is the seat reading (-1: nobody).
 */
function sentence(ev: LogEvent, role: RoleId, step: string, who: string, self: number, mine: boolean, v: Names, viewer: number): string {
  const own = (s: Slot) => (!mine && s.k === "p" && s.i === self ? "their own card" : cardOf(s, v, viewer));
  switch (ev.kind) {
    case "look": {
      const parts = ev.slots.map((s, i) => `${own(s)}: ${ev.roles ? roleName(ev.roles[i]) : teamWords(ev.teams![i])}`);
      return `${who} ${ev.roles ? "looked at" : "learned the team of"} ${parts.join("; ")}.`;
    }
    case "swap": return `${who} swapped ${own(ev.a)} and ${own(ev.b)}.`;
    case "seats": {
      const names = ev.seats.map(i => seatWord(i, v, viewer));
      if (mine) return names.length ? `${ev.label}: ${names.join(", ")}.` : `${ev.label}: nobody else. No other player was dealt one.`;
      return `${who} learned "${ev.label}": ${names.join(", ") || "nobody else"}.`;
    }
    case "moved": return `${who} checked the watch: ${ev.slots.map((s, i) => `${own(s)} ${ev.moved[i] ? "was moved" : "was not moved"}`).join("; ")}.`;
    case "rotate": return `${who} stampeded three cards: ${ev.slots.map(s => own(s)).join(" → ")} → back to the first.`;
    case "announce": return `${who} proclaimed ${ev.slots.map((s, i) => `${own(s)}: ${roleName(ev.roles[i])}`).join("; ")}. ${ev.atDawn ? "Everyone is shown this at dawn, with any other proclamation." : "Everyone was shown this."}`;
    case "count": return mine ? `${ev.label}: ${ev.n}.` : `${who} counted ${ev.n} ${ev.label.toLowerCase()}.`;
    case "census": return `${who === "You" ? "The census" : `${who}'s census`}: ${ev.roles.length < ev.of ? `${ev.roles.length} of the ${ev.of} roles dealt to the centre` : `the ${ev.of} roles dealt to the centre`} are ${ev.roles.map(roleName).join(", ")} (not where).`;
    case "distort":
      if (ev.slot) return `${who} distorted ${own(ev.slot)}: until dawn every look at it shows ${ev.role ? roleName(ev.role) : "a random wrong role"}.`;
      return `${who} veiled ${seatWord(ev.viewer!, v, viewer)}'s eyes: tonight every centre card they look at shows ${ev.role ? roleName(ev.role) : "a random wrong role"}.`;
    case "cut": return `${who} cut ${seatWord(ev.seat, v, viewer)} off for ${Math.round((ev.until - ev.from) / 1000)} seconds, as if their connection had dropped.`;
    case "witness": return ev.roles.length ? `${who} saw the ${roleName(ev.by)}'s proclamation: ${ev.slots.map((s, i) => `${cardOf(s, v, viewer)}: ${roleName(ev.roles[i])}`).join("; ")}.` : `${who} saw that the ${roleName(ev.by)} proclaimed nothing tonight.`;
    case "forge": return `${who} forged a proclamation: ${ev.slots.map((s, i) => `${cardOf(s, v, viewer)}: ${roleName(ev.roles[i])}`).join("; ")}. At dawn it is published as the ${roleName(ev.as)}'s.`;
    case "overhear": {
      const name = roleName(ev.role);
      if (!ev.copied.length) return `${who} listened for the ${name} and heard nothing.`;
      const lines = ev.copied.map(c => sentence(c.ev, ev.role, c.step, `The ${name}`, -2, false, v, viewer));
      return `${who} overheard the ${name}: ${lines.join(" ")}`;
    }
    case "bite": return ev.took ? `${who} bit ${seatWord(ev.seat, v, viewer)}: at dawn they join the Werewolf team.` : `${who} went to bite ${seatWord(ev.seat, v, viewer)}, but their card is already on the Werewolf team, so nothing happened.`;
    case "mark":
      if (ev.unheld) return `Nobody held the ${roleName(role)}, so the game laid ${ev.label.toLowerCase()} on ${seatWord(ev.seat, v, viewer)} at random. It benefits nobody.`;
      return `${who} ${ev.public ? "laid" : "made"} ${ev.label.toLowerCase().replace(/^your /, mine ? "your " : "their ")} on ${seatWord(ev.seat, v, viewer)}${ev.public ? ". Everyone sees the egg at dawn, but not who laid it" : ""}.`;
    case "bitten": return mine ? `At dawn: you were bitten${ev.by === null ? "" : ` by ${seatWord(ev.by, v, viewer)}`}. You now win only with the Werewolf team. You are not a Werewolf, and you lose any creature rules.` : `${who} ${who === "You" ? "were" : "was"} bitten${ev.by === null ? "" : ` by ${seatWord(ev.by, v, viewer)}`} and joined the Werewolf team.`;
    case "heir": return mine ? "At dawn: no player held a Phoenix, so the card you hold (an Heir's) has become a Phoenix. If you are eliminated, the Pyre wins." : `${who} held an Heir's card, which became a Phoenix at dawn (no player held one).`;
    case "adopt": return `${who} became a copy of the ${roleName(ev.role)}${mine ? ": from now on you are that role (team, win, powers) and act in its turn" : ""}.`;
    case "void": return mine ? ev.why : `${who}: ${ev.why.replace(/\byou were\b/g, "they were").replace(/\byou\b/g, "they")}`;
    case "daySwap": return `${who} swapped the cards of ${seatWord(ev.a, v, viewer)} and ${seatWord(ev.b, v, viewer)} as the vote phase ended.`;
    case "skip": {
      const s = ROLE[role]?.steps?.find(x => x.id === step);
      return `${who} chose: ${s?.skipLabel ?? "skip"} (${s?.title ?? step}).`;
    }
  }
}

/** One log entry as a sentence. `viewer` is the seat reading it (-1 for nobody: everything in the third person). */
export function describe(e: LogEntry, v: Names, viewer: number): string {
  const mine = e.seat === viewer && e.seat >= 0;
  const who = e.seat < 0 ? "The game" : mine ? "You" : seatName(e.seat, v);
  let text = sentence(e.ev, e.role, e.step, who, e.seat, mine, v, viewer);
  if (e.cond) text += ` (${mine ? "your" : "their"} plan for having seen ${e.cond.saw.map(roleName).join(", ")}: ${e.cond.branch ? `the branch for ${e.cond.branch.map(roleName).join(" / ")}` : "the \"otherwise\" decision"})`;
  return text;
}

/** What only the post-game log adds to an entry: the truth behind a glamour, where an overheard copy came from. */
export function revealHidden(e: LogEntry, v: Names): string {
  const h = e.hidden;
  if (!h) return "";
  const out: string[] = [];
  if (h.truth) out.push(`truly ${h.truth.map(roleName).join(", ")}`);
  if (h.role) out.push(`it showed ${roleName(h.role)}`);
  if (h.source !== undefined) out.push(h.source === "ghost" ? "nobody held it: a ghost result from their own seat" : h.source === "none" ? "nobody held it" : `copied from ${seatName(h.source, v)}`);
  return out.length ? ` [${out.join("; ")}]` : "";
}

/** How a seat's vote reads in the results: by whom, for whom, and whether the game cast it. */
export function voteLine(seat: number, target: number, random: boolean, v: Names): string {
  return random ? `${seatName(seat, v)} did not vote in time: voted at random for ${seatName(target, v)}.` : `${seatName(seat, v)} voted for ${seatName(target, v)}.`;
}

export const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));
export function clock(ms: number): string {
  const s = seconds(ms);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}
