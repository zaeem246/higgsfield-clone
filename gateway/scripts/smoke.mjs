#!/usr/bin/env node
/**
 * Contract smoke test. Run against a gateway that is already listening:
 *
 *   npm run smoke                       # http://127.0.0.1:4000
 *   GATEWAY_URL=... npm run smoke
 *
 * Exit codes: 0 = everything checked passed (or the backend was absent and the
 * integration half was skipped), 1 = a real failure.
 */

const BASE = (process.env.GATEWAY_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "kg_session";

let passed = 0;
let failed = 0;
const notes = [];

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
  return ok;
}

// --- a cookie jar the size of this test -----------------------------------

const jar = new Map();
let capturedToken = null;
const bodies = [];

function applySetCookies(res) {
  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a));
    if (value === "" || expired) jar.delete(name);
    else jar.set(name, { value, raw });
  }
}

function cookieHeader() {
  return [...jar].map(([name, entry]) => `${name}=${entry.value}`).join("; ");
}

async function call(method, path, body) {
  const headers = { Accept: "application/json", Origin: "http://localhost:3000" };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  bodies.push({ path: `${method} ${path}`, text });
  applySetCookies(res);

  let json = null;
  try {
    json = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, res };
}

// --- checks ----------------------------------------------------------------

async function gatewayOnlyChecks() {
  console.log("\n-- gateway checks (no backend required) --");

  let health;
  try {
    health = await call("GET", "/api/health");
  } catch (cause) {
    check("gateway is reachable", false, `${BASE} -- ${cause.message}`);
    return { gatewayUp: false, backendUp: false };
  }

  check("GET /api/health responds 200", health.status === 200, `got ${health.status}`);
  check("health reports the gateway service", health.json?.service === "gateway");

  const me = await call("GET", "/api/auth/me");
  check(
    "GET /api/auth/me without a cookie is 401 unauthenticated",
    me.status === 401 && me.json?.error?.code === "unauthenticated",
    `got ${me.status} ${me.text}`,
  );

  const bad = await call("POST", "/api/generations", { prompt: "", kind: "banana" });
  check(
    "invalid body is rejected 400 invalid_request before it reaches Django",
    bad.status === 400 && bad.json?.error?.code === "invalid_request",
    `got ${bad.status} ${bad.text}`,
  );

  const unknown = await call("GET", "/api/nope");
  check(
    "unknown route returns the contract error shape",
    unknown.status === 404 && typeof unknown.json?.error?.message === "string",
    `got ${unknown.status}`,
  );

  const cors = await fetch(`${BASE}/api/health`, { headers: { Origin: "http://localhost:3000" } });
  check(
    "CORS echoes the allowed origin with credentials",
    cors.headers.get("access-control-allow-origin") === "http://localhost:3000" &&
      cors.headers.get("access-control-allow-credentials") === "true",
    `origin=${cors.headers.get("access-control-allow-origin")}`,
  );

  return { gatewayUp: true, backendUp: health.json?.backend?.reachable === true };
}

async function integrationChecks() {
  console.log("\n-- contract flow (gateway to Django) --");

  const stamp = Date.now();
  const account = {
    email: `smoke+${stamp}@kinograde.test`,
    name: "Smoke Test",
    password: "smoke-test-password-1",
  };

  const reg = await call("POST", "/api/auth/register", account);
  check("POST /api/auth/register returns 201", reg.status === 201, `got ${reg.status} ${reg.text}`);
  check(
    "register returns only { account }",
    !!reg.json?.account && Object.keys(reg.json).length === 1,
    reg.text.slice(0, 200),
  );
  check(
    "register body carries no token field",
    !/"(token|session_?token)"/i.test(reg.text),
    reg.text.slice(0, 200),
  );

  const cookie = jar.get(COOKIE_NAME);
  if (check(`register sets the ${COOKIE_NAME} cookie`, !!cookie)) {
    capturedToken = cookie.value;
    check("session cookie is HttpOnly", /;\s*httponly/i.test(cookie.raw), cookie.raw);
    check("session cookie is SameSite=Lax", /;\s*samesite=lax/i.test(cookie.raw), cookie.raw);
    check("session cookie is Path=/", /;\s*path=\//i.test(cookie.raw), cookie.raw);
  }

  const login = await call("POST", "/api/auth/login", {
    email: account.email,
    password: account.password,
  });
  check(
    "POST /api/auth/login returns 200 + account",
    login.status === 200 && !!login.json?.account,
    `got ${login.status} ${login.text.slice(0, 200)}`,
  );
  check("login refreshes the session cookie", jar.has(COOKIE_NAME));
  if (jar.has(COOKIE_NAME)) capturedToken = jar.get(COOKIE_NAME).value;

  const me = await call("GET", "/api/auth/me");
  check(
    "GET /api/auth/me with the cookie returns the account",
    me.status === 200 && me.json?.account?.email === account.email,
    `got ${me.status} ${me.text.slice(0, 200)}`,
  );
  check(
    "account is camelCase (createdAt present)",
    typeof me.json?.account?.createdAt === "string",
    JSON.stringify(me.json?.account ?? {}).slice(0, 200),
  );

  const catalog = await call("GET", "/api/catalog");
  const models = catalog.json?.models ?? [];
  check(
    "GET /api/catalog returns models + presets",
    catalog.status === 200 &&
      Array.isArray(models) &&
      models.length > 0 &&
      Array.isArray(catalog.json?.presets),
    `got ${catalog.status}`,
  );

  const model = models.find((m) => m.kind === "image") ?? models[0];
  if (!model) {
    notes.push("catalog returned no models, so the generation checks were skipped");
  } else {
    const created = await call("POST", "/api/generations", {
      prompt: "a lighthouse in fog, shot on 35mm",
      kind: model.kind,
      modelId: model.id,
      aspect: "16:9",
      resolution: "1080p",
      batch: 1,
    });
    const items = created.json?.items ?? [];
    check(
      "POST /api/generations returns { items }",
      (created.status === 201 || created.status === 200) && Array.isArray(items) && items.length === 1,
      `got ${created.status} ${created.text.slice(0, 200)}`,
    );
    check(
      "generation is camelCase (composedPrompt, creditsSpent)",
      typeof items[0]?.composedPrompt === "string" && typeof items[0]?.creditsSpent === "number",
      JSON.stringify(items[0] ?? {}).slice(0, 200),
    );

    const list = await call("GET", "/api/generations?limit=10");
    check(
      "GET /api/generations lists them",
      list.status === 200 && Array.isArray(list.json?.items),
      `got ${list.status}`,
    );

    if (items[0]?.id) {
      const one = await call("GET", `/api/generations/${items[0].id}`);
      check(
        "GET /api/generations/:id returns { generation }",
        one.status === 200 && !!one.json?.generation,
        `got ${one.status}`,
      );
    }
  }

  const feed = await call("GET", "/api/feed?limit=10");
  check(
    "GET /api/feed returns { items, nextCursor }",
    feed.status === 200 && Array.isArray(feed.json?.items),
    `got ${feed.status} ${feed.text.slice(0, 200)}`,
  );

  const target = feed.json?.items?.[0];
  if (target?.id) {
    const liked = await call("POST", `/api/feed/${target.id}/like`);
    check(
      "POST /api/feed/:id/like returns { liked, likes }",
      liked.status === 200 && liked.json?.liked === true && typeof liked.json?.likes === "number",
      `got ${liked.status} ${liked.text.slice(0, 200)}`,
    );

    const unliked = await call("DELETE", `/api/feed/${target.id}/like`);
    check(
      "DELETE /api/feed/:id/like unlikes",
      unliked.status === 200 && unliked.json?.liked === false,
      `got ${unliked.status}`,
    );
  } else {
    notes.push("the feed was empty, so the like/unlike checks were skipped");
  }

  const plan = await call("POST", "/api/account/plan", { plan: "studio" });
  check(
    "POST /api/account/plan returns the updated account",
    plan.status === 200 && plan.json?.account?.plan === "studio",
    `got ${plan.status} ${plan.text.slice(0, 200)}`,
  );

  const out = await call("POST", "/api/auth/logout");
  check(
    "POST /api/auth/logout returns { ok: true }",
    out.status === 200 && out.json?.ok === true,
    `got ${out.status}`,
  );
  check("logout clears the session cookie", !jar.has(COOKIE_NAME));

  const after = await call("GET", "/api/auth/me");
  check("the session is dead after logout", after.status === 401, `got ${after.status}`);
}

function tokenLeakCheck() {
  console.log("\n-- token containment --");
  if (capturedToken === null) {
    notes.push("no session token was ever issued, so the leak check had nothing to look for");
    return;
  }
  const leaks = bodies.filter((b) => b.text.includes(capturedToken)).map((b) => b.path);
  check("the session token appears in no response body", leaks.length === 0, leaks.join(", "));
}

const { gatewayUp, backendUp } = await gatewayOnlyChecks();

if (!gatewayUp) {
  console.log(`\nThe gateway is not listening on ${BASE}. Start it with: npm run dev`);
} else if (backendUp) {
  await integrationChecks();
  tokenLeakCheck();
} else {
  console.log("\nSKIP  contract flow -- the Django backend is not reachable from the gateway.");
  console.log("      The gateway checks above did run. Start Django on BACKEND_URL and re-run");
  console.log("      `npm run smoke` to exercise register/login/me/catalog/generations/feed/like/logout.");
}

for (const note of notes) console.log(`NOTE  ${note}`);
console.log(`\n${passed} passed, ${failed} failed${backendUp ? "" : " (integration flow skipped)"}`);

// exitCode, not exit(): Node keeps HTTP keep-alive sockets open for a moment
// and tearing them down from inside exit() aborts the process on Windows.
process.exitCode = failed > 0 ? 1 : 0;
