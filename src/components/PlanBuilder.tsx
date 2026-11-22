/**
 * The night plan: decide your move before your turn comes, so it plays by itself.
 *
 * One click on a target queues an unconditional decision ("Whatever happens → Alice"). A step that follows a look can
 * instead branch on what you will have seen:
 *
 *   + If I see: [Werewolf] [Centaur] [Pyre] [Loner] [Choose cards…]       one click adds a branch
 *   If I see  [Werewolf ✓] [Tracker ✓] [Sage] [Centaur] …  → target       a branch is a set of cards; tick to refine
 *   Otherwise (Sage, Centaur, …)                            → target       everything no branch names
 *
 * A card belongs to at most one branch. Whatever is left undecided is asked live on your turn, and decided at random if
 * time runs out. Steps that name a role show the roles you may name; steps with several targets are picked in order.
 *
 * Copiers (a step with the `adopt` effect) get a second part, "If I become…": one tab per role they might become, each
 * with that role's own steps and the same editor (plans sent with `as: <role>`), and a coverage line across roles.
 * After the copy, the role it became is shown alone, live in that role's turn.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { isAuto, legalTargets, uncovered, type Decision, type LogEntry, type Plan, type Progress, type StepPlan } from "../../shared/engine";
import { condSource, legalRoles, pickCount, ROLE, roleName, sameSlot, TEAM_NAME, type RoleDef, type RoleId, type Shape, type Slot, type StepDef } from "../../shared/roles";
import { describe, slotLabel, viaLabel } from "../../shared/text";
import { myNight } from "../app/night";
import { useApp, useNow, type View } from "../app/store";
import { actsAtNight, isCopier, teamShort, TEAMS } from "../app/teams";
import { Avatar, Card } from "./bits";
import { IconCheck, IconClock, IconMirror, IconPlus, IconX } from "./icons";

interface Row { roles: RoleId[]; decision?: Decision }
interface Draft { branches: Row[]; otherwise?: Decision }
type Focus = number | "else";

const sameDecision = (a: Decision | undefined, b: Decision) =>
  !!a && a.kind === b.kind && (a.kind !== "pick" || (b.kind === "pick" && a.role === b.role && a.targets.length === b.targets.length && a.targets.every((t, i) => sameSlot(t, b.targets[i])))) && (a.kind !== "name" || (b.kind === "name" && a.role === b.role));
const toPlan = (d: Draft): StepPlan => ({ branches: d.branches.flatMap(b => (b.roles.length && b.decision ? [{ roles: b.roles, decision: b.decision }] : [])), ...(d.otherwise ? { otherwise: d.otherwise } : {}) });
const isEmpty = (p: StepPlan) => !p.branches.length && !p.otherwise;
const FRESH: Progress = { step: 0, picks: {}, seen: {}, done: false };

/** The table's shape as the engine's legality checks want it. */
export function useShape(v: View): Shape {
  return useMemo(() => ({ players: v.players.length, center: v.settings.centerCount, deck: v.settings.deck, mandatory: v.settings.rules.mandatorySteps }), [v.players.length, v.settings.centerCount, v.settings.deck, v.settings.rules.mandatorySteps]);
}

/** Whether a role's plan covers every outcome of every step still to decide. */
function planState(role: RoleDef, plan: Plan | undefined, outcomes: RoleId[]): "none" | "auto" | "partial" | "full" {
  const steps = (role.steps ?? []).filter(s => !isAuto(s));
  if (!steps.length) return "auto";
  const done = steps.filter(s => plan?.[s.id] && !uncovered(plan[s.id], outcomes).length).length;
  return done === steps.length ? "full" : done || steps.some(s => plan?.[s.id]) ? "partial" : "none";
}

export function PlanBuilder() {
  const { view } = useApp();
  const now = useNow(1000);
  const v = view!, game = v.game!, mine = game.mine!;
  const role = ROLE[mine.dealt];
  const n = myNight(v)!;
  const outcomes = useMemo(() => [...new Set(v.settings.deck)], [v.settings.deck]);
  const shape = useShape(v);
  const copier = isCopier(role.id);
  const ownOpen = v.context.openSteps;
  const allQueued = ownOpen.every(id => { const p = mine.plan[id] as StepPlan | undefined; return p && !uncovered(p, outcomes).length; });

  if (!role.steps?.length) return (
    <div className="plan-status is-sleep">
      <b>You sleep through the night.</b>
      <span>Watch the turns go by: every role in the deck gets one, held or not. {role.vote ? "Your card matters at the vote." : role.chat || role.dayPower ? "Your card's power is for the day." : ""}</span>
    </div>
  );
  const at = n.next >= 0 ? n.next : n.ownTurn;
  const secs = at > 0 ? Math.max(0, Math.ceil((game.turns[at].startsAt - now) / 1000)) : 0;
  const copyLeft = copier && n.became && n.copyTurn > game.turn;
  const status = n.awake ? { tone: "awake", head: "You are awake.", sub: "Anything still undecided when the turn ends is chosen at random." }
    : mine.progress.done && !copyLeft ? { tone: "done", head: "Your night is done.", sub: "What you learned is pinned to the table." }
    : at > game.turn ? (allQueued && !copyLeft
      ? { tone: "queued", head: `Queued. You wake in ${secs}s.`, sub: "Your move will play by itself. You can still change it." }
      : { tone: "todo", head: `You wake in ${secs}s${copyLeft ? ` as the ${roleName(n.became!)}` : ""}.`, sub: "Decide now and it plays by itself. Anything left open is asked on your turn." })
    : { tone: "done", head: "Your turn has passed.", sub: "" };
  const ownPublishes = ownOpen.length > 0;
  return (
    <div className="plan">
      <div className={`plan-status is-${status.tone}`} aria-live="polite">
        {status.tone === "awake" ? <span className="plan-pulse" aria-hidden /> : status.tone === "queued" || status.tone === "done" ? <IconCheck size={18} /> : <IconClock size={18} />}
        <div><b>{status.head}</b>{status.sub && <span>{status.sub}</span>}</div>
      </div>
      <Steps v={v} role={role} plan={mine.plan} progress={mine.progress} open={ownOpen} turn={n.ownTurn} outcomes={outcomes} shape={shape} publish={ownPublishes} journal={mine.journal.filter(e => e.role === role.id)} />
      {copier && <CopyPlans v={v} outcomes={outcomes} shape={shape} publish={!ownPublishes} />}
    </div>
  );
}

/** One role's steps: done ones with their results, automatic ones, and an editor for each one still to decide. */
function Steps({ v, role, as, plan, progress, open, turn, outcomes, shape, publish, journal }: {
  v: View; role: RoleDef; as?: RoleId; plan: Plan; progress: Progress; open: string[]; turn: number; outcomes: RoleId[]; shape: Shape; publish: boolean; journal: LogEntry[];
}) {
  const game = v.game!, mine = game.mine!;
  const steps = role.steps ?? [];
  const awake = v.phase === "night" && game.turn === turn && turn > 0 && (!as || mine.status.became === as);
  const firstOpen = steps.findIndex((s, i) => i >= progress.step && open.includes(s.id));
  return (
    <>
      {steps.map((step, i) => {
        const results = journal.filter(e => e.step === step.id);
        const done = progress.done || i < progress.step;
        const editable = !done && open.includes(step.id);
        const p = plan[step.id] as StepPlan | undefined;
        const live = editable && awake && i === firstOpen;
        const state = done ? "done" : !editable ? "auto" : live ? "live" : p && !uncovered(p, outcomes).length ? "queued" : p ? "partial" : "open";
        const mandatoryHere = step.optional && shape.mandatory;
        return (
          <section key={`${as ?? ""}:${step.id}`} className={`step is-${state}`} aria-label={`Step ${i + 1}: ${step.title}`}>
            <header className="step-head">
              <span className="step-n">{done ? <IconCheck size={14} strokeWidth={2.4} /> : i + 1}</span>
              <h3>{step.title}</h3>
              <span className={`step-pill pill-${state}`}>{{ done: "Done", auto: isAuto(step) ? "Automatic" : "Waiting", live: "Decide now", queued: "Queued", partial: "Partly queued", open: "Not decided" }[state]}</span>
            </header>
            {!done && (step.onlyIfAlone || step.ifRule || mandatoryHere) && (
              <p className="step-note">
                {step.onlyIfAlone && "Only happens if no other player was dealt a card like yours. "}
                {step.ifRule && "Only happens under a table rule. "}
                {mandatoryHere && "It cannot be declined at this table (the \"Mandatory night steps\" rule)."}
              </p>
            )}
            {done && <StepResults results={results} v={v} seat={mine.seat} step={step} />}
            {!done && !editable && <p className="step-note">{isAuto(step) ? "Happens by itself on your turn." : "Can be decided once its turn is near."}</p>}
            {editable && <StepEditor key={`${v.round}:${as ?? ""}:${step.id}`} v={v} role={role} as={as} step={step} plan={plan} progress={progress} outcomes={outcomes} shape={shape} publish={publish && i === firstOpen} live={live} />}
          </section>
        );
      })}
    </>
  );
}

/**
 * The copier's plans: "If I become…" one tab per role it might become (before the copy), or the role it became.
 * Same editor, same one-click choices; the coverage line counts roles, not cards.
 */
function CopyPlans({ v, outcomes, shape, publish }: { v: View; outcomes: RoleId[]; shape: Shape; publish: boolean }) {
  const game = v.game!, mine = game.mine!;
  const n = myNight(v)!;
  const own = ROLE[mine.dealt];
  const possible = useMemo(() => [...new Set(v.settings.deck)].filter(r => ROLE[r] && !isCopier(r)), [v.settings.deck]);
  const acting = possible.filter(r => actsAtNight(ROLE[r]));
  const planning = acting.filter(r => (ROLE[r].steps ?? []).some(s => !isAuto(s)));
  const quiet = possible.filter(r => !planning.includes(r));
  const [sel, setSel] = useState<RoleId | null>(null);
  const adoptPlans = (mine.adoptPlans ?? {}) as Record<RoleId, Plan>;
  const ctxOpen = v.context.adoptOpen;
  const openFor = (r: RoleId): string[] => {
    const steps = ROLE[r].steps ?? [];
    if (ctxOpen === "any") return steps.filter(s => !isAuto(s)).map(s => s.id);
    if (!ctxOpen.includes(r)) return [];
    const p = mine.adoptProgress ?? FRESH;
    return steps.filter((s, i) => i >= p.step && !isAuto(s)).map(s => s.id);
  };

  if (n.became) {
    const b = ROLE[n.became];
    const turnHere = n.copyTurn > 0;
    return (
      <section className="copy is-became">
        <header className="copy-head">
          <IconMirror size={18} />
          <div><span className="eyebrow">Your copy</span><h3>You became the {b.name}</h3></div>
          <img src={`/art/${b.id}.webp`} alt="" className="copy-art" />
        </header>
        <p className="step-note">{turnHere ? `You act as the ${b.name} in its own turn (turn ${n.copyTurn}).` : isCopier(b.id) ? "You copied a copier that had not copied anything: you have nothing left to do tonight." : actsAtNight(b) ? "Its turn has already passed: it does nothing more tonight." : `The ${b.name} has no night action. Its powers, if any, are yours in the day.`}</p>
        {turnHere && <Steps v={v} role={b} as={b.id} plan={adoptPlans[b.id] ?? {}} progress={mine.adoptProgress ?? FRESH} open={openFor(b.id)} turn={n.copyTurn} outcomes={outcomes} shape={shape} publish={publish} journal={mine.journal.filter(e => e.role === b.id)} />}
      </section>
    );
  }
  const current = sel && planning.includes(sel) ? sel : planning[0] ?? null;
  const states = Object.fromEntries(planning.map(r => [r, planState(ROLE[r], adoptPlans[r], outcomes)]));
  const full = planning.filter(r => states[r] === "full"), part = planning.filter(r => states[r] === "partial");
  const pool = own.steps?.some(s => s.pick?.pools.includes("center")) ? "a centre card" : "another player's card";
  return (
    <section className="copy">
      <header className="copy-head">
        <IconMirror size={18} />
        <div><span className="eyebrow">Then, as your copy</span><h3>If I become…</h3></div>
      </header>
      <p className="step-note">You will become whatever {pool} truly is, and act as it in its own turn. Queue a move for each role you might become; anything you leave open is asked live in that turn, else chosen at random.</p>
      {planning.length > 0 && (
        <div className="copy-tabs" role="tablist" aria-label="Roles you might become">
          {planning.map(r => (
            <button key={r} type="button" role="tab" aria-selected={current === r} className={`copy-tab team-${ROLE[r].team}${current === r ? " is-on" : ""} is-${states[r]}`} onClick={() => setSel(r)}
              title={`${roleName(r)}: ${states[r] === "full" ? "queued for every outcome" : states[r] === "partial" ? "partly queued" : "not planned"}`}>
              <img src={`/art/${r}.webp`} alt="" /><span>{roleName(r)}</span><i className="copy-dot" aria-hidden />
            </button>
          ))}
        </div>
      )}
      {current && (
        <div className="copy-body" role="tabpanel" aria-label={`If I become the ${roleName(current)}`}>
          <p className="copy-if"><span className="rule-if">If I become</span> <b>the {roleName(current)}</b> <span className="quiet small">· {teamShort(ROLE[current].team)}</span></p>
          <Steps v={v} role={ROLE[current]} as={current} plan={adoptPlans[current] ?? {}} progress={FRESH} open={openFor(current)} turn={-1} outcomes={outcomes} shape={shape} publish={publish} journal={[]} />
        </div>
      )}
      <p className={`coverage${full.length === planning.length && planning.length ? " is-full" : ""}`} aria-live="polite">
        {!planning.length ? "No role you might become has anything to decide."
          : full.length === planning.length ? <><IconCheck size={14} strokeWidth={2.4} /> Planned for every role you might become.</>
          : `Planned for ${full.length} of ${planning.length}${full.length ? ` (${full.map(roleName).join(", ")})` : ""}${part.length ? `; partly for ${part.map(roleName).join(", ")}` : ""}. The rest is asked live in that role's turn, else random.`}
      </p>
      {quiet.length > 0 && <p className="quiet small">Nothing to decide if you become {quiet.map(roleName).join(", ")}.</p>}
    </section>
  );
}

/** What a finished step did, with the cards it showed you turning over. */
function StepResults({ results, v, seat, step }: { results: LogEntry[]; v: View; seat: number; step: StepDef }) {
  if (!results.length) return <p className="step-note">Did not happen{step.onlyIfAlone ? ": you were not alone." : "."}</p>;
  return (
    <div className="step-results">
      {results.map((e, k) => {
        const seen = e.ev.kind === "look" && e.ev.roles ? e.ev.roles : e.ev.kind === "announce" ? e.ev.roles : e.ev.kind === "adopt" ? [e.ev.role] : null;
        return (
          <div key={k} className="result">
            {seen && <span className="result-cards">{seen.map((r, j) => <Card key={j} role={r} size={54} reveal flipDelay={150 + j * 200} />)}</span>}
            <p>{safeDescribe(e, v, seat)}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}</p>
          </div>
        );
      })}
    </div>
  );
}
/** A log entry as a sentence; an event kind this app does not know yet still reads as something. */
export function safeDescribe(e: LogEntry, v: View, seat: number): string {
  try { return describe(e, v, seat) ?? `${roleName(e.role)}: ${e.ev.kind}.`; } catch { return `${roleName(e.role)}: ${e.ev.kind}.`; }
}

function StepEditor({ v, role, as, step, plan, progress, outcomes, shape, publish, live }: {
  v: View; role: RoleDef; as?: RoleId; step: StepDef; plan: Plan; progress: Progress; outcomes: RoleId[]; shape: Shape; publish: boolean; live: boolean;
}) {
  const { exec, setPicker } = useApp();
  const mine = v.game!.mine!;
  const src = condSource(role, step.id);
  const seen = src ? progress.seen[src.id] : undefined;
  /** Branching is on offer while the earlier look has not happened yet. */
  const canBranch = !!src && !seen;
  const count = pickCount(step, shape);
  const names = useMemo(() => legalRoles(step, shape.deck ?? [], role.id), [step, shape.deck, role.id]);
  const server = plan[step.id] as StepPlan | undefined;
  const serverJson = JSON.stringify(server ?? null);
  const sent = useRef(serverJson);
  const [draft, setDraft] = useState<Draft>(() => ({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise }));
  const [partial, setPartial] = useState<Record<string, Slot[]>>({});
  const [partialRole, setPartialRole] = useState<Record<string, RoleId>>({});
  const [focus, setFocus] = useState<Focus>("else");
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (serverJson === sent.current) return;
    sent.current = serverJson;
    setDraft({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise });
  }, [serverJson]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Draft) => {
    setDraft(next);
    const p = toPlan(next);
    const json = isEmpty(p) ? "null" : JSON.stringify(p);
    if (json === sent.current) return;
    sent.current = json;
    if (!isEmpty(p)) setFlash(f => f + 1);
    const args = { step: step.id, ...(as ? { as } : {}) };
    void (isEmpty(p) ? exec("night.clearStep", args) : exec("night.planStep", { ...args, plan: p })).catch(() => { sent.current = serverJson; setDraft({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise }); });
  };
  const decisionAt = (at: Focus) => (at === "else" ? draft.otherwise : draft.branches[at]?.decision);
  const setAt = (d: Draft, at: Focus, dec: Decision | undefined): Draft => (at === "else" ? { ...d, otherwise: dec } : { ...d, branches: d.branches.map((b, i) => (i === at ? { ...b, decision: dec } : b)) });
  const clearPartial = (at: Focus) => { setPartial(p => ({ ...p, [String(at)]: [] })); };
  const choose = (at: Focus, d: Decision) => { clearPartial(at); commit(setAt(draft, at, sameDecision(decisionAt(at), d) ? undefined : d)); };
  /** The targets picked so far in a row, in order: the queued ones, or the ones being picked. */
  const picksAt = (at: Focus): Slot[] => { const d = decisionAt(at); return d?.kind === "pick" ? d.targets : partial[String(at)] ?? []; };
  const roleAt = (at: Focus): RoleId | undefined => { const d = decisionAt(at); return d?.kind === "pick" || d?.kind === "name" ? d.role : partialRole[String(at)]; };
  /** A pick step that also names a role is complete only with both. */
  const finish = (at: Focus, targets: Slot[], named: RoleId | undefined) => {
    if (targets.length < count || (step.names && !named)) return false;
    clearPartial(at);
    commit(setAt(draft, at, { kind: "pick", targets, ...(step.names ? { role: named } : {}) }));
    return true;
  };
  const pickTarget = (at: Focus, s: Slot) => {
    setFocus(at);
    const cur = picksAt(at), named = roleAt(at);
    if (count <= 1) {
      const d: Decision = { kind: "pick", targets: [s], ...(step.names && named ? { role: named } : {}) };
      if (sameDecision(decisionAt(at), d)) { commit(setAt(draft, at, undefined)); setPartial(p => ({ ...p, [String(at)]: [] })); return; }
      if (!finish(at, [s], named)) { setPartial(p => ({ ...p, [String(at)]: [s] })); if (decisionAt(at)) commit(setAt(draft, at, undefined)); }
      return;
    }
    const has = cur.some(t => sameSlot(t, s));
    const next = has ? cur.filter(t => !sameSlot(t, s)) : [...cur, s];
    if (finish(at, next, named)) return;
    setPartial(p => ({ ...p, [String(at)]: next }));
    if (decisionAt(at)) commit(setAt(draft, at, undefined));
  };
  const nameRole = (at: Focus, r: RoleId) => {
    setFocus(at);
    if (!step.pick) return choose(at, { kind: "name", role: r });
    setPartialRole(p => ({ ...p, [String(at)]: r }));
    if (!finish(at, picksAt(at), r)) { if (decisionAt(at)) commit(setAt(draft, at, undefined)); }
  };
  const toggleRole = (at: number, r: RoleId) => commit({
    ...draft,
    branches: draft.branches.map((b, i) => (i === at ? { ...b, roles: b.roles.includes(r) ? b.roles.filter(x => x !== r) : [...b.roles, r] } : { ...b, roles: b.roles.filter(x => x !== r) })),
  });
  const addBranch = (roles: RoleId[]) => { commit({ ...draft, branches: [...draft.branches, { roles }] }); setFocus(draft.branches.length); };
  const removeBranch = (at: number) => { commit({ ...draft, branches: draft.branches.filter((_, i) => i !== at) }); setFocus("else"); };

  const targets = useMemo(() => legalTargets(step, mine.seat, shape), [step, mine.seat, shape]);
  const taken = new Set(draft.branches.flatMap(b => b.roles));
  const rest = outcomes.filter(r => !taken.has(r));
  const open = uncovered(toPlan(draft), outcomes);
  const teams = TEAMS.filter(t => rest.some(r => ROLE[r]?.team === t) && !outcomes.every(r => ROLE[r]?.team === t));

  // The focused row's targets are also clickable on the table.
  const focusedPicks = picksAt(focus);
  const focusedJson = JSON.stringify(focusedPicks);
  useEffect(() => {
    if (!publish || !step.pick) return;
    const at = focus;
    const left = count - focusedPicks.length;
    const pools = step.pick.pools;
    const what = pools.includes("center") && pools.some(p => p !== "center") ? "a card (player or centre)" : pools.includes("center") ? "a centre card" : "a player";
    const rowName = at === "else" ? (canBranch && draft.branches.length ? "Otherwise" : "") : `If I see ${draft.branches[at]?.roles.map(roleName).join(", ") || "…"}`;
    const prefix = `${as ? `As the ${roleName(as)}: ` : ""}${rowName ? `${rowName}: ` : ""}`;
    const needsName = step.names && !roleAt(at);
    setPicker({
      legal: targets,
      chosen: focusedPicks,
      ordered: count > 1,
      done: left === 0 && !needsName,
      hint: (left === 0 ? (needsName ? `${prefix}now name a role in your panel.` : `${prefix}queued. Click another to change it.`)
        : `${prefix}${count > 1 ? (left < count ? `pick ${left} more, in order` : `click ${count} cards in order`) : `click ${what}`} here or in your panel.`).replace(/^./, c => c.toUpperCase()),
      onPick: (s: Slot) => pickTarget(at, s),
    });
    return () => setPicker(null);
  }, [publish, focus, focusedJson, JSON.stringify(draft), JSON.stringify(partialRole), step.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const picker = (at: Focus) => <DecisionPicker v={v} step={step} seat={mine.seat} targets={targets} count={count} value={decisionAt(at)} picks={picksAt(at)} named={roleAt(at)} names={names} mandatory={!!shape.mandatory}
    onTarget={s => pickTarget(at, s)} onName={r => nameRole(at, r)} onChoose={d => { setFocus(at); choose(at, d); }} />;

  return (
    <div className={`editor${live ? " is-live" : ""}`}>
      {seen && (
        <div className="seen">
          <span className="result-cards">{seen.map((r, j) => <Card key={j} role={r} size={54} reveal flipDelay={150} />)}</span>
          <p>You saw <b>{seen.map(roleName).join(", ")}</b>. {live ? "Decide now." : "Your move for this is below."}</p>
        </div>
      )}
      {canBranch && draft.branches.map((b, i) => (
        <div key={i} className={`rule${focus === i ? " is-focus" : ""}`} onFocusCapture={() => setFocus(i)} onMouseDown={() => setFocus(i)}>
          <div className="rule-head">
            <span className="rule-if">If I see</span>
            <span className="rule-sum">{b.roles.length ? `${b.roles.length} card${b.roles.length > 1 ? "s" : ""}` : "no cards yet"}</span>
            <button type="button" className="icon-btn" onClick={() => removeBranch(i)} title="Remove this condition. Its cards go back to Otherwise." aria-label="Remove this condition"><IconX size={14} /></button>
          </div>
          <div className="role-chips" role="group" aria-label="Cards this condition covers">
            {TEAMS.map(t => outcomes.filter(r => ROLE[r]?.team === t)).filter(g => g.length).map((g, gi) => (
              <span key={gi} className="role-chip-group">
                {g.map(r => {
                  const on = b.roles.includes(r), elsewhere = !on && taken.has(r);
                  return (
                    <button key={r} type="button" className={`role-chip team-${ROLE[r].team}${on ? " is-on" : ""}${elsewhere ? " is-elsewhere" : ""}`} aria-pressed={on} onClick={() => toggleRole(i, r)}
                      title={on ? `Untick to send ${roleName(r)} back to Otherwise.` : elsewhere ? `Move ${roleName(r)} here from the other condition.` : `Add ${roleName(r)} to this condition.`}>
                      <img src={`/art/${r}.webp`} alt="" />{roleName(r)}{on && <IconCheck size={12} strokeWidth={2.6} />}
                    </button>
                  );
                })}
              </span>
            ))}
          </div>
          {b.roles.length ? <><div className="rule-then">then</div>{picker(i)}</> : <p className="step-note">Tick at least one card.</p>}
        </div>
      ))}
      <div className={`rule rule-else${focus === "else" ? " is-focus" : ""}${canBranch && draft.branches.length ? "" : " is-plain"}`} onFocusCapture={() => setFocus("else")} onMouseDown={() => setFocus("else")}>
        {canBranch && draft.branches.length > 0 && (
          <div className="rule-head"><span className="rule-if">Otherwise</span><span className="rule-sum">{rest.length ? rest.map(roleName).join(", ") : "nothing left"}</span></div>
        )}
        {canBranch && !draft.branches.length && <div className="rule-head"><span className="rule-if">Whatever I see</span></div>}
        {picker("else")}
      </div>
      {canBranch && (
        <div className="add-cond">
          <span className="add-cond-label"><IconPlus size={14} /> If I see</span>
          {teams.map(t => (
            <button key={t} type="button" className={`chip chip-add team-${t}`} onClick={() => addBranch(rest.filter(r => ROLE[r]?.team === t))} title={`Adds a condition for ${rest.filter(r => ROLE[r]?.team === t).map(roleName).join(", ")}. You can untick cards afterwards.`}>
              <span className="team-pip" />{TEAM_NAME[t].replace(/ \(.*\)$/, "")}
            </button>
          ))}
          <button type="button" className="chip chip-add" onClick={() => addBranch([])} title="Start an empty condition and tick the cards yourself.">Choose cards…</button>
        </div>
      )}
      <p key={flash} className={`coverage${open.length ? "" : " is-full"}${flash ? " is-flash" : ""}`} aria-live="polite">
        {!open.length ? <><IconCheck size={14} strokeWidth={2.4} /> {live ? "Decided." : "Queued for every outcome."}</>
          : canBranch && open.length < outcomes.length ? `Not decided if you see ${open.map(roleName).join(", ")}: you will be asked on your turn.`
          : live ? "Choose now, or it is chosen at random when the turn ends." : "Not decided yet."}
      </p>
    </div>
  );
}

/** One decision: the targets as small tiles (picked in order when there are several), a role to name, plus Skip or Do it. */
function DecisionPicker({ v, step, seat, targets, count, value, picks, named, names, mandatory, onTarget, onName, onChoose }: {
  v: View; step: StepDef; seat: number; targets: Slot[]; count: number; value: Decision | undefined; picks: Slot[]; named: RoleId | undefined; names: RoleId[]; mandatory: boolean;
  onTarget(s: Slot): void; onName(r: RoleId): void; onChoose(d: Decision): void;
}) {
  const rotate = step.effects.some(e => e.kind === "rotate");
  const label = (s: Slot) => slotLabel(s, v, seat);
  const canSkip = step.optional && !mandatory;
  return (
    <div className="decision">
      {step.pick && (
        <div className="targets" role="group" aria-label={count > 1 ? `Choose ${count} in order` : "Choose one"}>
          {targets.map(s => {
            const k = picks.findIndex(t => sameSlot(t, s));
            const on = k >= 0;
            const p = s.k === "p" ? v.players[s.i] : null;
            return (
              <button key={`${s.k}${s.i}`} type="button" className={`target${on ? " is-on" : ""}${s.k === "c" ? " is-centre" : ""}`} aria-pressed={on} onClick={() => onTarget(s)}
                title={on && count > 1 ? `Picked ${k + 1} of ${count}. Click to unpick.` : `${label(s)}`}>
                <span className="target-face">{s.k === "c" ? <img src="/art/back.webp" alt="" /> : <Avatar name={p?.name ?? "?"} bot={p?.bot} size="sm" />}</span>
                <span className="target-name">{label(s)}</span>
                {on && <span className="target-order">{count > 1 ? k + 1 : <IconCheck size={11} strokeWidth={3} />}</span>}
              </button>
            );
          })}
        </div>
      )}
      {step.names && (
        <div className="name-pick">
          <span className="rule-then">{step.pick ? "and name" : "name"} a role</span>
          <div className="role-chip-group" role="group" aria-label="Name a role">
            {names.map(r => (
              <button key={r} type="button" className={`role-chip team-${ROLE[r].team}${named === r ? " is-on" : ""}`} aria-pressed={named === r} onClick={() => onName(r)} title={`${roleName(r)}: ${ROLE[r].blurb}`}>
                <img src={`/art/${r}.webp`} alt="" />{roleName(r)}{named === r && <IconCheck size={12} strokeWidth={2.6} />}
              </button>
            ))}
            {!names.length && <span className="step-note">There is no role you can name.</span>}
          </div>
        </div>
      )}
      {((!step.pick && !step.names) || canSkip) && (
        <div className="choices">
          {!step.pick && !step.names && <button type="button" className={`chip chip-do${value?.kind === "do" ? " is-on" : ""}`} aria-pressed={value?.kind === "do"} onClick={() => onChoose({ kind: "do" })}>{step.doLabel ?? "Do it"}</button>}
          {canSkip && <button type="button" className={`chip chip-skip${value?.kind === "skip" ? " is-on" : ""}`} aria-pressed={value?.kind === "skip"} onClick={() => onChoose({ kind: "skip" })}>{step.skipLabel ?? "Skip"}</button>}
        </div>
      )}
      {count > 1 && (
        <p className="sequence" aria-live="polite">
          {picks.length === 0 ? `Pick ${count} cards in order.` : picks.length < count ? <>{picks.map(label).join(" → ")} <span className="quiet">· {count - picks.length} more</span></>
            : rotate ? <>{picks.map(label).join(" → ")} → <span className="quiet">back to</span> {label(picks[0])}<span className="quiet small"> (each card moves to the next place)</span></>
            : <>{picks.map(label).join(" and ")}</>}
        </p>
      )}
      {step.pick && step.names && picks.length === count && !named && <p className="step-note warn-text">Name a role to finish this choice.</p>}
    </div>
  );
}
