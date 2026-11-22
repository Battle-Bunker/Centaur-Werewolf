/**
 * What this viewer knows about each card position, as markers pinned to seats and centre cards on the table: what
 * their own night taught them (from their journal) and what everyone was shown (the Herald's proclamation).
 */
import type { LogEntry } from "../../shared/engine";
import { ROLE, roleName, slotKey, TEAM_NAME, type RoleId, type Slot, type Team } from "../../shared/roles";
import type { View } from "./store";

export interface Marker {
  /** Short words on the pin: "Saw Werewolf", "Moved". */
  label: string;
  /** The sentence behind it, for the tooltip and screen readers. */
  title: string;
  role?: RoleId;
  team?: Team;
  tone: "seen" | "team" | "wolf" | "moved" | "still" | "swap" | "shown" | "omen" | "order";
}

const singular = (label: string) => label.replace(/^(A|An) /, "").replace(/^Werewolves$/, "Werewolf");
const name = (v: View, i: number, viewer: number) => (i === viewer ? "your card" : `${v.players[i]?.name ?? `seat ${i + 1}`}'s card`);
const where = (s: Slot, v: View, viewer: number) => (s.k === "c" ? `centre card ${s.i + 1}` : name(v, s.i, viewer));

export function markersFor(v: View, journal: LogEntry[], viewer: number): Record<string, Marker[]> {
  const out: Record<string, Marker[]> = {};
  const add = (s: Slot, m: Marker) => { (out[slotKey(s)] ??= []).push(m); };
  for (const e of journal) {
    const ev = e.ev;
    if (ev.kind === "look") ev.slots.forEach((s, i) => {
      if (ev.roles) add(s, { label: `Saw ${roleName(ev.roles[i])}`, role: ev.roles[i], team: ROLE[ev.roles[i]].team, tone: "seen", title: `You saw ${roleName(ev.roles[i])} at ${where(s, v, viewer)} (turn ${e.turn}). It may have moved since.` });
      else if (ev.teams) add(s, { label: ev.teams[i] === "lone" ? "Alone" : TEAM_NAME[ev.teams[i]].replace(" team", ""), team: ev.teams[i], tone: "team", title: `You learned ${where(s, v, viewer)} is ${ev.teams[i] === "lone" ? "on no team" : `on the ${TEAM_NAME[ev.teams[i]]}`}.` });
    });
    if (ev.kind === "seats") ev.seats.forEach(i => add({ k: "p", i }, { label: singular(ev.label), tone: "wolf", title: `${ev.label}: dealt to ${v.players[i]?.name ?? `seat ${i + 1}`}.` }));
    if (ev.kind === "swap") for (const s of [ev.a, ev.b]) add(s, { label: "Swapped", tone: "swap", title: `You swapped ${where(ev.a, v, viewer)} and ${where(ev.b, v, viewer)}.` });
    if (ev.kind === "rotate") ev.slots.forEach((s, i) => add(s, { label: `Stampede ${i + 1}`, tone: "order", title: `Your stampede: this card went on to ${where(ev.slots[(i + 1) % ev.slots.length], v, viewer)}.` }));
    if (ev.kind === "moved") ev.slots.forEach((s, i) => add(s, ev.moved[i] ? { label: "Moved", tone: "moved", title: `${where(s, v, viewer)} was moved during the night.` } : { label: "Not moved", tone: "still", title: `${where(s, v, viewer)} was not moved during the night.` }));
    if (ev.kind === "predict" && ev.seat >= 0) add({ k: "p", i: ev.seat }, { label: "Foretold", tone: "omen", title: "You foretold this player will be eliminated." });
  }
  for (const sh of v.game?.shown ?? []) add(sh.slot, { label: `Shown ${roleName(sh.role)}`, role: sh.role, team: ROLE[sh.role].team, tone: "shown", title: `Shown to everyone as ${roleName(sh.role)} during the Herald's turn. It may have moved since.` });
  return out;
}

/** Facts that are not about one card: counts, a prophecy of "nobody". */
export function looseFacts(journal: LogEntry[]): string[] {
  const out: string[] = [];
  for (const e of journal) {
    if (e.ev.kind === "count") out.push(`${e.ev.label}: ${e.ev.n}`);
    if (e.ev.kind === "predict" && e.ev.seat === -1) out.push("You foretold that nobody will be eliminated.");
  }
  return out;
}
