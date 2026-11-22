/** The role reference: every role with its art, team, rule and when it wakes, filterable by team or by this deck. */
import { useEffect, useMemo, useRef, useState } from "react";
import { turnKey } from "../../shared/engine";
import { ROLE, ROLES, roleName, TEAM_NAME, type RoleId, type Team } from "../../shared/roles";
import { actsAtNight, rolesInTurn, ROSTER_TURNS, teamShort, TEAMS } from "../app/teams";

const CHAT_WORDS: Record<string, string> = {
  signed: "Once, posts a message the game seals as sent by the player dealt this card.",
  report: "Once, posts a sealed report the game writes from its night look.",
  forge: "Once, posts a message under another role's seal, identical to a real one until the game ends.",
  unsigned: "Once, posts a message with no name on it.",
};
const DAY_WORDS: Record<string, string> = {
  cut: "Once, cuts a player off for a while, exactly as if their connection dropped. Only the results reveal it.",
  swap: "Under the day-swap rule: queues a secret swap of two other players' cards, made as the vote ends.",
};
import { useApp } from "../app/store";
import { ordinal, TeamBadge } from "./bits";
import { IconMoon, IconX } from "./icons";

type Filter = "all" | Team | "deck";

export function Modal({ title, onClose, children, className = "", labelledBy }: { title?: string; onClose(): void; children: React.ReactNode; className?: string; labelledBy?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("[data-autofocus], button, input")?.focus();
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea, select, a[href], [tabindex]:not([tabindex='-1'])")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    addEventListener("keydown", on);
    return () => { removeEventListener("keydown", on); prev?.focus?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} ref={box}>
        <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close"><IconX /></button>
        {children}
      </div>
    </div>
  );
}

export function RoleBook() {
  const { dialog, setDialog, view } = useApp();
  const deck = view?.settings.deck ?? [];
  const [filter, setFilter] = useState<Filter>("all");
  const [sel, setSel] = useState<RoleId>(dialog?.kind === "roles" && dialog.role ? dialog.role : ROLES[0].id);
  const list = useMemo(() => ROLES.filter(r => filter === "all" || (filter === "deck" ? deck.includes(r.id) : r.team === filter)), [filter, deck]);
  const r = ROLE[sel];
  const wakeAt = r && actsAtNight(r) ? ROSTER_TURNS.indexOf(turnKey(r.id)) : -1;
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All ${ROLES.length}` }, ...TEAMS.map(t => ({ id: t as Filter, label: teamShort(t) })),
    ...(deck.length ? [{ id: "deck" as Filter, label: "In this deck" }] : []),
  ];
  const kin = r ? rolesInTurn(turnKey(r.id)).filter(x => x !== r.id) : [];
  return (
    <Modal onClose={() => setDialog(null)} className="rolebook" labelledBy="rolebook-title">
      <header className="modal-head">
        <div className="eyebrow">Reference</div>
        <h2 id="rolebook-title">The roles</h2>
        <div className="filters" role="tablist" aria-label="Show">
          {filters.map(f => <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`filter${filter === f.id ? " is-on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
      </header>
      <div className="rolebook-body">
        <ul className="rolebook-grid" aria-label="Roles">
          {list.map(x => (
            <li key={x.id}>
              <button type="button" className={`rolebook-card team-${x.team}${sel === x.id ? " is-on" : ""}`} aria-pressed={sel === x.id} onClick={() => setSel(x.id)}>
                <img src={`/art/${x.id}.webp`} alt="" loading="lazy" />
                <span className="rolebook-name">{x.name}</span>
                <span className="team-pip" aria-label={TEAM_NAME[x.team]} />
                {deck.includes(x.id) && <span className="rolebook-in" title="In this room's deck">×{deck.filter(d => d === x.id).length}</span>}
              </button>
            </li>
          ))}
        </ul>
        <article key={sel} className="rolebook-detail" aria-live="polite">
          <img src={`/art/${sel}.webp`} alt={`${r.name}, woodcut illustration`} />
          <div>
            <h3>{r.name}</h3>
            <TeamBadge team={r.team} />
            <p className="rolebook-rule">{r.rules}</p>
            <dl>
              <dt>At night</dt>
              <dd>{wakeAt >= 0 ? <><IconMoon size={14} /> Wakes {ordinal(wakeAt + 1)} of the {ROSTER_TURNS.length} night turns{r.twinOf ? `, in the ${roleName(r.twinOf)}'s turn (a shadow twin)` : r.turnOf && r.turnOf !== r.id ? `, in the shared ${roleName(r.turnOf)} turn` : ""}{kin.length ? `. Also in this turn: ${kin.map(roleName).join(", ")}` : ""}.</> : "Sleeps through the night."}</dd>
              {r.steps && actsAtNight(r) && <><dt>Steps</dt><dd>{r.steps.map(s => `${s.title}${s.optional ? " (may decline)" : ""}`).join(" → ")}</dd></>}
              {r.looksAs && <><dt>When looked at</dt><dd>Shows as a {roleName(r.looksAs)} (except to the Werewolf team).</dd></>}
              {r.vote && <><dt>At the vote</dt><dd>{r.vote.weight ? `Whoever holds it votes ${r.vote.weight === 2 ? "twice" : `${r.vote.weight} times`}.` : r.vote.takesTargetDown ? "If eliminated, takes their vote target down too." : "Protects whoever they vote for."}</dd></>}
              {r.chat && <><dt>In the day</dt><dd>{CHAT_WORDS[r.chat] ?? r.chat}</dd></>}
              {r.dayPower && <><dt>In the day</dt><dd>{DAY_WORDS[r.dayPower] ?? r.dayPower}</dd></>}
              {r.decoy && <><dt>If eliminated</dt><dd>Its team wins the main result outright.</dd></>}
              {r.heir && <><dt>At dawn</dt><dd>Becomes a Phoenix if no player holds one.</dd></>}
              {r.win && <><dt>Wins</dt><dd>{r.win === "markEliminated" ? "If the seat it marked is eliminated and its holder is not." : "Exactly when the seat it bonded to wins."}</dd></>}
              {r.max < 12 && <><dt>Copies</dt><dd>Up to {r.max} in a deck.</dd></>}
            </dl>
          </div>
        </article>
      </div>
    </Modal>
  );
}
