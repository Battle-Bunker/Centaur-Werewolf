/**
 * Credentials: how an assistant proves it may act as one player in one room.
 *
 * Two ways to get one, both ending in a `credentials` row (the approach Code-Gods uses):
 *  - a pasted key: the player makes one in the app (`connect.createKey`) and gives it to their MCP client as a
 *    bearer token;
 *  - OAuth 2.1 (authorization code + PKCE, public clients, dynamic registration): the MCP client sends the player to
 *    the app's Connect page, they pick a room and approve, and the client receives an access and a refresh token.
 *
 * Secrets are never stored: only their SHA-256 hashes are.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { Grant } from "../shared/commands";

export const KEY_DAYS = 30, ACCESS_SECONDS = 3600, REFRESH_DAYS = 30, REQUEST_MINUTES = 10;
const DAY = 86_400_000;

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
/** base64url of the SHA-256 of `text`: the S256 PKCE transform. */
export async function s256(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return btoa(String.fromCharCode(...digest)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
/** A fresh secret: 32 random bytes, base64url, behind a prefix that says what it is. */
export function secret(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `${prefix}_${btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

export async function createKey(ctx: MutationCtx, player: Doc<"players">, permission: Grant, label: string) {
  const key = secret("cwk");
  const id = await ctx.db.insert("credentials", { tokenHash: await sha256(key), player: player._id, room: player.room, permission, label, kind: "key", expiresAt: Date.now() + KEY_DAYS * DAY });
  return { key, id };
}

/** The live credential for a bearer token's hash, with what it is bound to. Null: unknown, expired, revoked, or its player has left. */
export const resolve = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const cred = await ctx.db.query("credentials").withIndex("token", q => q.eq("tokenHash", tokenHash)).unique();
    if (!cred || cred.revokedAt || cred.expiresAt < Date.now()) return null;
    const player = await ctx.db.get(cred.player), room = await ctx.db.get(cred.room);
    if (!player || !room) return null;
    return { credential: cred._id, player: player._id, name: player.name, code: room.code, permission: cred.permission as Grant, stale: (cred.lastUsedAt ?? 0) < Date.now() - 60_000 };
  },
});
export const touch = internalMutation({
  args: { credential: v.id("credentials") },
  handler: async (ctx, { credential }) => { await ctx.db.patch(credential, { lastUsedAt: Date.now() }); },
});

// ───────────────────────────── OAuth ─────────────────────────────

export const registerClient = internalMutation({
  args: { name: v.string(), redirectUris: v.array(v.string()), metaHash: v.string(), clientId: v.string() },
  handler: async (ctx, a) => {
    const same = await ctx.db.query("oauthClients").withIndex("meta", q => q.eq("metaHash", a.metaHash)).first();
    if (same) return same.clientId;
    await ctx.db.insert("oauthClients", a);
    return a.clientId;
  },
});
export const client = internalQuery({
  args: { clientId: v.string() },
  handler: (ctx, { clientId }) => ctx.db.query("oauthClients").withIndex("clientId", q => q.eq("clientId", clientId)).unique(),
});

export const startRequest = internalMutation({
  args: { keyHash: v.string(), clientId: v.string(), clientName: v.string(), redirectUri: v.string(), state: v.optional(v.string()), challenge: v.string(), scope: v.union(v.literal("read"), v.literal("act"), v.literal("host")) },
  handler: async (ctx, a) => { await ctx.db.insert("oauthRequests", { ...a, status: "pending", expiresAt: Date.now() + REQUEST_MINUTES * 60_000 }); },
});

const liveRequest = async (ctx: MutationCtx, keyHash: string) => {
  const r = await ctx.db.query("oauthRequests").withIndex("key", q => q.eq("keyHash", keyHash)).unique();
  return r && r.expiresAt > Date.now() ? r : null;
};

/** The player's answer on the Connect page. `completionHash` ties the answer to the browser that gave it. */
export async function answerRequest(ctx: MutationCtx, requestKey: string, completion: string, approved: { player: Doc<"players">; permission: Grant } | null) {
  const r = await liveRequest(ctx, await sha256(requestKey));
  if (!r || r.status !== "pending") return "This request has expired. Start again from your assistant.";
  const order: Grant[] = ["read", "act", "host"];
  // The player may lower what the assistant asked for, never raise it.
  const permission = approved ? order[Math.min(order.indexOf(approved.permission), order.indexOf(r.scope))] : undefined;
  await ctx.db.patch(r._id, { status: approved ? "approved" : "denied", completionHash: await sha256(completion), player: approved?.player._id, room: approved?.player.room, permission });
  return null;
}

/** Releases the authorization code, once, to the browser that answered. */
export const releaseCode = internalMutation({
  args: { keyHash: v.string(), completionHash: v.string(), codeHash: v.string() },
  handler: async (ctx, a) => {
    const r = await liveRequest(ctx, a.keyHash);
    if (!r) return { error: "expired" as const };
    if (r.completionHash !== a.completionHash) return { error: "wrong_browser" as const };
    if (r.status === "denied") { await ctx.db.patch(r._id, { status: "used" }); return { denied: true as const, redirectUri: r.redirectUri, state: r.state }; }
    if (r.status !== "approved") return { error: "expired" as const };
    await ctx.db.patch(r._id, { status: "released", codeHash: a.codeHash, expiresAt: Date.now() + 60_000 });
    return { redirectUri: r.redirectUri, state: r.state };
  },
});

const issue = async (ctx: MutationCtx, into: Id<"credentials"> | null, base: { player: Id<"players">; room: Id<"rooms">; permission: Grant; label: string; clientId: string }, t: { accessHash: string; refreshHash: string }, retired?: string) => {
  const fields = { tokenHash: t.accessHash, expiresAt: Date.now() + ACCESS_SECONDS * 1000, refreshHash: t.refreshHash, refreshExpiresAt: Date.now() + REFRESH_DAYS * DAY, retiredRefreshHash: retired };
  if (into) { await ctx.db.patch(into, fields); return into; }
  return ctx.db.insert("credentials", { ...base, kind: "oauth", ...fields });
};

/** authorization_code grant. A code presented twice revokes what it produced. */
export const exchangeCode = internalMutation({
  args: { codeHash: v.string(), clientId: v.string(), redirectUri: v.string(), challenge: v.string(), accessHash: v.string(), refreshHash: v.string() },
  handler: async (ctx, a) => {
    const r = await ctx.db.query("oauthRequests").withIndex("code", q => q.eq("codeHash", a.codeHash)).unique();
    if (!r) return { error: "invalid_grant" };
    if (r.status === "used") { if (r.credential) await ctx.db.patch(r.credential, { revokedAt: Date.now() }); return { error: "invalid_grant" }; }
    if (r.status !== "released" || r.expiresAt < Date.now() || r.clientId !== a.clientId || r.redirectUri !== a.redirectUri || r.challenge !== a.challenge) return { error: "invalid_grant" };
    const player = await ctx.db.get(r.player!), room = await ctx.db.get(r.room!);
    if (!player || !room) return { error: "invalid_grant" };
    const credential = await issue(ctx, null, { player: player._id, room: room._id, permission: r.permission!, label: r.clientName, clientId: r.clientId }, a);
    await ctx.db.patch(r._id, { status: "used", credential });
    return { scope: r.permission!, roomCode: room.code, player: player.name };
  },
});

/** refresh_token grant: the refresh token rotates. Presenting a retired one means it leaked: the grant is revoked. */
export const refresh = internalMutation({
  args: { refreshHash: v.string(), clientId: v.string(), accessHash: v.string(), newRefreshHash: v.string() },
  handler: async (ctx, a) => {
    const cred = await ctx.db.query("credentials").withIndex("refresh", q => q.eq("refreshHash", a.refreshHash)).unique();
    if (!cred) {
      const leaked = await ctx.db.query("credentials").withIndex("retired", q => q.eq("retiredRefreshHash", a.refreshHash)).unique();
      if (leaked) await ctx.db.patch(leaked._id, { revokedAt: Date.now() });
      return { error: "invalid_grant" };
    }
    if (cred.revokedAt || cred.clientId !== a.clientId || (cred.refreshExpiresAt ?? 0) < Date.now()) return { error: "invalid_grant" };
    const room = await ctx.db.get(cred.room);
    if (!room || !(await ctx.db.get(cred.player))) return { error: "invalid_grant" };
    await issue(ctx, cred._id, { player: cred.player, room: cred.room, permission: cred.permission, label: cred.label, clientId: a.clientId }, { accessHash: a.accessHash, refreshHash: a.newRefreshHash }, a.refreshHash);
    return { scope: cred.permission, roomCode: room.code };
  },
});

/** RFC 7009: revoke by access or refresh token. Always succeeds from the caller's point of view. */
export const revokeByToken = internalMutation({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    const cred = (await ctx.db.query("credentials").withIndex("token", q => q.eq("tokenHash", hash)).unique())
      ?? (await ctx.db.query("credentials").withIndex("refresh", q => q.eq("refreshHash", hash)).unique());
    if (cred && !cred.revokedAt) await ctx.db.patch(cred._id, { revokedAt: Date.now() });
  },
});
