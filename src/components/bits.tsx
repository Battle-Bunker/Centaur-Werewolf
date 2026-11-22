/** Small shared pieces: a button bound to a registry command, cards and role art, avatars, countdowns. */
import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import type { CommandId } from "../../shared/commands";
import { ROLE, TEAM_NAME, type RoleId, type Team } from "../../shared/roles";
import { clock } from "../../shared/text";
import { useApp, useCommand, useNow } from "../app/store";
import { teamShort } from "../app/teams";
import { PAGES } from "../palette/pages";

/**
 * A button for one registry command. It is enabled exactly when the registry says the command can run, shows the
 * registry's tooltip (or the reason it cannot run), and opens the palette's page when the command needs arguments
 * that were not supplied. A command the registry marks `confirm: "inline"` asks for a second click, as the palette
 * asks for a second Enter.
 */
export function CommandButton({ id, args, children, variant = "plain", icon, showReason, className = "", disabled, ...rest }: {
  id: CommandId; args?: Record<string, unknown>; children?: ReactNode; variant?: "primary" | "plain" | "quiet" | "danger" | "secondary"; icon?: ReactNode;
  /** Show the reason it cannot run under the button, not only in its tooltip. */
  showReason?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "onClick">) {
  const { def, can, run } = useCommand(id, args);
  const { openPalette } = useApp();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(t); }, [armed]);
  if (!can.ok && can.hidden) return null;
  const needsPage = !!PAGES[id] && !args;
  const click = async () => {
    if (needsPage) return openPalette({ page: id });
    if (def.confirm === "inline" && !armed) return setArmed(true);
    setArmed(false); setBusy(true);
    await run();
    setBusy(false);
  };
  const button = (
    <button type="button" className={`btn btn-${armed ? "danger" : variant}${busy ? " is-busy" : ""} ${className}`} disabled={!can.ok || busy || disabled} title={can.ok ? def.tooltip : can.reason} data-command={id} onClick={() => void click()} {...rest}>
      {icon}
      <span>{armed ? "Click again to confirm" : (children ?? def.title)}</span>
      {def.shortcut && variant === "primary" && !armed && <kbd>{def.shortcut}</kbd>}
    </button>
  );
  if (!showReason || can.ok) return button;
  return <div className="btn-with-reason">{button}<span className="btn-reason">{can.reason}</span></div>;
}

export const art = (role: RoleId | null) => `/art/${role ?? "back"}.webp`;

/**
 * A card that can be face down or face up, and turns over (a 3D flip) when its face changes from hidden to shown.
 * `role === null` is face down.
 */
export function Card({ role, size, className = "", label, style, flipDelay = 0, reveal = false }: {
  role: RoleId | null; size?: number | string; className?: string; label?: string; style?: CSSProperties; flipDelay?: number;
  /** Start face down and turn over once shown, even if the face is already known. */
  reveal?: boolean;
}) {
  const [face, setFace] = useState<RoleId | null>(role);
  const [up, setUp] = useState(!!role && !reveal);
  useEffect(() => {
    if (role) { setFace(role); const t = setTimeout(() => setUp(true), 30 + flipDelay); return () => clearTimeout(t); }
    setUp(false);
    const t = setTimeout(() => setFace(null), 500);
    return () => clearTimeout(t);
  }, [role, flipDelay]);
  const s = size === undefined ? undefined : typeof size === "number" ? `${size}px` : size;
  return (
    <span className={`card3d${up ? " is-up" : ""} ${className}`} style={{ ...(s ? { width: s, height: s } : {}), ...style }} role="img" aria-label={label ?? (role ? ROLE[role].name : "Face-down card")}>
      <span className="card3d-inner">
        <span className="card3d-face card3d-back"><img src={art(null)} alt="" draggable={false} /></span>
        <span className="card3d-face card3d-front">{face && <img src={art(face)} alt="" draggable={false} />}</span>
      </span>
    </span>
  );
}

export function TeamBadge({ team, short }: { team: Team; short?: boolean }) {
  return <span className={`team-badge team-${team}`}><span className="team-pip" aria-hidden />{short ? teamShort(team) : TEAM_NAME[team]}</span>;
}
/** The full card for a role: art, name, team and rule. */
export function RoleCard({ role, caption, children, compact, reveal }: { role: RoleId; caption?: string; children?: ReactNode; compact?: boolean; reveal?: boolean }) {
  const r = ROLE[role];
  return (
    <div className={`role-card${compact ? " is-compact" : ""}`}>
      <Card role={role} className="role-card-art" reveal={reveal} flipDelay={reveal ? 1700 : 0} />
      <div className="role-card-text">
        {caption && <div className="eyebrow">{caption}</div>}
        <h3>{r.name}</h3>
        <TeamBadge team={r.team} />
        {compact || r.rules.length < 260 ? <p>{compact ? r.blurb : r.rules}</p> : (
          <details className="role-rules"><summary><p>{r.blurb}</p><span className="role-rules-more">The full rule</span></summary><p>{r.rules}</p></details>
        )}
        {children}
      </div>
    </div>
  );
}

const AVATAR_TONES = ["forest", "plum", "amber", "moss", "dusk", "clay"] as const;
const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** A stand-in for a player's video: a printed monogram on a patterned ground, the same colours each time for a name. */
export function Avatar({ name, bot, size = "fill" }: { name: string; bot?: boolean; size?: "fill" | "sm" }) {
  const tone = AVATAR_TONES[hash(name) % AVATAR_TONES.length];
  const pattern = hash(name + "!") % 3;
  return (
    <span className={`avatar avatar-${size} tone-${tone} pat-${pattern}`} aria-hidden>
      <span className="avatar-mono">{bot ? "⚙" : (name.trim()[0] ?? "?").toUpperCase()}</span>
    </span>
  );
}

/** Time left until `until`, as a ring that drains from `from`. */
export function CountdownRing({ from, until, size = 64, children, label }: { from: number; until: number; size?: number; children?: ReactNode; label?: string }) {
  const now = useNow(200);
  const left = Math.max(0, until - now);
  const frac = until > from ? left / (until - from) : 0;
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return (
    <span className={`ring${left < 5000 ? " is-low" : ""}`} style={{ width: size, height: size }} role="timer" aria-label={`${label ?? "Time left"}: ${clock(left)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle className="ring-fill" cx={size / 2} cy={size / 2} r={r} strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-body">{children}</span>
    </span>
  );
}

export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
