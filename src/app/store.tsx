/**
 * The app's one store: the room subscription, the command runner, and this person's layout. Every change to the game
 * goes through `exec(commandId, args)`, which is the registry's `run` mutation for server commands and a local
 * handler for `ui.*` commands; components never call a mutation directly.
 */
import { useMutation, useQueries } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { availability, COMMAND, HOME_CONTEXT, type Availability, type CommandContext, type CommandDef, type CommandId, type Grant } from "../../shared/commands";
import type { RoleId, Slot } from "../../shared/roles";
import { readNumber, routeFromHash, saveNumber, TOKEN, type Route } from "./session";

export type View = NonNullable<FunctionReturnType<typeof api.rooms.view>>;
/** The connection as this person experiences it. One state for every cause: a lost network and a server that will not answer look the same. */
export type Link = "ok" | "reconnecting";
/** The words for anything not sent while the connection is down, whatever the cause. */
export const NOT_CONNECTED = "Not sent: you are not connected. Reconnecting to the table…";
/** How long a heartbeat, and any command, may go without an answer before it counts as lost. */
const BEAT_DEADLINE_MS = 8000, SEND_DEADLINE_MS = 10000, GRACE_MS = 2000;
const isUnreachable = (e: unknown) => e instanceof ConvexError && typeof e.data === "string" && e.data.startsWith("UNREACHABLE");
export type Message = View["messages"][number];

/** Targets on the table that can be clicked right now, and what clicking one does. `chosen` is in pick order. */
export interface Picker { legal: Slot[]; chosen: Slot[]; hint: string; ordered?: boolean; /** Everything is chosen already: the targets stay clickable, but quietly. */ done?: boolean; onPick(slot: Slot): void }
export interface Ui { assistant: boolean; sidebar: boolean; dock: number }
export interface PaletteInit { page?: string }
export type Tab = "mine" | "chat";
/** A key just made, shown once. */
export interface FreshKey { key: string; permission: Grant; label: string }
export type Dialog = { kind: "roles"; role?: RoleId } | { kind: "connect"; fresh?: FreshKey } | null;
export interface ExecOptions {
  /** Run against this room instead of the one in view (the Connect page answers for a room chosen there). */
  code?: string;
  /** Do not navigate after creating or joining a room. */
  stay?: boolean;
  /** Do not show a toast when it fails; the caller shows the error itself. */
  quiet?: boolean;
}

interface App {
  route: Route;
  code: string | null;
  /** undefined: loading. null: no such room. */
  view: View | null | undefined;
  ctx: CommandContext;
  exec(id: CommandId, args?: Record<string, unknown>, opts?: ExecOptions): Promise<unknown>;
  go(code: string | null): void;
  ui: Ui;
  setUi(patch: Partial<Ui>): void;
  picker: Picker | null;
  setPicker(p: Picker | null): void;
  palette: { open: boolean; init?: PaletteInit };
  openPalette(init?: PaletteInit): void;
  closePalette(): void;
  dialog: Dialog;
  setDialog(d: Dialog): void;
  tab: Tab;
  setTab(t: Tab): void;
  toasts: { id: number; text: string; tone?: "error" | "ok" }[];
  toast(text: string, tone?: "error" | "ok"): void;
  /** The connection: ok, or reconnecting (showing the last data received). */
  link: Link;
  /** The server's clock, as best known (for presence). Frozen while reconnecting, so nothing seems to change. */
  serverNow(): number;
}

const Ctx = createContext<App | null>(null);
export const useApp = () => useContext(Ctx)!;

export function AppProvider({ children, resetConnection }: { children: ReactNode; resetConnection?: () => void }) {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => { const on = () => setRoute(routeFromHash()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  const go = useCallback((c: string | null) => { location.hash = c ? `#/${c}` : ""; setRoute(c ? { kind: "room", code: c } : { kind: "home" }); }, []);
  const code = route.kind === "room" ? route.code : null;

  // The room view. A failing view (the server refuses to serve this player, or anything else) is never shown as an
  // error: the last view received stays on screen and the page says it is reconnecting, exactly as on a lost network.
  const queries = useMemo((): Parameters<typeof useQueries>[0] => (code ? { view: { query: api.rooms.view, args: { code, token: TOKEN } } } : {}), [code]);
  const res = useQueries(queries) as { view?: View | null | Error };
  const raw = res.view;
  const last = useRef<{ code: string | null; view: View | null | undefined; at: number; offset: number }>({ code: null, view: undefined, at: 0, offset: 0 });
  if (last.current.code !== code) last.current = { code, view: undefined, at: 0, offset: 0 };
  // A failing view keeps the last one on screen; it is not itself a signal (the heartbeat's deadline is).
  const viewFailing = raw instanceof Error;
  if (!viewFailing && raw !== undefined && raw !== last.current.view) last.current = { code, view: raw, at: Date.now(), offset: raw ? raw.serverNow - Date.now() : 0 };
  const view = last.current.view;
  const mutate = useMutation(api.commands.run);
  const [ui, setUiState] = useState<Ui>(() => ({ assistant: false, sidebar: true, dock: readNumber("cw.dock", 220) }));
  const setUi = useCallback((patch: Partial<Ui>) => setUiState(u => { if (patch.dock) saveNumber("cw.dock", patch.dock); return { ...u, ...patch }; }), []);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [palette, setPalette] = useState<{ open: boolean; init?: PaletteInit }>({ open: false });
  const openPalette = useCallback((init?: PaletteInit) => setPalette({ open: true, init }), []);
  const closePalette = useCallback(() => setPalette({ open: false }), []);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [tab, setTab] = useState<Tab>("mine");

  const [toasts, setToasts] = useState<App["toasts"]>([]);
  const nextToast = useRef(1);
  const toast = useCallback((text: string, tone?: "error" | "ok") => {
    const id = nextToast.current++;
    setToasts(t => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  // The connection, as one state, from one signal: does the heartbeat get an answer before its deadline? A refusal
  // from the server is held until that same deadline, so a server that will not answer and a network that cannot
  // carry the answer look alike in every way, timing included. Then the same short grace before it shows.
  const hbFailing = useRef(false);
  const [link, setLink] = useState<Link>("ok");
  const troubleSince = useRef<number | null>(null);
  const frozenAt = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const bad = hbFailing.current;
      if (!bad) troubleSince.current = null;
      else troubleSince.current ??= Date.now();
      const next: Link = troubleSince.current !== null && Date.now() - troubleSince.current >= GRACE_MS ? "reconnecting" : "ok";
      setLink(l => (l === next ? l : next));
    };
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);
  // While reconnecting, the clock for presence stops where the last data was received: nobody seems to change.
  if (link === "reconnecting") frozenAt.current ??= last.current.view ? last.current.view.serverNow : Date.now() + last.current.offset;
  else frozenAt.current = null;
  const serverNow = useCallback(() => frozenAt.current ?? Date.now() + last.current.offset, []);

  // The heartbeat the server expects (presence.heartbeat, every view.presence.heartbeatMs). One at a time; one that
  // fails or does not come back within a few seconds counts as trouble. Never a toast, never a log.
  const member = !!view?.me;
  const beatMs = view?.presence.heartbeatMs ?? 5000;
  useEffect(() => {
    if (!code || !member) return;
    let pending = false, stopped = false;
    const beat = () => {
      if (pending || stopped) return;
      pending = true;
      // No answer by the deadline is trouble. A refusal waits for the deadline too, so it cannot arrive sooner than
      // silence would; the next heartbeat goes once this one has settled, so a lost network does not pile them up.
      const sentAt = Date.now();
      const late = setTimeout(() => { hbFailing.current = true; }, BEAT_DEADLINE_MS);
      mutate({ id: "presence.heartbeat", token: TOKEN, code, args: {} }).then(
        () => { clearTimeout(late); hbFailing.current = false; pending = false; },
        // Once already reconnecting, a refusal settles at once and the next probe follows within a second.
        () => { setTimeout(() => { hbFailing.current = true; pending = false; }, hbFailing.current ? 0 : Math.max(0, BEAT_DEADLINE_MS - (Date.now() - sentAt))); },
      );
    };
    beat();
    let since = Date.now();
    const t = setInterval(() => { if (Date.now() - since >= (hbFailing.current ? 1000 : beatMs)) { since = Date.now(); beat(); } }, 250);
    return () => { stopped = true; clearInterval(t); };
  }, [code, member, beatMs, mutate]);

  const linkRef = useRef(link);
  linkRef.current = link;
  const ctx = view?.context ?? HOME_CONTEXT;
  const exec = useCallback(async (id: CommandId, args: Record<string, unknown> = {}, opts: ExecOptions = {}) => {
    const cmd = COMMAND[id];
    if (cmd.runs === "client") {
      if (id === "ui.toggleAssistant") setUiState(u => ({ ...u, assistant: !u.assistant }));
      if (id === "ui.toggleSidebar") setUiState(u => ({ ...u, sidebar: !u.sidebar }));
      if (id === "ui.showRoles") { closePalette(); setDialog({ kind: "roles" }); }
      if (id === "ui.goHome") go(null);
      if (id === "ui.copyInvite") {
        const link = `${location.origin}${location.pathname}#/${code ?? ""}`;
        await navigator.clipboard?.writeText(link).then(() => toast("Invite link copied. Send it to the others.", "ok"), () => toast(`Invite link: ${link}`));
      }
      return null;
    }
    // Nothing is sent, and nothing is queued for later, while the connection is down: the same refusal for every cause.
    if (linkRef.current === "reconnecting" && cmd.contexts[0] !== "home") {
      if (!opts.quiet) toast(NOT_CONNECTED, "error");
      throw new ConvexError(NOT_CONNECTED);
    }
    const sentAt = Date.now();
    try {
      const timeout = new Promise<never>((_, no) => setTimeout(() => no(new ConvexError(NOT_CONNECTED)), SEND_DEADLINE_MS));
      const result = await Promise.race([mutate({ id, token: TOKEN, code: opts.code ?? code ?? undefined, args }), timeout]);
      if ((id === "room.create" || id === "room.join") && !opts.stay) go((result as { code: string }).code);
      if (id === "room.leave") go(null);
      return result;
    } catch (e) {
      const unreachable = isUnreachable(e) || (e instanceof ConvexError && e.data === NOT_CONNECTED);
      // It may still sit in the client's queue (no answer at all). Replace the client, so "not sent" stays true; the
      // same whatever the cause, so the two cases cannot differ even in how the page reconnects.
      if (unreachable) resetConnection?.();
      // A refusal for being unreachable is reported when silence would have been: at the deadline.
      if (unreachable) await new Promise(ok => setTimeout(ok, Math.max(0, SEND_DEADLINE_MS - (Date.now() - sentAt))));
      if (!opts.quiet) toast(unreachable ? NOT_CONNECTED : e instanceof ConvexError ? String(e.data) : "That did not go through. Try again.", "error");
      throw unreachable ? new ConvexError(NOT_CONNECTED) : e;
    }
  }, [mutate, code, go, toast, closePalette, resetConnection]);

  const app = useMemo<App>(() => ({ route, code, view, ctx, exec, go, ui, setUi, picker, setPicker, palette, openPalette, closePalette, dialog, setDialog, tab, setTab, toasts, toast, link, serverNow }),
    [route, code, view, ctx, exec, go, ui, setUi, picker, palette, openPalette, closePalette, dialog, tab, toasts, toast, link, serverNow]);
  return <Ctx.Provider value={app}>{children}</Ctx.Provider>;
}

/** One command as a control sees it: its registry entry, whether it can run now (and why not), and how to run it. */
export function useCommand(id: CommandId, args?: Record<string, unknown>): { def: CommandDef; can: Availability; run(extra?: Record<string, unknown>): Promise<unknown> } {
  const { ctx, exec } = useApp();
  const def = COMMAND[id];
  return { def, can: availability(def, ctx, args), run: extra => exec(id, { ...args, ...extra }).catch(() => null) };
}

/** A clock that re-renders its caller, for countdowns. */
export function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** The previous value of something, to notice changes (a new phase, a new message) and animate them. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prev = ref.current;
  useEffect(() => { ref.current = value; });
  return prev;
}

export const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
