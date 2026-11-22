/** Small shared pieces: a button bound to a registry command, role art, a countdown. */
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { CommandId } from "../../shared/commands";
import { ROLE, TEAM_NAME, type RoleId } from "../../shared/roles";
import { useApp, useCommand, useNow } from "../app/store";
import { PAGES } from "../palette/pages";
import { clock } from "../app/text";

/**
 * A button for one registry command. It is enabled exactly when the registry says the command can run, shows the
 * registry's tooltip (or the reason it cannot run), and opens the palette's page when the command needs arguments
 * that were not supplied. A command the registry marks `confirm: "inline"` asks for a second click, as the palette
 * asks for a second Enter.
 */
export function CommandButton({ id, args, children, variant = "plain", ...rest }: { id: CommandId; args?: Record<string, unknown>; children?: ReactNode; variant?: "primary" | "plain" | "quiet" | "danger" } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "onClick">) {
  const { def, can, run } = useCommand(id, args);
  const { openPalette } = useApp();
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(t); }, [armed]);
  if (!can.ok && can.hidden) return null;
  const needsPage = !!PAGES[id] && !args;
  const click = () => {
    if (needsPage) return openPalette({ page: id });
    if (def.confirm === "inline" && !armed) return setArmed(true);
    setArmed(false); void run();
  };
  return (
    <button type="button" className={`btn btn-${armed ? "danger" : variant}`} disabled={!can.ok} title={can.ok ? def.tooltip : can.reason} data-command={id} onClick={click} {...rest}>
      {armed ? "Click again to confirm" : (children ?? def.title)}
      {def.shortcut && variant === "primary" && <kbd>{def.shortcut}</kbd>}
    </button>
  );
}

export const art = (role: RoleId | null) => `/art/${role ?? "back"}.webp`;

export function RoleArt({ role, size, label }: { role: RoleId | null; size?: number; label?: string }) {
  return <img className="role-art" src={art(role)} width={size} height={size} alt={label ?? (role ? ROLE[role].name : "Face-down card")} draggable={false} />;
}

export function TeamDot({ role }: { role: RoleId }) {
  const team = ROLE[role].team;
  return <span className={`team-dot team-${team}`} title={TEAM_NAME[team]} aria-label={TEAM_NAME[team]} />;
}

/** The full card for a role: art, name, team and rule. */
export function RoleCard({ role, caption }: { role: RoleId; caption?: string }) {
  const r = ROLE[role];
  return (
    <div className="role-card">
      <RoleArt role={role} />
      <div className="role-card-text">
        {caption && <div className="eyebrow">{caption}</div>}
        <h3>{r.name}</h3>
        <div className="role-team"><TeamDot role={role} /> {TEAM_NAME[r.team]}</div>
        <p>{r.rules}</p>
      </div>
    </div>
  );
}

/** Time left until `until`, with a bar that drains from `from`. */
export function Countdown({ from, until, label }: { from: number; until: number; label?: string }) {
  const now = useNow();
  const left = Math.max(0, until - now);
  const frac = until > from ? left / (until - from) : 0;
  return (
    <div className={`countdown${left < 5000 ? " is-low" : ""}`} role="timer" aria-label={label}>
      <span className="countdown-time">{clock(left)}</span>
      <span className="countdown-bar"><span style={{ width: `${Math.min(100, frac * 100)}%` }} /></span>
    </div>
  );
}
