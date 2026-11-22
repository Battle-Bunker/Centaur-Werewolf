/**
 * How the palette collects a command's arguments: nested pages (pick one from a list, fill one field, read a text).
 * A command with no entry here and no parameters runs on Enter. The registry says WHAT can be done; this file only
 * says how a person at a keyboard supplies the arguments.
 */
import { availability, COMMAND, TIMERS, type CommandId } from "../../shared/commands";
import { legalTargets, type Decision } from "../../shared/engine";
import { ROLE, ROLES, TEAM_NAME, type StepDef } from "../../shared/roles";
import { savedName, saveName } from "../app/session";
import type { View } from "../app/store";
import { decisionLabel } from "../../shared/text";

export interface PickOption { id: string; label: string; detail?: string; unavailable?: string }
export type Page =
  | { kind: "pick"; title: string; options: PickOption[]; empty?: string; onPick(id: string): Page | void | Promise<Page | void> }
  | { kind: "field"; title: string; label: string; placeholder?: string; initial?: string; validate?(value: string): string | null; onSubmit(value: string): Page | void | Promise<Page | void> }
  | { kind: "info"; title: string; lines: string[] };

export interface PageEnv {
  view: View | null | undefined;
  exec(id: CommandId, args?: Record<string, unknown>): Promise<unknown>;
}

const nameField = (title: string, onSubmit: (name: string) => Promise<void>): Page => ({
  kind: "field", title, label: "Your name", placeholder: "What should the table call you?", initial: savedName(),
  validate: v => (v.trim().length < 1 ? "Enter a name." : v.trim().length > 24 ? "24 characters at most." : null),
  onSubmit: async v => { saveName(v.trim()); await onSubmit(v.trim()); },
});

function decisions(step: StepDef, seat: number, players: number): Decision[] {
  const out: Decision[] = step.pick ? legalTargets(step, seat, players).map(t => ({ kind: "pick" as const, targets: [t] })) : [{ kind: "do" }];
  if (step.optional) out.push({ kind: "skip" });
  return out;
}

const rolePick = (cmd: "setup.addRole" | "setup.removeRole", env: PageEnv): Page => ({
  kind: "pick", title: COMMAND[cmd].title,
  options: ROLES.map(r => {
    const can = env.view ? availability(COMMAND[cmd], env.view.context, { role: r.id }) : { ok: true as const };
    const count = env.view?.settings.deck.filter(x => x === r.id).length ?? 0;
    return { id: r.id, label: r.name, detail: `${TEAM_NAME[r.team]} · ${count} in the deck`, unavailable: can.ok ? undefined : can.reason };
  }),
  onPick: async role => { await env.exec(cmd, { role }); },
});

export const PAGES: Partial<Record<CommandId, (env: PageEnv) => Page>> = {
  "room.create": env => nameField("Create a room", async name => { await env.exec("room.create", { name }); }),
  "room.join": env => ({
    kind: "field", title: "Join a room", label: "Room code", placeholder: "Four letters, e.g. KQXT",
    validate: v => (/^[A-Za-z]{4}$/.test(v.trim()) ? null : "A room code is four letters."),
    onSubmit: code => nameField(`Join room ${code.trim().toUpperCase()}`, async name => { await env.exec("room.join", { code: code.trim().toUpperCase(), name }); }),
  }),
  "room.rename": env => nameField("Change your name", async name => { await env.exec("room.rename", { name }); }),
  "room.remove": env => ({
    kind: "pick", title: "Remove a player", empty: "Nobody else is here.",
    options: (env.view?.players ?? []).filter(p => !p.me).map(p => ({ id: p.id, label: p.name, detail: p.bot ? "Practice bot" : "Player" })),
    onPick: async player => { await env.exec("room.remove", { player }); },
  }),
  "setup.addRole": env => rolePick("setup.addRole", env),
  "setup.removeRole": env => rolePick("setup.removeRole", env),
  "setup.setTimer": env => ({
    kind: "pick", title: "Set a timer",
    options: (Object.keys(TIMERS) as (keyof typeof TIMERS)[]).map(t => ({ id: t, label: TIMERS[t].label, detail: `Now ${env.view?.settings[`${t}Seconds`] ?? "?"} s` })),
    onPick: id => {
      const t = id as keyof typeof TIMERS;
      return {
        kind: "field", title: TIMERS[t].label, label: "Seconds", initial: String(env.view?.settings[`${t}Seconds`] ?? ""),
        validate: v => (/^\d+$/.test(v.trim()) && +v >= TIMERS[t].min && +v <= TIMERS[t].max ? null : `A whole number from ${TIMERS[t].min} to ${TIMERS[t].max}.`),
        onSubmit: async v => { await env.exec("setup.setTimer", { timer: t, seconds: Number(v) }); },
      };
    },
  }),
  "night.planStep": env => {
    const v = env.view!, mine = v.game!.mine!;
    const steps = (ROLE[mine.dealt].steps ?? []).filter(s => v.context.openSteps.includes(s.id));
    const forStep = (step: StepDef): Page => ({
      kind: "pick", title: step.title,
      options: decisions(step, mine.seat, v.players.length).map((d, i) => ({ id: String(i), label: decisionLabel(d, step, v, mine.seat), detail: "Whatever you saw before. Conditions are set in the plan panel." })),
      onPick: async i => { await env.exec("night.planStep", { step: step.id, plan: { branches: [], otherwise: decisions(step, mine.seat, v.players.length)[+i] } }); },
    });
    if (steps.length === 1) return forStep(steps[0]);
    return { kind: "pick", title: "Queue a night move", options: steps.map(s => ({ id: s.id, label: s.title, detail: mine.plan[s.id] ? "Queued" : "Not decided" })), onPick: id => forStep(steps.find(s => s.id === id)!) };
  },
  "night.clearStep": env => {
    const v = env.view!, mine = v.game!.mine!;
    const steps = (ROLE[mine.dealt].steps ?? []).filter(s => v.context.openSteps.includes(s.id) && mine.plan[s.id]);
    return { kind: "pick", title: "Clear a queued move", empty: "Nothing is queued.", options: steps.map(s => ({ id: s.id, label: s.title })), onPick: async step => { await env.exec("night.clearStep", { step }); } };
  },
  "day.vote": env => ({
    kind: "pick", title: "Vote to eliminate",
    options: (env.view?.players ?? []).filter(p => !p.me).map(p => ({ id: String(p.seat), label: p.name, detail: env.view?.game?.mine?.vote === p.seat ? "Your current vote" : undefined })),
    onPick: async seat => { await env.exec("day.vote", { seat: Number(seat) }); },
  }),
  "ui.showRoles": () => ({
    kind: "pick", title: "Roles",
    options: ROLES.map(r => ({ id: r.id, label: r.name, detail: `${TEAM_NAME[r.team]} · ${r.blurb}` })),
    onPick: id => ({ kind: "info", title: ROLE[id].name, lines: [`Team: ${TEAM_NAME[ROLE[id].team]}.`, ROLE[id].rules, ROLE[id].wake !== undefined ? "Takes a turn at night." : "Sleeps through the night."] }),
  }),
};
