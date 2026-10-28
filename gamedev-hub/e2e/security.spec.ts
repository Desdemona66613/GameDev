import { expect, test } from "@playwright/test";

/**
 * Security headers are trivial to break silently — a config edit removes one and
 * nothing visibly changes. These assert the posture recorded in CRA-ANNEX-I.md
 * is actually what the server sends.
 */

test("security headers are present on every response", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("the framework version is not advertised", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test("CSP is nonce-based with no unsafe-inline in script-src", async ({
  request,
}) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"];

  expect(csp, "CSP header missing").toBeTruthy();

  const scriptSrc = csp
    ?.split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith("script-src"));

  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
  expect(scriptSrc, "unsafe-inline defeats the whole policy").not.toContain(
    "unsafe-inline",
  );
  expect(scriptSrc).not.toContain("unsafe-eval");

  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("base-uri 'none'");
});

test("the nonce is different on every request", async ({ request }) => {
  const nonceOf = async () => {
    const csp = (await request.get("/")).headers()["content-security-policy"];
    return /'nonce-([A-Za-z0-9+/=]+)'/.exec(csp ?? "")?.[1];
  };

  const [a, b] = [await nonceOf(), await nonceOf()];
  expect(a).toBeTruthy();
  expect(a).not.toBe(b);
});

test("no CSP violations are reported in the browser", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (m.text().includes("Content Security Policy")) violations.push(m.text());
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(violations).toEqual([]);
});
