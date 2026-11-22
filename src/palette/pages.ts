/**
 * How the palette collects a command's arguments: nested pages (pick one from a list, fill one field, read a text).
 * A command with no entry here and no parameters runs on Enter. The registry says WHAT can be done; this file only
 * says how a person at a keyboard supplies the arguments.
 */
import { availability, COMMAND, GRANTS, TIMERS, type CommandId, type Grant } from "../../shared/commands";
import { isAuto, legalTargets, type Decision } from "../../shared/engine";
import { CENTER_MAX, CENTER_MIN, legalRoles, pickCount, ROLE, ROLES, roleName, sameSlot, TEAM_NAME, type RoleDef, type RoleId, type Shape, type Slot, type StepDef } from "../../shared/roles";
import { describeRules, RULE_DEF, type RuleId } from "../../shared/settings";
import { isCopier } from "../app/teams";
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

const shapeOf = (v: View): Shape => ({ players: v.players.length, center: v.settings.centerCount, deck: v.settings.deck, mandatory: v.settings.rules.mandatorySteps });
/** Other seated players, as options. */
const seatOptions = (v: View | null | undefined, extra?: (seat: number) => string | undefined) =>
  (v?.players ?? []).filter(p => !p.me).map(p => ({ id: String(p.seat), label: `${p.name} (seat ${p.seat})`, detail: extra?.(p.seat) ?? (p.bot ? "Practice bot" : undefined) }));

/** The single-target decisions of a step (and Skip / Do it). Steps with several targets are picked one page per target. */
function decisions(step: StepDef, seat: number, shape: Shape): Decision[] {
  const out: Decision[] = step.pick && pickCount(step, shape) === 1 ? legalTargets(step, seat, shape).map(t => ({ kind: "pick" as const, targets: [t] })) : step.pick ? [] : [{ kind: "do" }];
  if (step.optional && !shape.mandatory) out.push({ kind: "skip" });
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

const message = (id: "chat.send" | "chat.sendSigned", env: PageEnv, confirm?: string): Page => ({
  kind: "field", title: COMMAND[id].title, label: "Message", placeholder: "Up to 600 characters",
  validate: t => (!t.trim() ? "Write something first." : t.trim().length > 600 ? "600 characters at most." : null),
  onSubmit: async (t): Promise<Page | void> => {
    if (confirm) return { kind: "pick", title: "Post it?", options: [{ id: "post", label: `Post: “${t.trim().slice(0, 60)}${t.trim().length > 60 ? "…" : ""}”`, detail: confirm, confirm: "Press ↵ again to post it. You can only do this once." }], onPick: async () => { await env.exec(id, { text: t.trim() }); } };
    await env.exec(id, { text: t.trim() });
  },
});

export const PAGES: Partial<Record<CommandId, (env: PageEnv) => Page>> = {
  "room.create": env => ({
    kind: "field", title: "Create a room", label: "Your name", placeholder: "What should the table call you?", initial: savedName(),
    validate: v => (v.trim().length < 1 ? "Enter a name." : v.trim().length > 24 ? "24 characters at most." : null),
    onSubmit: name => {
      saveName(name.trim());
      return { kind: "pick", title: "What kind of table?", options: [{ id: "plain", label: "An ordinary table", detail: "Random deals" }, { id: "playtest", label: "A play-test table", detail: "Shown to everyone: the host may fix the deal and sees every card" }],
        onPick: async k => { await env.exec("room.create", { name: name.trim(), ...(k === "playtest" ? { playtest: true } : {}) }); } };
    },
  }),
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
  "chat.forgeSeal": env => ({
    kind: "pick", title: "Which seal to forge",
    options: (["signet", "notary"] as const).map(r => ({ id: r, label: `The ${roleName(r)}'s seal`, detail: r === "signet" ? "A free-text message" : "A report: at night, a player's card was a role", unavailable: env.view?.settings.deck.includes(r) ? undefined : `There is no ${roleName(r)} in this deck: its seal would give you away.` })),
    onPick: as => as === "signet"
      ? { kind: "field", title: "Forge the Signet's seal", label: "Message", placeholder: "Up to 600 characters", validate: t => (!t.trim() ? "Write something first." : null),
          onSubmit: t => ({ kind: "pick", title: "Post it?", options: [{ id: "post", label: `Post: “${t.trim().slice(0, 60)}”`, detail: "Identical to a real seal until the game ends.", confirm: "Press ↵ again to post it. You can only do this once." }], onPick: async () => { await env.exec("chat.forgeSeal", { as, text: t.trim() }); } }) }
      : { kind: "pick", title: "Whose card the report names", options: seatOptions(env.view), onPick: seat => ({
          kind: "pick", title: "The role it says they had", options: [...new Set(env.view?.settings.deck ?? [])].map(r => ({ id: r, label: roleName(r), confirm: "Press ↵ again to post the forged report. You can only do this once." })),
          onPick: async card => { await env.exec("chat.forgeSeal", { as, seat: Number(seat), card }); },
        }) },
  }),
  "setup.setRule": env => {
    const v = env.view!;
    return {
      kind: "pick", title: "Change a table rule",
      options: describeRules(v.settings.rules).map(r => ({ id: r.rule, label: r.title, detail: `Now ${typeof r.value === "boolean" ? (r.value ? "on" : "off") : String(r.value)}${r.isDefault ? "" : " (changed)"}: ${r.means}` })),
      onPick: id => {
        const def = RULE_DEF[id as RuleId];
        const set = async (value: unknown) => { await env.exec("setup.setRule", { rule: id, value }); };
        if (def.kind === "boolean") return { kind: "pick", title: def.title, options: [{ id: "on", label: "On", detail: def.on }, { id: "off", label: "Off", detail: def.off }], onPick: o => set(o === "on") };
        if (def.kind === "choice") return { kind: "pick", title: def.title, options: def.options.map(o => ({ id: o.value, label: o.value, detail: o.means })), onPick: o => set(o) };
        return { kind: "field", title: def.title, label: `${def.min} to ${def.max}`, initial: String(v.settings.rules[id as RuleId]), validate: x => (/^\d+$/.test(x.trim()) && +x >= def.min && +x <= def.max ? null : `A whole number from ${def.min} to ${def.max}.`), onSubmit: x => set(Number(x)) };
      },
    };
  },
  "setup.fixDeal": env => {
    const num = (x: string) => (/^\d+$/.test(x.trim()) ? null : "A whole number.");
    return {
      kind: "pick", title: "Fix the next deal",
      options: [
        { id: "seed", label: "Repeat a deal from a seed", detail: "Seating and shuffle follow the seed" },
        { id: "scenario", label: "Replay a scenario: deal seed and night seed", detail: "Every random draw of the night and the count repeats too" },
        { id: "seats", label: "Fix the seating in joining order", detail: (env.view?.players ?? []).map(p => p.name).join(", ") },
        { id: "cards", label: "Choose who is dealt what…", detail: "In the lobby panel, under “Fix the next deal”" },
      ],
      onPick: (o): Page | Promise<void> => {
        if (o === "cards") return { kind: "info", title: "Choose who is dealt what", lines: ["Open the side panel in the lobby: “Fix the next deal” lets you set the seating and choose a card for every seat; the centre takes the rest of the deck."] };
        if (o === "seats") return env.exec("setup.fixDeal", { seats: (env.view?.players ?? []).map(p => p.id) }).then(() => undefined);
        return { kind: "field", title: "Deal seed", label: "Seed", validate: num, onSubmit: seed => (o === "seed" ? env.exec("setup.fixDeal", { seed: Number(seed) }).then(() => undefined)
          : { kind: "field", title: "Night seed", label: "Night seed", validate: num, onSubmit: async night => { await env.exec("setup.fixDeal", { seed: Number(seed), nightSeed: Number(night) }); } }) };
      },
    };
  },
  "day.ready": env => {
    const ready = !!env.view?.context.ready;
    return { kind: "pick", title: "Ready to vote?", options: [{ id: "yes", label: "I am ready to vote", detail: ready ? "You are already ready" : "The vote opens when everyone is ready" }, { id: "no", label: "Not ready yet", detail: ready ? "Take it back" : "You are not marked ready" }], onPick: async o => { await env.exec("day.ready", { ready: o === "yes" }); } };
  },
  "day.cutLine": env => ({
    kind: "pick", title: "Cut a player off", options: seatOptions(env.view).map(o => ({ ...o, confirm: `Press ↵ again to cut ${o.label} off. You can only do this once.` })),
    onPick: async seat => { await env.exec("day.cutLine", { seat: Number(seat) }); },
  }),
  "day.queueSwap": env => ({
    kind: "pick", title: "Swap: the first player", options: seatOptions(env.view),
    onPick: a => ({ kind: "pick", title: "Swap: the second player", options: seatOptions(env.view).filter(o => o.id !== a), onPick: async b => { await env.exec("day.queueSwap", { a: Number(a), b: Number(b) }); } }),
  }),
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
    const ctx = v.context;
    /** Every step that can be decided now: your own, and a copier's plans per role it might become. */
    const entries: { role: RoleDef; step: StepDef; as?: RoleId }[] = (ROLE[mine.dealt].steps ?? []).filter(s => ctx.openSteps.includes(s.id)).map(step => ({ role: ROLE[mine.dealt], step }));
    if (isCopier(mine.dealt)) {
      const roles = ctx.adoptOpen === "any" ? [...new Set(v.settings.deck)].filter(r => ROLE[r]?.steps && !isCopier(r)) : ctx.adoptOpen;
      for (const r of roles) for (const step of ROLE[r]?.steps ?? []) if (!isAuto(step) && (ctx.adoptOpen === "any" || (mine.adoptProgress?.step ?? 0) <= (ROLE[r].steps ?? []).indexOf(step))) entries.push({ role: ROLE[r], step, as: r });
    }
    const send = async (e: (typeof entries)[number], d: Decision) => { await env.exec("night.planStep", { step: e.step.id, plan: { branches: [], otherwise: d }, ...(e.as ? { as: e.as } : {}) }); };
    const title = (e: (typeof entries)[number]) => (e.as ? `If I become the ${roleName(e.as)}: ${e.step.title}` : e.step.title);
    /** Name a role, for a step that names one. */
    const naming = (e: (typeof entries)[number], targets: Slot[] | null): Page => ({
      kind: "pick", title: `${title(e)}: name a role`,
      options: legalRoles(e.step, shape.deck ?? [], e.role.id).map(r => ({ id: r, label: roleName(r), detail: ROLE[r].blurb })),
      onPick: async r => { await send(e, targets ? { kind: "pick", targets, role: r } : { kind: "name", role: r }); },
    });
    /** Targets one page at a time, in order, for a step that takes several. */
    const nth = (e: (typeof entries)[number], picked: Slot[]): Page => {
      const count = pickCount(e.step, shape);
      const options = legalTargets(e.step, mine.seat, shape).filter(t => !picked.some(p => sameSlot(p, t)));
      return {
        kind: "pick", title: count > 1 ? `${title(e)}: ${picked.length + 1} of ${count}` : title(e),
        options: [
          ...options.map(t => ({ id: `${t.k}${t.i}`, label: slotLabel(t, v, mine.seat), detail: picked.length ? `After ${picked.map(p => slotLabel(p, v, mine.seat)).join(" → ")}` : count > 1 ? "First" : "Whatever you see before. Conditions are set in the plan panel." })),
          ...(e.step.optional && !shape.mandatory && !picked.length ? [{ id: "skip", label: e.step.skipLabel ?? "Skip" }] : []),
        ],
        onPick: async id => {
          if (id === "skip") return send(e, { kind: "skip" });
          const t = options.find(o => `${o.k}${o.i}` === id)!;
          const next = [...picked, t];
          if (next.length < count) return nth(e, next);
          if (e.step.names) return naming(e, next);
          await send(e, { kind: "pick", targets: next });
        },
      };
    };
    const forStep = (e: (typeof entries)[number]): Page => {
      if (e.step.pick) return nth(e, []);
      if (e.step.names) return naming(e, null);
      const ds = decisions(e.step, mine.seat, shape);
      return { kind: "pick", title: title(e), options: ds.map((d, i) => ({ id: String(i), label: decisionLabel(d, e.step, v, mine.seat) })), onPick: async i => { await send(e, ds[+i]); } };
    };
    if (entries.length === 1) return forStep(entries[0]);
    const planOf = (e: (typeof entries)[number]) => (e.as ? (mine.adoptPlans as Record<string, Record<string, unknown>>)?.[e.as]?.[e.step.id] : mine.plan[e.step.id]);
    return { kind: "pick", title: "Queue a night move", empty: "Nothing to decide now.", options: entries.map((e, i) => ({ id: String(i), label: title(e), detail: planOf(e) ? "Queued" : "Not decided" })), onPick: i => forStep(entries[+i]) };
  },
  "night.clearStep": env => {
    const v = env.view!, mine = v.game!.mine!;
    const own = (ROLE[mine.dealt].steps ?? []).filter(s => v.context.openSteps.includes(s.id) && mine.plan[s.id]).map(s => ({ id: s.id, label: s.title }));
    const plans = (mine.adoptPlans ?? {}) as Record<string, Record<string, unknown>>;
    const copies = Object.entries(plans).flatMap(([r, p]) => Object.keys(p ?? {}).map(step => ({ id: `${r}:${step}`, label: `If I become the ${roleName(r)}: ${ROLE[r]?.steps?.find(s => s.id === step)?.title ?? step}` })));
    return { kind: "pick", title: "Clear a queued move", empty: "Nothing is queued.", options: [...own, ...copies], onPick: async id => { const [a, b] = id.includes(":") ? id.split(":") : [null, id]; await env.exec("night.clearStep", { step: b, ...(a ? { as: a } : {}) }); } };
  },
  "day.vote": env => ({
    kind: "pick", title: "Vote to eliminate",
    options: (env.view?.players ?? []).filter(p => !p.me).map(p => ({ id: String(p.seat), label: p.name, detail: env.view?.game?.mine?.vote === p.seat ? "Your current vote" : p.bot ? "Practice bot" : undefined })),
    onPick: async seat => { await env.exec("day.vote", { seat: Number(seat) }); },
  }),
};
