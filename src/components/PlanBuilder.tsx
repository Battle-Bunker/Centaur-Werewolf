/**
 * The night plan: decide your move before your turn comes, so it plays by itself.
 *
 * One click on a target queues an unconditional decision ("Whatever happens → Alice"). A step that follows a peek can
 * instead branch on what you will have seen:
 *
 *   + If I see: [Werewolf team] [Centaur team] [Alone] [Choose cards…]     one click adds a branch
 *   If I see  [Werewolf ✓] [Tracker ✓] [Sage] [Centaur] …  → target       a branch is a set of cards; tick to refine
 *   Otherwise (Sage, Centaur, …)                            → target       everything no branch names
 *
 * A card belongs to at most one branch: ticking it somewhere takes it from wherever it was, and unticking it returns
 * it to "Otherwise". Whatever is left undecided is asked live on your turn, and decided at random if time runs out.
 *
 * Steps with several targets (the Spooker's three, the Herald's two at a wide table) are picked in order; the plan is
 * sent once every target is chosen. Targets can be picked here or by clicking seats and centre cards on the table.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { legalTargets, uncovered, type Decision, type LogEntry, type StepPlan } from "../../shared/engine";
import { condSource, pickCount, ROLE, roleName, sameSlot, TEAM_NAME, type RoleDef, type RoleId, type Shape, type Slot, type StepDef, type Team } from "../../shared/roles";
import { describe, slotLabel, viaLabel } from "../../shared/text";
import { useApp, useNow, type View } from "../app/store";
import { Avatar, Card } from "./bits";
import { IconCheck, IconClock, IconPlus, IconX } from "./icons";

interface Row { roles: RoleId[]; decision?: Decision }
interface Draft { branches: Row[]; otherwise?: Decision }
type Focus = number | "else";

const sameDecision = (a: Decision | undefined, b: Decision) =>
  !!a && a.kind === b.kind && (a.kind !== "pick" || (b.kind === "pick" && a.targets.length === b.targets.length && a.targets.every((t, i) => sameSlot(t, b.targets[i]))));
const toPlan = (d: Draft): StepPlan => ({ branches: d.branches.flatMap(b => (b.roles.length && b.decision ? [{ roles: b.roles, decision: b.decision }] : [])), ...(d.otherwise ? { otherwise: d.otherwise } : {}) });
const isEmpty = (p: StepPlan) => !p.branches.length && !p.otherwise;
const TEAM_ORDER: Team[] = ["werewolf", "centaur", "lone"];

export function PlanBuilder() {
  const { view } = useApp();
  const now = useNow(1000);
  const v = view!, game = v.game!, mine = game.mine!;
  const role = ROLE[mine.dealt];
  const steps = role.steps ?? [];
  const myTurn = game.turns.findIndex(t => t.role === role.id);
  const awake = game.turn === myTurn;
  const outcomes = useMemo(() => [...new Set(v.settings.deck)], [v.settings.deck]);
  const shape: Shape = useMemo(() => ({ players: v.players.length, center: v.settings.centerCount }), [v.players.length, v.settings.centerCount]);
  const firstOpen = steps.findIndex((s, i) => i >= mine.progress.step && v.context.openSteps.includes(s.id));
  const allQueued = v.context.openSteps.every(id => { const p = mine.plan[id] as StepPlan | undefined; return p && !uncovered(p, outcomes).length; });

  if (!steps.length) return (
    <div className="plan-status is-sleep">
      <b>You sleep through the night.</b>
      <span>Watch the turns go by: every role in the deck gets one, held or not. {role.vote ? "Your card matters at the vote." : role.chat ? "Your card's power is for the day." : ""}</span>
    </div>
  );
  const secs = myTurn > 0 ? Math.max(0, Math.ceil((game.turns[myTurn].startsAt - now) / 1000)) : 0;
  const status = mine.progress.done ? { tone: "done", head: "Your night is done.", sub: "What you learned is pinned to the table." }
    : awake ? { tone: "awake", head: "You are awake.", sub: "Anything still undecided when the turn ends is chosen at random." }
    : game.turn < myTurn ? (allQueued
      ? { tone: "queued", head: `Queued. You wake in ${secs}s.`, sub: "Your move will play by itself. You can still change it." }
      : { tone: "todo", head: `You wake in ${secs}s.`, sub: "Decide now and it plays by itself. Anything left open is asked on your turn." })
    : { tone: "done", head: "Your turn has passed.", sub: "" };
  return (
    <div className="plan">
      <div className={`plan-status is-${status.tone}`} aria-live="polite">
        {status.tone === "awake" ? <span className="plan-pulse" aria-hidden /> : status.tone === "queued" || status.tone === "done" ? <IconCheck size={18} /> : <IconClock size={18} />}
        <div><b>{status.head}</b>{status.sub && <span>{status.sub}</span>}</div>
      </div>
      {steps.map((step, i) => {
        const results = mine.journal.filter(e => e.step === step.id);
        const done = mine.progress.done || i < mine.progress.step;
        const open = !done && v.context.openSteps.includes(step.id);
        const plan = mine.plan[step.id] as StepPlan | undefined;
        const live = open && awake && i === firstOpen;
        const state = done ? "done" : !open ? "auto" : live ? "live" : plan && !uncovered(plan, outcomes).length ? "queued" : plan ? "partial" : "open";
                return (
          <section key={step.id} className={`step is-${state}`} aria-label={`Step ${i + 1}: ${step.title}`}>
            <header className="step-head">
              <span className="step-n">{done ? <IconCheck size={14} strokeWidth={2.4} /> : i + 1}</span>
              <h3>{step.title}</h3>
              <span className={`step-pill pill-${state}`}>{{ done: "Done", auto: "Automatic", live: "Decide now", queued: "Queued", partial: "Partly queued", open: "Not decided" }[state]}</span>
            </header>
            {step.onlyIfAlone && !done && <p className="step-note">Only happens if you turn out to be the only Werewolf at the table.</p>}
            {done && <StepResults results={results} v={v} seat={mine.seat} step={step} />}
            {!done && !open && <p className="step-note">Happens by itself on your turn.</p>}
            {open && <StepEditor key={`${v.round}:${step.id}`} v={v} role={role} step={step} outcomes={outcomes} shape={shape} publish={i === firstOpen} live={live} />}
          </section>
        );
      })}
    </div>
  );
}

/** What a finished step did, with the cards it showed you turning over. */
function StepResults({ results, v, seat, step }: { results: LogEntry[]; v: View; seat: number; step: StepDef }) {
  if (!results.length) return <p className="step-note">Did not apply{step.onlyIfAlone ? ": you are not the only Werewolf." : "."}</p>;
  return (
    <div className="step-results">
      {results.map((e, k) => {
        const seen = e.ev.kind === "look" && e.ev.roles ? e.ev.roles : e.ev.kind === "announce" ? e.ev.roles : null;
        return (
          <div key={k} className="result">
            {seen && <span className="result-cards">{seen.map((r, j) => <Card key={j} role={r} size={54} flipDelay={150 + j * 200} />)}</span>}
            <p>{describe(e, v, seat)}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}</p>
          </div>
        );
      })}
    </div>
  );
}

function StepEditor({ v, role, step, outcomes, shape, publish, live }: { v: View; role: RoleDef; step: StepDef; outcomes: RoleId[]; shape: Shape; publish: boolean; live: boolean }) {
  const { exec, setPicker } = useApp();
  const mine = v.game!.mine!;
  const src = condSource(role, step.id);
  const seen = src ? mine.progress.seen[src.id] : undefined;
  /** Branching is on offer while the earlier look has not happened yet. */
  const canBranch = !!src && !seen;
  const count = pickCount(step, shape);
  const server = mine.plan[step.id] as StepPlan | undefined;
  const serverJson = JSON.stringify(server ?? null);
  const sent = useRef(serverJson);
  const [draft, setDraft] = useState<Draft>(() => ({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise }));
  const [partial, setPartial] = useState<Record<string, Slot[]>>({});
  const [focus, setFocus] = useState<Focus>("else");
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (serverJson === sent.current) return;
    sent.current = serverJson;
    setDraft({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise });
  }, [serverJson]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Draft) => {
    setDraft(next);
    const plan = toPlan(next);
    const json = isEmpty(plan) ? "null" : JSON.stringify(plan);
    if (json === sent.current) return;
    sent.current = json;
    if (!isEmpty(plan)) setFlash(f => f + 1);
    void (isEmpty(plan) ? exec("night.clearStep", { step: step.id }) : exec("night.planStep", { step: step.id, plan })).catch(() => { sent.current = serverJson; setDraft({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise }); });
  };
  const decisionAt = (at: Focus) => (at === "else" ? draft.otherwise : draft.branches[at]?.decision);
  const setAt = (d: Draft, at: Focus, dec: Decision | undefined): Draft => (at === "else" ? { ...d, otherwise: dec } : { ...d, branches: d.branches.map((b, i) => (i === at ? { ...b, decision: dec } : b)) });
  const choose = (at: Focus, d: Decision) => { setPartial(p => ({ ...p, [String(at)]: [] })); commit(setAt(draft, at, sameDecision(decisionAt(at), d) ? undefined : d)); };
  /** The targets picked so far in a row, in order: the queued ones, or the ones being picked. */
  const picksAt = (at: Focus): Slot[] => { const d = decisionAt(at); return d?.kind === "pick" ? d.targets : partial[String(at)] ?? []; };
  const pickTarget = (at: Focus, s: Slot) => {
    setFocus(at);
    if (count <= 1) return choose(at, { kind: "pick", targets: [s] });
    const cur = picksAt(at);
    const has = cur.some(t => sameSlot(t, s));
    const next = has ? cur.filter(t => !sameSlot(t, s)) : [...cur, s];
    if (next.length === count) { setPartial(p => ({ ...p, [String(at)]: [] })); commit(setAt(draft, at, { kind: "pick", targets: next })); return; }
    setPartial(p => ({ ...p, [String(at)]: next }));
    if (decisionAt(at)) commit(setAt(draft, at, undefined));
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
  const teams = TEAM_ORDER.filter(t => rest.some(r => ROLE[r].team === t) && !outcomes.every(r => ROLE[r].team === t));

  // The focused row's targets are also clickable on the table.
  const focusedPicks = picksAt(focus);
  const focusedJson = JSON.stringify(focusedPicks);
  useEffect(() => {
    if (!publish || !step.pick) return;
    const at = focus;
    const left = count - focusedPicks.length;
    const pools = step.pick.pools;
    const what = pools.includes("center") && pools.some(p => p !== "center") ? "a player or centre card" : pools.includes("center") ? "a centre card" : "a player";
    const rowName = at === "else" ? (canBranch && draft.branches.length ? "Otherwise" : "") : `If I see ${draft.branches[at]?.roles.map(roleName).join(", ") || "…"}`;
    setPicker({
      legal: targets,
      chosen: focusedPicks,
      ordered: count > 1,
      done: left === 0,
      hint: `${rowName ? `${rowName}: ` : ""}${count > 1 ? (left > 0 && left < count ? `pick ${left} more, in order` : `click ${count} cards in order`) : `click ${what}`} here or in your panel.`.replace(/^./, c => c.toUpperCase()),
      onPick: (s: Slot) => pickTarget(at, s),
    });
    return () => setPicker(null);
  }, [publish, focus, focusedJson, JSON.stringify(draft), step.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const picker = (at: Focus) => <DecisionPicker v={v} step={step} seat={mine.seat} targets={targets} count={count} value={decisionAt(at)} picks={picksAt(at)}
    onTarget={s => pickTarget(at, s)} onChoose={d => { setFocus(at); choose(at, d); }} />;

  return (
    <div className={`editor${live ? " is-live" : ""}`}>
      {seen && (
        <div className="seen">
          <span className="result-cards">{seen.map((r, j) => <Card key={j} role={r} size={54} flipDelay={150} />)}</span>
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
            {TEAM_ORDER.map(t => outcomes.filter(r => ROLE[r].team === t)).filter(g => g.length).map((g, gi) => (
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
            <button key={t} type="button" className={`chip chip-add team-${t}`} onClick={() => addBranch(rest.filter(r => ROLE[r].team === t))} title={`Adds a condition for ${rest.filter(r => ROLE[r].team === t).map(roleName).join(", ")}. You can untick cards afterwards.`}>
              <span className="team-pip" />{TEAM_NAME[t].replace(" team", "")}{t === "lone" ? "" : " team"}
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

/** One decision: the targets as small tiles (picked in order when there are several), plus Skip or Do it. */
function DecisionPicker({ v, step, seat, targets, count, value, picks, onTarget, onChoose }: {
  v: View; step: StepDef; seat: number; targets: Slot[]; count: number; value: Decision | undefined; picks: Slot[]; onTarget(s: Slot): void; onChoose(d: Decision): void;
}) {
  const rotate = step.effects.some(e => e.kind === "rotate");
  const label = (s: Slot) => slotLabel(s, v, seat);
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
      {(!step.pick || step.optional) && (
        <div className="choices">
          {!step.pick && <button type="button" className={`chip chip-do${value?.kind === "do" ? " is-on" : ""}`} aria-pressed={value?.kind === "do"} onClick={() => onChoose({ kind: "do" })}>{step.doLabel ?? "Do it"}</button>}
          {step.optional && <button type="button" className={`chip chip-skip${value?.kind === "skip" ? " is-on" : ""}`} aria-pressed={value?.kind === "skip"} onClick={() => onChoose({ kind: "skip" })}>{step.skipLabel ?? "Skip"}</button>}
        </div>
      )}
      {count > 1 && (
        <p className="sequence" aria-live="polite">
          {picks.length === 0 ? `Pick ${count} cards in order.` : picks.length < count ? <>{picks.map(label).join(" → ")} <span className="quiet">· {count - picks.length} more</span></>
            : rotate ? <>{picks.map(label).join(" → ")} → <span className="quiet">back to</span> {label(picks[0])}<span className="quiet small"> (each card moves to the next place)</span></>
            : <>{picks.map(label).join(" and ")}</>}
        </p>
      )}
    </div>
  );
}
