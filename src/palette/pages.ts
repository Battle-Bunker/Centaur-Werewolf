/**
 * How the palette collects a command's arguments: nested pages (pick one from a list, fill one field, read a text).
 * A command with no entry here and no parameters runs on Enter. The registry says WHAT can be done; this file only
 * says how a person at a keyboard supplies the arguments.
 */
import { availability, COMMAND, GRANTS, TIMERS, type CommandId, type Grant } from "../../shared/commands";
import { legalTargets, type Decision } from "../../shared/engine";
import { CENTER_MAX, CENTER_MIN, pickCount, ROLE, ROLES, sameSlot, TEAM_NAME, type Shape, type Slot, type StepDef } from "../../shared/roles";
import { decisionLabel, slotLabel } from "../../shared/text";
import { savedName, saveName } from "../app/session";
import type { FreshKey, View } from "../app/store";

export interface PickOption {
  id: string; label: string; detail?: string; unavailable?: string;
  /** Ask for a second Enter first, saying this. */
  confirm?: string;
}
export type Page =
  | { kind: "pick"; title: string; options: PickOption[]; empty?: string; onPick(id: string): Page | void | Promise<Page | void> }
  | { kind: "field"; title: string; label: string; placeholder?: string; initial?: string; validate?(value: string): string | null; onSubmit(value: string): Page | void | Promise<Page | void> }
  | { kind: "info"; title: string; lines: string[] };

export interface PageEnv {
  view: View | null | undefined;
  exec(id: CommandId, args?: Record<string, unknown>): Promise<unknown>;
  /** Show a key just made, once, in the Connect dialog. */
  showKey(fresh: FreshKey): void;
}

const nameField = (title: string, onSubmit: (name: string) => Promise<void>): Page => ({
  kind: "field", title, label: "Your name", placeholder: "What should the table call you?", initial: savedName(),
  validate: v => (v.trim().length < 1 ? "Enter a name." : v.trim().length > 24 ? "24 characters at most." : null),
  onSubmit: async v => { saveName(v.trim()); await onSubmit(v.trim()); },
});

const shapeOf = (v: View): Shape => ({ players: v.players.length, center: v.settings.centerCount });

/** The single-target decisions of a step (and Skip / Do it). Steps with several targets are picked one page per target. */
function decisions(step: StepDef, seat: number, shape: Shape): Decision[] {
  const out: Decision[] = step.pick && pickCount(step, shape) === 1 ? legalTargets(step, seat, shape).map(t => ({ kind: "pick" as const, targets: [t] })) : step.pick ? [] : [{ kind: "do" }];
  if (step.optional) out.push({ kind: "skip" });
  return out;
}

const rolePick = (cmd: "setup.addRole" | "setup.removeRole", env: PageEnv): Page => ({
  kind: "pick", title: COMMAND[cmd].title,
  options: ROLES.map(r => {
    const can = env.view ? availability(COMMAND[cmd], env.view.context, { role: r.id }) : { ok: true as const };
    const count = env.view?.settings.deck.filter(x => x === r.id).length ?? 0;
    return { id: r.id, label: r.name, detail: `${TEAM_NAME[r.team]} · ${count} of ${r.max} in the deck`, unavailable: can.ok ? undefined : can.reason };
  }),
  onPick: async role => { await env.exec(cmd, { role }); },
});

const message = (id: "chat.send" | "chat.sendSigned" | "chat.sendUnsigned", env: PageEnv, confirm?: string): Page => ({
  kind: "field", title: COMMAND[id].title, label: "Message", placeholder: "Up to 600 characters",
  validate: t => (!t.trim() ? "Write something first." : t.trim().length > 600 ? "600 characters at most." : null),
  onSubmit: async (t): Promise<Page | void> => {
    if (confirm) return { kind: "pick", title: "Post it?", options: [{ id: "post", label: `Post: “${t.trim().slice(0, 60)}${t.trim().length > 60 ? "…" : ""}”`, detail: confirm, confirm: "Press ↵ again to post it. You can only do this once." }], onPick: async () => { await env.exec(id, { text: t.trim() }); } };
    await env.exec(id, { text: t.trim() });
  },
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
    options: (env.view?.players ?? []).filter(p => !p.me).map(p => ({ id: p.id, label: p.name, detail: p.bot ? "Practice bot" : "Player", confirm: `Press ↵ again to remove ${p.name}.` })),
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
  "setup.setCenter": env => ({
    kind: "pick", title: "Centre cards",
    options: Array.from({ length: CENTER_MAX - CENTER_MIN + 1 }, (_, k) => CENTER_MIN + k).map(n => ({ id: String(n), label: `${n} cards in the centre`, detail: env.view?.settings.centerCount === n ? "Current" : `The deck will need ${(env.view?.players.length ?? 0) + n} cards` })),
    onPick: async n => { await env.exec("setup.setCenter", { count: Number(n) }); },
  }),
  "chat.send": env => message("chat.send", env),
  "chat.sendSigned": env => message("chat.sendSigned", env, "The game will mark it as sent by the player dealt Signet."),
  "chat.sendUnsigned": env => message("chat.sendUnsigned", env, "It will carry no name until the game is over."),
  "connect.createKey": env => ({
    kind: "pick", title: "What may it do?",
    options: (Object.keys(GRANTS) as Grant[]).map(g => {
      const can = env.view ? availability(COMMAND["connect.createKey"], env.view.context, { permission: g }) : { ok: true as const };
      return { id: g, label: GRANTS[g], detail: g === "read" ? "See what you see, nothing more" : g === "act" ? "Plan, chat and vote for you" : "Also run the table as host", unavailable: can.ok ? undefined : can.reason };
    }),
    onPick: g => ({
      kind: "field", title: "Name the key", label: "Label", initial: "My assistant", placeholder: "So you recognise it later",
      validate: t => (!t.trim() ? "Give it a name." : t.trim().length > 40 ? "40 characters at most." : null),
      onSubmit: async t => {
        const r = await env.exec("connect.createKey", { permission: g, label: t.trim() }) as { key: string };
        env.showKey({ key: r.key, permission: g as Grant, label: t.trim() });
      },
    }),
  }),
  "connect.revoke": env => ({
    kind: "pick", title: "Disconnect an assistant", empty: "Nothing is connected to your seat.",
    options: (env.view?.connections ?? []).map(c => ({ id: c.id, label: c.label, detail: `${GRANTS[c.permission as Grant]} · ${c.kind === "oauth" ? "signed in" : "key"}`, confirm: `Press ↵ again to disconnect ${c.label}.` })),
    onPick: async connection => { await env.exec("connect.revoke", { connection }); },
  }),
  "night.planStep": env => {
    const v = env.view!, mine = v.game!.mine!, shape = shapeOf(v);
    const steps = (ROLE[mine.dealt].steps ?? []).filter(s => v.context.openSteps.includes(s.id));
    const send = async (step: StepDef, d: Decision) => { await env.exec("night.planStep", { step: step.id, plan: { branches: [], otherwise: d } }); };
    /** Targets one page at a time, in order, for a step that takes several. */
    const nth = (step: StepDef, picked: Slot[]): Page => {
      const count = pickCount(step, shape);
      const options = legalTargets(step, mine.seat, shape).filter(t => !picked.some(p => sameSlot(p, t)));
      return {
        kind: "pick", title: `${step.title}: ${picked.length + 1} of ${count}`,
        options: [
          ...options.map(t => ({ id: `${t.k}${t.i}`, label: slotLabel(t, v, mine.seat), detail: picked.length ? `After ${picked.map(p => slotLabel(p, v, mine.seat)).join(" → ")}` : "First" })),
          ...(step.optional && !picked.length ? [{ id: "skip", label: step.skipLabel ?? "Skip" }] : []),
        ],
        onPick: async id => {
          if (id === "skip") return send(step, { kind: "skip" });
          const t = options.find(o => `${o.k}${o.i}` === id)!;
          const next = [...picked, t];
          if (next.length < count) return nth(step, next);
          await send(step, { kind: "pick", targets: next });
        },
      };
    };
    const forStep = (step: StepDef): Page => {
      if (pickCount(step, shape) > 1) return nth(step, []);
      const ds = decisions(step, mine.seat, shape);
      return {
        kind: "pick", title: step.title,
        options: ds.map((d, i) => ({ id: String(i), label: decisionLabel(d, step, v, mine.seat), detail: "Whatever you see before. Conditions are set in the plan panel." })),
        onPick: async i => { await send(step, ds[+i]); },
      };
    };
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
    options: (env.view?.players ?? []).filter(p => !p.me).map(p => ({ id: String(p.seat), label: p.name, detail: env.view?.game?.mine?.vote === p.seat ? "Your current vote" : p.bot ? "Practice bot" : undefined })),
    onPick: async seat => { await env.exec("day.vote", { seat: Number(seat) }); },
  }),
};
