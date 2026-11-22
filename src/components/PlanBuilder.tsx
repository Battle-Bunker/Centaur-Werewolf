/**
 * The night plan: decide your move before your turn comes, so it plays by itself.
 *
 * One click on a target queues an unconditional decision ("Always → Alice"). A step that follows a peek can instead
 * branch on what you will have seen:
 *
 *   + If I see: [Werewolf team] [Village team] [Alone] [Choose cards…]     one click adds a branch
 *   If I see  [Werewolf ✓] [Whisperer ✓] [Sage] [Villager] …  → target     a branch is a set of cards; tick to refine
 *   Otherwise (Sage, Villager, …)                              → target     everything no branch names
 *
 * A card belongs to at most one branch: ticking it somewhere takes it from wherever it was, and unticking it returns
 * it to "Otherwise". Whatever is left undecided is asked live on your turn, and decided at random if time runs out.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { legalTargets, uncovered, type Decision, type StepPlan } from "../../shared/engine";
import { condSource, ROLE, roleName, sameSlot, TEAM_NAME, type RoleDef, type RoleId, type Slot, type StepDef, type Team } from "../../shared/roles";
import { useApp, type View } from "../app/store";
import { decisionLabel, describe, viaLabel } from "../app/text";
import { TeamDot } from "./bits";

interface Row { roles: RoleId[]; decision?: Decision }
interface Draft { branches: Row[]; otherwise?: Decision }
type Focus = number | "else";

const sameDecision = (a: Decision | undefined, b: Decision) =>
  !!a && a.kind === b.kind && (a.kind !== "pick" || (b.kind === "pick" && a.targets.length === b.targets.length && a.targets.every((t, i) => sameSlot(t, b.targets[i]))));
const toPlan = (d: Draft): StepPlan => ({ branches: d.branches.flatMap(b => (b.roles.length && b.decision ? [{ roles: b.roles, decision: b.decision }] : [])), ...(d.otherwise ? { otherwise: d.otherwise } : {}) });
const isEmpty = (p: StepPlan) => !p.branches.length && !p.otherwise;

function options(step: StepDef, seat: number, players: number): Decision[] {
  const out: Decision[] = step.pick ? legalTargets(step, seat, players).map(t => ({ kind: "pick" as const, targets: [t] })) : [{ kind: "do" }];
  if (step.optional) out.push({ kind: "skip" });
  return out;
}

export function PlanBuilder() {
  const { view } = useApp();
  const v = view!, game = v.game!, mine = game.mine!;
  const role = ROLE[mine.dealt];
  const steps = role.steps ?? [];
  const myTurn = game.turns.findIndex(t => t.role === role.id);
  const awake = game.turn === myTurn;
  const outcomes = useMemo(() => [...new Set(v.settings.deck)], [v.settings.deck]);
  const firstOpen = steps.findIndex((s, i) => i >= mine.progress.step && v.context.openSteps.includes(s.id));

  if (!steps.length) return <p className="quiet">You sleep through the night. Watch the turns go by: every role in the deck gets one, held or not.</p>;
  return (
    <div className="plan">
      <p className={`plan-status${awake ? " is-awake" : ""}`}>
        {mine.progress.done ? "Your night is done." : awake ? "You are awake now. Anything undecided when the turn ends is chosen at random." : game.turn < myTurn ? `You wake at turn ${myTurn} of ${game.turns.length - 1}. Decide now and it plays by itself.` : ""}
      </p>
      {steps.map((step, i) => {
        const results = mine.journal.filter(e => e.step === step.id);
        const done = mine.progress.done || i < mine.progress.step;
        const open = !done && v.context.openSteps.includes(step.id);
        return (
          <section key={step.id} className={`step${done ? " is-done" : ""}`}>
            <h4><span className="step-n">{i + 1}</span>{step.title}</h4>
            {step.onlyIfAlone && !done && <p className="quiet">Only happens if you turn out to be the only Werewolf at the table.</p>}
            {done && (results.length ? results.map((e, k) => <p key={k} className="result">{describe(e, v, mine.seat)}{viaLabel(e) && <span className="via"> {viaLabel(e)}</span>}</p>) : <p className="quiet">Did not apply.</p>)}
            {!done && !open && <p className="quiet">Happens by itself on your turn.</p>}
            {open && <StepEditor key={`${v.round}:${step.id}`} v={v} role={role} step={step} outcomes={outcomes} publish={i === firstOpen} />}
          </section>
        );
      })}
    </div>
  );
}

function StepEditor({ v, role, step, outcomes, publish }: { v: View; role: RoleDef; step: StepDef; outcomes: RoleId[]; publish: boolean }) {
  const { exec, setPicker } = useApp();
  const mine = v.game!.mine!;
  const src = condSource(role, step.id);
  const seen = src ? mine.progress.seen[src.id] : undefined;
  /** Branching is on offer while the earlier look has not happened yet. */
  const canBranch = !!src && !seen;
  const server = mine.plan[step.id] as StepPlan | undefined;
  const serverJson = JSON.stringify(server ?? null);
  const sent = useRef(serverJson);
  const [draft, setDraft] = useState<Draft>(() => ({ branches: server?.branches.map(b => ({ ...b })) ?? [], otherwise: server?.otherwise }));
  const [focus, setFocus] = useState<Focus>("else");
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
    void (isEmpty(plan) ? exec("night.clearStep", { step: step.id }) : exec("night.planStep", { step: step.id, plan })).catch(() => { sent.current = serverJson; });
  };
  const choose = (at: Focus, d: Decision) => {
    if (at === "else") commit({ ...draft, otherwise: sameDecision(draft.otherwise, d) ? undefined : d });
    else commit({ ...draft, branches: draft.branches.map((b, i) => (i === at ? { ...b, decision: sameDecision(b.decision, d) ? undefined : d } : b)) });
  };
  const toggleRole = (at: number, r: RoleId) => commit({
    ...draft,
    branches: draft.branches.map((b, i) => (i === at ? { ...b, roles: b.roles.includes(r) ? b.roles.filter(x => x !== r) : [...b.roles, r] } : { ...b, roles: b.roles.filter(x => x !== r) })),
  });
  const addBranch = (roles: RoleId[]) => { commit({ ...draft, branches: [...draft.branches, { roles }] }); setFocus(draft.branches.length); };
  const removeBranch = (at: number) => { commit({ ...draft, branches: draft.branches.filter((_, i) => i !== at) }); setFocus("else"); };

  const opts = useMemo(() => options(step, mine.seat, v.players.length), [step, mine.seat, v.players.length]);
  const taken = new Set(draft.branches.flatMap(b => b.roles));
  const rest = outcomes.filter(r => !taken.has(r));
  const open = uncovered(toPlan(draft), outcomes);
  const teams = (["werewolf", "village", "lone"] as Team[]).filter(t => rest.some(r => ROLE[r].team === t) && !outcomes.every(r => ROLE[r].team === t));

  // The focused row's targets are also clickable on the table.
  const focused = focus === "else" ? draft.otherwise : draft.branches[focus]?.decision;
  const focusedJson = JSON.stringify(focused ?? null);
  useEffect(() => {
    if (!publish || !step.pick) return;
    const at = focus;
    setPicker({
      legal: legalTargets(step, mine.seat, v.players.length),
      chosen: focused?.kind === "pick" ? focused.targets : [],
      hint: `${step.title}: click a ${step.pick.pools.includes("center") ? "centre card" : "player"} here, or choose in your panel.`,
      onPick: (s: Slot) => choose(at, { kind: "pick", targets: [s] }),
    });
    return () => setPicker(null);
  }, [publish, focus, focusedJson, JSON.stringify(draft), step.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = (at: Focus, value: Decision | undefined) => (
    <div className="chips" role="group" aria-label="Decision">
      {opts.map((d, k) => (
        <button key={k} type="button" className={`chip${sameDecision(value, d) ? " is-on" : ""}${d.kind !== "pick" ? " chip-alt" : ""}`} aria-pressed={sameDecision(value, d)} onClick={() => { setFocus(at); choose(at, d); }}>
          {decisionLabel(d, step, v, mine.seat)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="editor">
      {seen && <p className="result">You saw {seen.map(roleName).join(", ")}. Decide now.</p>}
      {canBranch && draft.branches.map((b, i) => (
        <div key={i} className={`rule${focus === i ? " is-focus" : ""}`} onFocus={() => setFocus(i)} onMouseDown={() => setFocus(i)}>
          <div className="rule-head">
            <span className="rule-if">If I see</span>
            <button type="button" className="link" onClick={() => removeBranch(i)} title="Remove this condition. Its cards go back to Otherwise.">Remove</button>
          </div>
          <div className="chips chips-roles" role="group" aria-label="Cards this condition covers">
            {outcomes.map(r => (
              <button key={r} type="button" className={`chip chip-role${b.roles.includes(r) ? " is-on" : ""}`} aria-pressed={b.roles.includes(r)} onClick={() => toggleRole(i, r)}
                title={b.roles.includes(r) ? `Untick to send ${roleName(r)} back to Otherwise.` : taken.has(r) ? `Move ${roleName(r)} here from the other condition.` : `Add ${roleName(r)} to this condition.`}>
                <TeamDot role={r} />{roleName(r)}
              </button>
            ))}
          </div>
          {b.roles.length ? <><div className="rule-then">then</div>{chips(i, b.decision)}</> : <p className="quiet">Tick at least one card.</p>}
        </div>
      ))}
      <div className={`rule rule-else${focus === "else" ? " is-focus" : ""}`} onMouseDown={() => setFocus("else")}>
        {canBranch && draft.branches.length > 0 && (
          <div className="rule-head"><span className="rule-if">Otherwise</span><span className="quiet">{rest.length ? rest.map(roleName).join(", ") : "nothing left"}</span></div>
        )}
        {canBranch && !draft.branches.length && <div className="rule-head"><span className="rule-if">Whatever I see</span></div>}
        {chips("else", draft.otherwise)}
      </div>
      {canBranch && (
        <div className="add-cond">
          <span className="quiet">+ If I see:</span>
          {teams.map(t => <button key={t} type="button" className="chip chip-add" onClick={() => addBranch(rest.filter(r => ROLE[r].team === t))} title={`Adds a condition for ${rest.filter(r => ROLE[r].team === t).map(roleName).join(", ")}. You can untick cards afterwards.`}>{TEAM_NAME[t]}</button>)}
          <button type="button" className="chip chip-add" onClick={() => addBranch([])} title="Start an empty condition and tick the cards yourself.">Choose cards…</button>
        </div>
      )}
      <p className={`coverage${open.length ? "" : " is-full"}`}>
        {!open.length ? "Queued for every outcome." : canBranch && open.length < outcomes.length ? `Not decided if you see ${open.map(roleName).join(", ")}: you will be asked on your turn.` : "Not decided yet."}
      </p>
    </div>
  );
}
