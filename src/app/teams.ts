/**
 * Teams and what a deck means for what players see, all derived from the role data (shared/roles.ts), so a new or
 * amended card needs no change here.
 */
import { NIGHT_ROLES, ROLE, ROLES, TEAM_NAME, type RoleDef, type RoleId, type Team } from "../../shared/roles";
import { turnKey } from "../../shared/engine";

/** Every team, in the order the roster introduces them. */
export const TEAMS: Team[] = [...new Set(ROLES.map(r => r.team))];
/** "Werewolf", "Centaur", "Pyre", "Loner". */
export const teamShort = (t: Team) => TEAM_NAME[t]?.replace(/ team$/, "").replace(/ \(.*\)$/, "") ?? t;
/** "the Werewolf team", "the Pyre", "a loner". */
export const teamPhrase = (t: Team) => (t === "loner" ? "a loner" : `the ${TEAM_NAME[t]?.replace(/ \(.*\)$/, "") ?? t}`);
/** One line under each team's heading in the deck builder and the role book. */
export const TEAM_NOTE: Partial<Record<Team, string>> = {
  werewolf: "Werewolves and their allies. They win if no Werewolf is eliminated (or, with Blood Price, no more Werewolves than Centaurs).",
  centaur: "The herd. They win by eliminating a Werewolf.",
  pyre: "A Phoenix that wants to burn, and the Kindlers who win when it does.",
  loner: "Each wins by its own rule, alongside whoever else wins.",
};

/** Whether a role takes part in the night (has a turn of its own or a shared one). */
export const actsAtNight = (r: RoleDef) => !!r.steps && r.wake !== undefined;
/** The roles that act in a public night turn (the turn's own role, its shadow twins, its shared-turn kin). */
export const rolesInTurn = (turn: RoleId, deck?: RoleId[]) => ROLES.filter(r => actsAtNight(r) && turnKey(r.id) === turn && (!deck || deck.includes(r.id))).map(r => r.id);
/** The public night order of the whole roster, for "wakes nth of n". */
export const ROSTER_TURNS = [...new Set(NIGHT_ROLES.map(r => turnKey(r.id)))];

const effects = (r: RoleDef) => (r.steps ?? []).flatMap(s => s.effects);
export const isCopier = (id: RoleId) => effects(ROLE[id] ?? ({} as RoleDef)).some(e => e.kind === "adopt");
/** Roles in a deck whose day chat power forges a seal. */
export const sealForgers = (deck: RoleId[]) => [...new Set(deck)].filter(r => ROLE[r]?.chat === "forge");
/** Roles in a deck that forge a proclamation at night. */
export const proclamationForgers = (deck: RoleId[]) => [...new Set(deck)].filter(r => ROLE[r] && effects(ROLE[r]).some(e => e.kind === "forge"));
/** Roles in a deck that cut a player off in the day. */
export const cutters = (deck: RoleId[]) => [...new Set(deck)].filter(r => ROLE[r]?.dayPower === "cut");
const names = (ids: RoleId[]) => ids.map(r => ROLE[r]?.name ?? r).join(", ");

/** What can mislead at this table: one short warning per mechanic in the deck. */
export function deckWarnings(deck: RoleId[]): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  const ids = [...new Set(deck)].filter(r => ROLE[r]);
  const by = (pred: (r: RoleDef) => boolean) => ids.filter(r => pred(ROLE[r]));
  const seals = sealForgers(deck), procs = proclamationForgers(deck);
  if (seals.length) out.push({ key: "seal", text: `Seals can be forged here (${names(seals)}): a sealed message may be false, and looks exactly like a real one until the game ends.` });
  if (procs.length) out.push({ key: "proclaim", text: `Proclamations can be forged here (${names(procs)}): one published at dawn may be false.` });
  const distort = by(r => effects(r).some(e => e.kind === "distort"));
  if (distort.length) out.push({ key: "distort", text: `Looks can lie here (${names(distort)}): what someone saw may not be what was there, and they are never told.` });
  const twins = by(r => !!r.twinOf);
  if (twins.length) out.push({ key: "twin", text: `Shadow twins here (${names(twins)}): a true account of a role's night does not prove its team.` });
  const copiers = by(r => effects(r).some(e => e.kind === "adopt"));
  if (copiers.length) out.push({ key: "copy", text: `Copiers here (${names(copiers)}): two players can truthfully claim the same role.` });
  const movers = by(r => effects(r).some(e => e.kind === "swap" || e.kind === "rotate"));
  if (movers.length) out.push({ key: "move", text: `Cards move here (${names(movers)}): yours may have been moved without your knowing.` });
  const cut = cutters(deck);
  if (cut.length) out.push({ key: "cut", text: `${names(cut)}: a player who drops offline may have lost their connection, or may have been cut off. Only the results say which.` });
  return out;
}
