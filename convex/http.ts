/**
 * HTTP routes: the MCP server and the OAuth 2.1 authorization server that guards it.
 *
 *   POST /mcp                                    the MCP server (convex/mcp.ts)
 *   GET  /.well-known/oauth-protected-resource   RFC 9728: where to get a token for /mcp
 *   GET  /.well-known/oauth-authorization-server RFC 8414: this server's endpoints
 *   POST /oauth/register                         RFC 7591: dynamic client registration (public clients)
 *   GET  /oauth/authorize                        starts a request, sends the person to the app's Connect page
 *   GET  /oauth/complete                         after they answer there: back to the client with a code
 *   POST /oauth/token                            authorization_code (PKCE S256) and refresh_token
 *   POST /oauth/revoke                           RFC 7009
 */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ACCESS_SECONDS, s256, secret, sha256 } from "./auth";
import { appUrl, notAllowed, post, site } from "./mcp";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const oauthError = (error: string, description: string, status = 400) => json({ error, error_description: description }, status);
const redirect = (to: string) => new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store" } });
const SCOPES = ["read", "act", "host"] as const;

/** https anywhere, or http on the loopback interface (native clients). */
const redirectOk = (uri: string) => { try { const u = new URL(uri); return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)); } catch { return false; } };
/** Form-encoded or JSON bodies, as OAuth clients send either. */
async function fields(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  if ((req.headers.get("Content-Type") ?? "").includes("json")) { try { return JSON.parse(text); } catch { return {}; } }
  return Object.fromEntries(new URLSearchParams(text));
}

const http = httpRouter();
http.route({ path: "/mcp", method: "POST", handler: post });
http.route({ path: "/mcp", method: "GET", handler: notAllowed });
http.route({ path: "/mcp", method: "DELETE", handler: notAllowed });

const resource = httpAction(async () => json({ resource: `${site()}/mcp`, authorization_servers: [site()], bearer_methods_supported: ["header"], scopes_supported: SCOPES, resource_name: "Centaur Werewolf" }));
http.route({ path: "/.well-known/oauth-protected-resource", method: "GET", handler: resource });
http.route({ path: "/.well-known/oauth-protected-resource/mcp", method: "GET", handler: resource });
http.route({
  path: "/.well-known/oauth-authorization-server", method: "GET",
  handler: httpAction(async () => json({
    issuer: site(), authorization_endpoint: `${site()}/oauth/authorize`, token_endpoint: `${site()}/oauth/token`, registration_endpoint: `${site()}/oauth/register`, revocation_endpoint: `${site()}/oauth/revoke`,
    response_types_supported: ["code"], grant_types_supported: ["authorization_code", "refresh_token"], code_challenge_methods_supported: ["S256"], token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: SCOPES, authorization_response_iss_parameter_supported: true,
  })),
});

http.route({
  path: "/oauth/register", method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: { redirect_uris?: unknown; client_name?: unknown };
    try { body = await req.json(); } catch { return oauthError("invalid_client_metadata", "The body must be JSON."); }
    const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
    if (uris.length < 1 || uris.length > 10 || !uris.every(redirectOk)) return oauthError("invalid_redirect_uri", "Give 1 to 10 redirect URIs, each https or loopback http.");
    const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim().slice(0, 80) : "An MCP client";
    const metaHash = await sha256(JSON.stringify([name, [...uris].sort()]));
    const clientId = await ctx.runMutation(internal.auth.registerClient, { name, redirectUris: uris, metaHash, clientId: `cwo_${metaHash.slice(0, 32)}` });
    return json({ client_id: clientId, client_name: name, redirect_uris: uris, token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: SCOPES.join(" ") }, 201);
  }),
});

http.route({
  path: "/oauth/authorize", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const q = new URL(req.url).searchParams;
    const client = await ctx.runQuery(internal.auth.client, { clientId: q.get("client_id") ?? "" });
    const redirectUri = q.get("redirect_uri") ?? "";
    // Until the client and its redirect URI are known to match, nothing is redirected anywhere.
    if (!client || !client.redirectUris.includes(redirectUri)) return oauthError("invalid_request", "Unknown client or redirect URI. Register the client first.");
    const back = (error: string, description: string) => { const u = new URL(redirectUri); u.searchParams.set("error", error); u.searchParams.set("error_description", description); if (q.get("state")) u.searchParams.set("state", q.get("state")!); u.searchParams.set("iss", site()); return redirect(u.toString()); };
    if (q.get("response_type") !== "code") return back("unsupported_response_type", "Only the code flow is supported.");
    const challenge = q.get("code_challenge") ?? "";
    if (q.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return back("invalid_request", "PKCE with S256 is required.");
    const resourceAsked = q.get("resource");
    if (resourceAsked && ![site(), `${site()}/mcp`].includes(resourceAsked.replace(/\/$/, ""))) return back("invalid_target", "This server issues tokens for its own /mcp only.");
    const asked = (q.get("scope") ?? "").split(/\s+/);
    const scope = ([...SCOPES].reverse().find(s => asked.includes(s)) ?? "act");
    const key = secret("cwq");
    await ctx.runMutation(internal.auth.startRequest, { keyHash: await sha256(key), clientId: client.clientId, clientName: client.name, redirectUri, state: q.get("state") ?? undefined, challenge, scope });
    return redirect(`${appUrl()}/#/connect/${key}`);
  }),
});

http.route({
  path: "/oauth/complete", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const q = new URL(req.url).searchParams;
    const code = secret("cwc");
    const r = await ctx.runMutation(internal.auth.releaseCode, { keyHash: await sha256(q.get("request") ?? ""), completionHash: await sha256(q.get("completion") ?? ""), codeHash: await sha256(code) });
    if ("error" in r) return new Response(r.error === "wrong_browser" ? "This request was answered in a different browser." : "This request has expired. Start again from your assistant.", { status: r.error === "wrong_browser" ? 403 : 410 });
    const u = new URL(r.redirectUri);
    if ("denied" in r) u.searchParams.set("error", "access_denied"); else u.searchParams.set("code", code);
    if (r.state) u.searchParams.set("state", r.state);
    u.searchParams.set("iss", site());
    return redirect(u.toString());
  }),
});

http.route({
  path: "/oauth/token", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const f = await fields(req);
    const access = secret("cwa"), refresh = secret("cwr");
    const hashes = { accessHash: await sha256(access), refreshHash: await sha256(refresh) };
    let r: { error: string } | { scope: string; roomCode: string };
    if (f.grant_type === "authorization_code") {
      if (!f.code || !f.code_verifier || !f.client_id || !f.redirect_uri) return oauthError("invalid_request", "code, code_verifier, client_id and redirect_uri are required.");
      r = await ctx.runMutation(internal.auth.exchangeCode, { codeHash: await sha256(f.code), clientId: f.client_id, redirectUri: f.redirect_uri, challenge: await s256(f.code_verifier), ...hashes });
    } else if (f.grant_type === "refresh_token") {
      if (!f.refresh_token || !f.client_id) return oauthError("invalid_request", "refresh_token and client_id are required.");
      r = await ctx.runMutation(internal.auth.refresh, { refreshHash: await sha256(f.refresh_token), clientId: f.client_id, accessHash: hashes.accessHash, newRefreshHash: hashes.refreshHash });
    } else return oauthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
    if ("error" in r) return oauthError(r.error, "The code or refresh token is invalid, expired or already used.");
    return json({ access_token: access, token_type: "Bearer", expires_in: ACCESS_SECONDS, refresh_token: refresh, scope: r.scope, room_code: r.roomCode });
  }),
});

http.route({
  path: "/oauth/revoke", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const f = await fields(req);
    if (f.token) await ctx.runMutation(internal.auth.revokeByToken, { hash: await sha256(f.token) });
    return json({});
  }),
});

const preflight = httpAction(async () => new Response(null, { status: 204, headers: CORS }));
for (const path of ["/oauth/register", "/oauth/token", "/oauth/revoke", "/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp", "/.well-known/oauth-authorization-server"]) http.route({ path, method: "OPTIONS", handler: preflight });

export default http;
