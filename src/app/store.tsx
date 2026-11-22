/**
 * The app's one store: the room subscription, the command runner, and this person's layout. Every change to the game
 * goes through `exec(commandId, args)`, which is the registry's `run` mutation for server commands and a local
 * handler for `ui.*` commands; components never call a mutation directly.
 */
import { useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { availability, COMMAND, HOME_CONTEXT, type Availability, type CommandContext, type CommandDef, type CommandId, type Grant } from "../../shared/commands";
import type { RoleId, Slot } from "../../shared/roles";
import { readNumber, routeFromHash, saveNumber, TOKEN, type Route } from "./session";

export type View = NonNullable<FunctionReturnType<typeof api.rooms.view>>;
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
  online: boolean;
}

const Ctx = createContext<App | null>(null);
export const useApp = () => useContext(Ctx)!;

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => { const on = () => setRoute(routeFromHash()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  const go = useCallback((c: string | null) => { location.hash = c ? `#/${c}` : ""; setRoute(c ? { kind: "room", code: c } : { kind: "home" }); }, []);
  const code = route.kind === "room" ? route.code : null;

  const view = useQuery(api.rooms.view, code ? { code, token: TOKEN } : "skip");
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

  // The connection to the server, for the "reconnecting" banner. Checked gently; a short blip shows nothing.
  const convex = useConvex();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let down = 0;
    const t = setInterval(() => {
      const s = convex.connectionState();
      down = s.isWebSocketConnected ? 0 : down + 1;
      setOnline(down < 3);
    }, 1000);
    return () => clearInterval(t);
  }, [convex]);

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
    try {
      const result = await mutate({ id, token: TOKEN, code: opts.code ?? code ?? undefined, args });
      if ((id === "room.create" || id === "room.join") && !opts.stay) go((result as { code: string }).code);
      if (id === "room.leave") go(null);
      return result;
    } catch (e) {
      if (!opts.quiet) toast(e instanceof ConvexError ? String(e.data) : "That did not go through. Try again.", "error");
      throw e;
    }
  }, [mutate, code, go, toast, closePalette]);

  const app = useMemo<App>(() => ({ route, code, view, ctx, exec, go, ui, setUi, picker, setPicker, palette, openPalette, closePalette, dialog, setDialog, tab, setTab, toasts, toast, online }),
    [route, code, view, ctx, exec, go, ui, setUi, picker, palette, openPalette, closePalette, dialog, tab, toasts, toast, online]);
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
