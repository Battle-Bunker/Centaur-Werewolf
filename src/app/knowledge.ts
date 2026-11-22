/**
 * What this viewer knows about each card position, as markers pinned to seats and centre cards on the table: what
 * their own night taught them (from their journal), what everyone was shown (proclamations at dawn) and the public
 * marks (the egg). Driven by the log's event kinds, not by card ids; an event kind this file does not know pins
 * nothing and still reads as a sentence in the journal (shared/text.ts).
 */
import type { LogEntry, LogEvent } from "../../shared/engine";
import { ROLE, roleName, slotKey, type RoleId, type Slot, type Team } from "../../shared/roles";
import type { View } from "./store";
import { teamShort } from "./teams";

export interface Marker {
  /** Short words on the pin: "Saw Werewolf", "Moved". */
  label: string;
  /** The sentence behind it, for the tooltip and screen readers. */
  title: string;
  role?: RoleId;
  team?: Team;
  tone: "seen" | "team" | "kin" | "moved" | "still" | "swap" | "shown" | "mark" | "order" | "veil" | "bite" | "heard";
}

const who = (v: View, i: number, viewer: number) => (i === viewer ? "your card" : `${v.players[i]?.name ?? `seat ${i}`}'s card`);
const where = (s: Slot, v: View, viewer: number) => (s.k === "c" ? `centre card ${s.i + 1}` : who(v, s.i, viewer));
/** "The Phoenix (as dealt)" → "Phoenix", "Fellow Kindlers" → "Kindler", "The pack" → "Pack". */
const pinWord = (label: string) => {
  const w = label.replace(/\s*\(.*\)$/, "").replace(/^(A|An|The|Your|Fellow)\s+/i, "");
  const one = /^\w+$/.test(w) ? w.replace(/(\w\w)s$/, "$1") : w;
  return one.charAt(0).toUpperCase() + one.slice(1);
};

/** Markers for one event. `heard`: copied from someone else's night (the Eavesdropper), so marked as such. */
function eventMarkers(ev: LogEvent, e: LogEntry, v: View, viewer: number, add: (s: Slot, m: Marker) => void, heard = false) {
  const pre = heard ? "Heard: " : "";
  const tone = (t: Marker["tone"]): Marker["tone"] => (heard ? "heard" : t);
  switch (ev.kind) {
    case "look":
      ev.slots.forEach((s, i) => {
        if (ev.roles) add(s, { label: `${pre}${heard ? "" : "Saw "}${roleName(ev.roles[i])}`, role: ev.roles[i], team: ROLE[ev.roles[i]]?.team, tone: tone("seen"), title: `${heard ? "Overheard: the card" : "You saw"} ${roleName(ev.roles[i])} at ${where(s, v, viewer)} (night turn ${e.turn}). It may have moved since${heard ? "" : ", and a look can be misled"}.` });
        else if (ev.teams) add(s, { label: `${pre}${teamShort(ev.teams[i])}`, team: ev.teams[i], tone: tone("team"), title: `${heard ? "Overheard" : "You learned"}: ${where(s, v, viewer)} is on the ${teamShort(ev.teams[i])} side.` });
      });
      return;
    case "seats":
      ev.seats.forEach(i => add({ k: "p", i }, { label: `${pre}${pinWord(ev.label)}`, tone: tone("kin"), title: `${ev.label}: ${v.players[i]?.name ?? `seat ${i}`} (as dealt; the card may have moved since).` }));
      return;
    case "swap":
      for (const s of [ev.a, ev.b]) add(s, { label: `${pre}Swapped`, tone: tone("swap"), title: `${heard ? "Overheard: swapped" : "You swapped"} ${where(ev.a, v, viewer)} and ${where(ev.b, v, viewer)}.` });
      return;
    case "rotate":
      ev.slots.forEach((s, i) => add(s, { label: `${pre}Stampede ${i + 1}`, tone: tone("order"), title: `The stampede: this card went on to ${where(ev.slots[(i + 1) % ev.slots.length], v, viewer)}.` }));
      return;
    case "moved":
      ev.slots.forEach((s, i) => add(s, ev.moved[i] ? { label: `${pre}Moved`, tone: tone("moved"), title: `${where(s, v, viewer)} was moved during the night (so far, when checked).` } : { label: `${pre}Not moved`, tone: tone("still"), title: `${where(s, v, viewer)} had not been moved when checked.` }));
      return;
    case "distort":
      if (ev.slot) add(ev.slot, { label: ev.role ? `Shows ${roleName(ev.role)}` : "Led astray", role: ev.role ?? undefined, tone: "veil", title: `You distorted ${where(ev.slot, v, viewer)}: until dawn every look at it shows ${ev.role ? roleName(ev.role) : "a random wrong role"}.` });
      else if (ev.viewer !== undefined) add({ k: "p", i: ev.viewer }, { label: "Veiled", tone: "veil", title: `You veiled ${v.players[ev.viewer]?.name ?? "this player"}'s eyes: tonight every centre card they look at shows ${ev.role ? roleName(ev.role) : "a random wrong role"}.` });
      return;
    case "witness":
      ev.slots.forEach((s, i) => add(s, { label: `Proclaimed ${roleName(ev.roles[i])}`, role: ev.roles[i], tone: "shown", title: `You saw the ${roleName(ev.by)}'s proclamation: ${where(s, v, viewer)} was ${roleName(ev.roles[i])}.` }));
      return;
    case "forge":
      ev.slots.forEach((s, i) => add(s, { label: `Forged ${roleName(ev.roles[i])}`, role: ev.roles[i], tone: "veil", title: `Your forgery: published at dawn as the ${roleName(ev.as)}'s, saying ${where(s, v, viewer)} is ${roleName(ev.roles[i])}.` }));
      return;
    case "overhear":
      for (const c of ev.copied) eventMarkers(c.ev, e, v, viewer, add, true);
      return;
    case "bite":
      if (ev.took) add({ k: "p", i: ev.seat }, { label: "Bitten", tone: "bite", title: `You bit ${v.players[ev.seat]?.name ?? "this player"}: they join the Werewolf team at dawn.` });
      return;
    case "mark":
      if (!ev.public) add({ k: "p", i: ev.seat }, { label: pinWord(ev.label), tone: "mark", title: `${ev.label}: on ${v.players[ev.seat]?.name ?? `seat ${ev.seat}`}. It stays with the card that made it.` });
      return;
    default:
      return;
  }
}

export function markersFor(v: View, journal: LogEntry[], viewer: number): Record<string, Marker[]> {
  const out: Record<string, Marker[]> = {};
  const add = (s: Slot, m: Marker) => { (out[slotKey(s)] ??= []).push(m); };
  for (const e of journal) eventMarkers(e.ev, e, v, viewer, add);
  for (const sh of v.game?.shown ?? []) {
    add(sh.slot, { label: `Shown ${roleName(sh.role)}`, role: sh.role, team: ROLE[sh.role]?.team, tone: "shown", title: `Proclaimed to everyone${sh.atDawn ? " at dawn" : ""} as ${roleName(sh.role)} (the ${roleName(sh.by)}'s turn). True at that moment unless forged or distorted; it may have moved since.` });
  }
  for (const m of v.game?.marks ?? []) {
    add({ k: "p", i: m.seat }, { label: pinWord(m.label), tone: "mark", title: `${m.label} lies on ${v.players[m.seat]?.name ?? `seat ${m.seat}`}: everyone sees it, nobody knows who laid it.` });
  }
  return out;
}

/** Facts that are not about one card: counts, the census, what was heard of nobody. */
export function looseFacts(journal: LogEntry[]): string[] {
  const out: string[] = [];
  for (const e of journal) {
    if (e.ev.kind === "count") out.push(`${e.ev.label}: ${e.ev.n}`);
    if (e.ev.kind === "census") out.push(`In the centre (dealt, not where): ${e.ev.roles.map(roleName).join(", ")}${e.ev.roles.length < e.ev.of ? ` (${e.ev.roles.length} of ${e.ev.of})` : ""}.`);
  }
  return out;
}

/** Private dawn notices to this player: their team changed, their card changed, what they became. */
export function notices(v: View): { tone: "bite" | "phoenix" | "copy"; title: string; text: string; role?: RoleId }[] {
  const mine = v.game?.mine;
  if (!mine) return [];
  const out: ReturnType<typeof notices> = [];
  if (mine.status.became) out.push({ tone: "copy", role: mine.status.became, title: `You became the ${roleName(mine.status.became)}`, text: `Your card is a copy of the ${roleName(mine.status.became)} for the rest of the game: its team, its win, its powers.` });
  if (mine.status.bitten) {
    const e = mine.journal.find(x => x.ev.kind === "bitten");
    const by = e?.ev.kind === "bitten" ? e.ev.by : null;
    out.push({ tone: "bite", title: "You were bitten", text: `${by === null ? "" : `${v.players[by]?.name ?? `Seat ${by}`} bit you. `}You now win only with the Werewolf team, whatever card you hold. You are not a Werewolf.` });
  }
  if (mine.status.heir) out.push({ tone: "phoenix", role: "phoenix", title: "Your card became a Phoenix", text: "No player held a Phoenix at dawn, so the Heir's card you hold has become one. If you are eliminated, the Pyre wins." });
  return out;
}
