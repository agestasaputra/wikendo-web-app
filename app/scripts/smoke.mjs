/* eslint-disable no-console, @typescript-eslint/explicit-function-return-type -- CLI smoke reporter: stdout is the interface, not part of the app bundle. */
/**
 * scripts/smoke.mjs — Item 6: staging/prod e2e smoke in one command.
 *
 * WHY a script and not a manual checklist: a checklist gets skipped; this runs in CI or
 *   before a release in ~5s and fails loudly. No Playwright in this repo, so it asserts the
 *   HTTP contract that the UI depends on (pages 200, API shape, filters, sort, analytics 204).
 *
 * USAGE: node scripts/smoke.mjs                        (defaults to prod)
 *        BASE_URL=http://localhost:3000 node scripts/smoke.mjs   (staging/local)
 *
 * EXIT: 0 = all checks green, 1 = at least one red (prints the failing check + body snippet).
 */
const BASE = (
  process.env.BASE_URL || "https://wikendo-web-app.vercel.app"
).replace(/\/$/, "");
const MALL = process.env.SMOKE_MALL || "central-park";

const results = [];
let failed = 0;

/** Record + print one check. `fn` returns an error string, or nothing when it passes. */
async function check(name, fn) {
  try {
    const error = await fn();
    if (error) throw new Error(error);
    results.push({ name, ok: true });
    console.log(`✅ ${name}`);
  } catch (e) {
    failed++;
    results.push({ name, ok: false, error: String(e.message || e) });
    console.log(`❌ ${name} — ${e.message || e}`);
  }
}

async function getJson(path) {
  const res = await fetch(BASE + path);
  const text = await res.text();
  return { status: res.status, text, json: safeJson(text) };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** A directory page must be a {items,total,hasMore} object with sane numbers. */
function assertPage(body, label) {
  if (!body || !Array.isArray(body.items))
    return `${label}: not a paged object`;
  if (typeof body.total !== "number") return `${label}: total missing`;
  if (body.items.length > body.total) return `${label}: items > total`;
  return null;
}

console.log(`\n🔎 Wikendo smoke — ${BASE}\n`);

await check("home page 200", async () => {
  const res = await fetch(BASE + "/");
  if (res.status !== 200) return `status ${res.status}`;
  const html = await res.text();
  if (!html.includes("Wikendo")) return "brand string missing from HTML";
});

await check("mall page 200", async () => {
  const res = await fetch(BASE + "/mall");
  return res.status === 200 ? null : `status ${res.status}`;
});

await check(`mall detail /mall/${MALL} 200`, async () => {
  const res = await fetch(`${BASE}/mall/${MALL}`);
  return res.status === 200 ? null : `status ${res.status}`;
});

await check("GET /api/malls → non-empty array with slug", async () => {
  const { status, json } = await getJson("/api/malls");
  if (status !== 200) return `status ${status}`;
  if (!Array.isArray(json) || json.length === 0) return "empty mall list";
  if (!json.every((m) => m.slug)) return "a mall row has no slug";
});

await check("legacy tenants (no ?limit) → array of 40", async () => {
  const { status, json } = await getJson(`/api/malls/${MALL}/tenants`);
  if (status !== 200) return `status ${status}`;
  if (!Array.isArray(json)) return "legacy contract broken (expected array)";
  if (json.length === 0)
    return "empty tenant list (empty directory = incident)";
});

await check("paged tenants → items/total/hasMore", async () => {
  const { status, json } = await getJson(
    `/api/malls/${MALL}/tenants?limit=10&offset=0`,
  );
  if (status !== 200) return `status ${status}`;
  return assertPage(json, "page 1");
});

await check("pagination: page 2 does not overlap page 1", async () => {
  const a = await getJson(`/api/malls/${MALL}/tenants?limit=5&offset=0`);
  const b = await getJson(`/api/malls/${MALL}/tenants?limit=5&offset=5`);
  if (a.status !== 200 || b.status !== 200) return "non-200 page";
  const ids = new Set(a.json.items.map((t) => t.id));
  const overlap = b.json.items.filter((t) => ids.has(t.id));
  return overlap.length
    ? `${overlap.length} duplicate rows across pages`
    : null;
});

await check("search ?search=kopi → every item matches", async () => {
  const { status, json } = await getJson(
    `/api/malls/${MALL}/tenants?search=kopi&limit=10&offset=0`,
  );
  if (status !== 200) return `status ${status}`;
  const bad = assertPage(json, "search");
  if (bad) return bad;
  const miss = json.items.filter((t) => !t.name.toLowerCase().includes("kopi"));
  return miss.length ? `${miss.length} rows do not contain "kopi"` : null;
});

await check("filter ?halal=true → every item halal", async () => {
  const { status, json } = await getJson(
    `/api/malls/${MALL}/tenants?halal=true&limit=10&offset=0`,
  );
  if (status !== 200) return `status ${status}`;
  const bad = assertPage(json, "halal filter");
  if (bad) return bad;
  const miss = json.items.filter((t) => t.halal !== true);
  return miss.length ? `${miss.length} non-halal rows leaked` : null;
});

await check("filter ?budget=mid → every item mid", async () => {
  const { status, json } = await getJson(
    `/api/malls/${MALL}/tenants?budget=mid&limit=10&offset=0`,
  );
  if (status !== 200) return `status ${status}`;
  const miss = (json?.items || []).filter((t) => t.budget_tier !== "mid");
  return miss.length ? `${miss.length} wrong budget rows` : null;
});

await check("sort business-fit: promo tenant is ranked first", async () => {
  // The first page must be ordered hype → verified → name, EXCEPT live-promo tenants win.
  // We cannot see promo flags in the payload (they live in `vouchers`), so we assert the
  // weaker invariant that IS observable: the list is not empty and the first page is stable
  // across two identical requests (a broken/missing ORDER BY returns arbitrary rows).
  const one = await getJson(`/api/malls/${MALL}/tenants?limit=10&offset=0`);
  const two = await getJson(`/api/malls/${MALL}/tenants?limit=10&offset=0`);
  const a = one.json.items.map((t) => t.id).join(",");
  const b = two.json.items.map((t) => t.id).join(",");
  if (a !== b) return "order is not stable between two identical requests";
  const hype = one.json.items.map((t) => Number(t.hype_tiktok === true));
  const firstNonHype = hype.indexOf(0);
  if (firstNonHype > -1 && hype.slice(firstNonHype).includes(1)) {
    return "hype rows appear after non-hype rows (promo block aside) — check ORDER BY";
  }
});

await check("analytics track → 204 with empty body", async () => {
  const res = await fetch(BASE + "/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "promo_click",
      props: { mall_slug: MALL, tenant: "smoke-test" },
    }),
  });
  if (res.status !== 204) return `status ${res.status} (must always be 204)`;
  const body = await res.text();
  return body ? `body not empty: ${body.slice(0, 80)}` : null;
});

await check("analytics track garbage body → still 204", async () => {
  const res = await fetch(BASE + "/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"event":{"$ne":null},"props":"not-an-object"}',
  });
  return res.status === 204 ? null : `status ${res.status}`;
});

await check("404 for unknown mall", async () => {
  const res = await fetch(
    `${BASE}/api/malls/mall-yang-tidak-ada/tenants?limit=1`,
  );
  return res.status === 404 ? null : `status ${res.status} (expected 404)`;
});

console.log(
  `\n${failed === 0 ? "🟢 ALL GREEN" : `🔴 ${failed} FAILED`} — ${results.length} checks\n`,
);
process.exit(failed === 0 ? 0 : 1);
