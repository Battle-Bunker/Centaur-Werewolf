/** Words for slots, decisions and log entries, in the second person for your own journal and the third for the log. */
import type { Decision, LogEntry } from "../../shared/engine";
import { ROLE, roleName, TEAM_NAME, type Slot, type StepDef } from "../../shared/roles";
import type { View } from "./store";

type Names = Pick<View, "players">;

/** "you", "Alice", "centre card 2". */
export function slotLabel(s: Slot, v: Names, viewer: number): string {
  if (s.k === "c") return `Centre ${s.i + 1}`;
  return s.i === viewer ? "You" : (v.players[s.i]?.name ?? `Seat ${s.i + 1}`);
}
/** "your card", "Alice's card", "centre card 2". */
export function cardOf(s: Slot, v: Names, viewer: number): string {
  if (s.k === "c") return `centre card ${s.i + 1}`;
  return s.i === viewer ? "your card" : `${v.players[s.i]?.name ?? `seat ${s.i + 1}`}'s card`;
}

export function decisionLabel(d: Decision, step: StepDef, v: Names, viewer: number): string {
  if (d.kind === "skip") return step.skipLabel ?? "Skip";
  if (d.kind === "do") return step.doLabel ?? "Do it";
  return d.targets.map(t => slotLabel(t, v, viewer)).join(" + ");
}

const VIA: Record<LogEntry["via"], string> = { auto: "", queued: "queued", live: "chosen live", forced: "random, out of time" };
export const viaLabel = (e: LogEntry) => VIA[e.via];

/** One log entry as a sentence. `viewer` is the seat reading it (-1 for nobody: everything in the third person). */
export function describe(e: LogEntry, v: Names, viewer: number): string {
  const mine = e.seat === viewer;
  const who = mine ? "You" : (v.players[e.seat]?.name ?? `Seat ${e.seat + 1}`);
  const own = (s: Slot) => (!mine && s.k === "p" && s.i === e.seat ? "their own card" : cardOf(s, v, viewer));
  const ev = e.ev;
  switch (ev.kind) {
    case "look": {
      const parts = ev.slots.map((s, i) => `${own(s)}: ${ev.roles ? roleName(ev.roles[i]) : `on the ${TEAM_NAME[ev.teams![i]]} side`}`);
      return `${who} ${ev.roles ? "looked at" : "learned the team of"} ${parts.join("; ")}.`;
    }
    case "swap": return `${who} swapped ${own(ev.a)} and ${own(ev.b)}.`;
    case "seats": {
      const names = ev.seats.map(i => (i === viewer ? "you" : v.players[i]?.name ?? `seat ${i + 1}`));
      if (!names.length) return mine ? `${ev.label}: nobody else. No other player was dealt one.` : `${who} learned that no other player was dealt a Werewolf.`;
      return mine ? `${ev.label}: ${names.join(", ")}.` : `${who} learned who is a Werewolf: ${names.join(", ")}.`;
    }
    case "moved": return `${who} checked the watch: ${ev.slots.map((s, i) => `${own(s)} ${ev.moved[i] ? "was moved" : "was not moved"}`).join("; ")}.`;
    case "skip": {
      const step = ROLE[e.role].steps?.find(s => s.id === e.step);
      return `${who} chose: ${step?.skipLabel ?? "skip"} (${step?.title ?? e.step}).`;
    }
  }
}

export const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));
export function clock(ms: number): string {
  const s = seconds(ms);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}
