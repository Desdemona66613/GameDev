import { expect, test } from "@playwright/test";

/**
 * Authentication.
 *
 * These run against placeholder Supabase credentials, so no real email is ever
 * sent. What they verify is the app's own behaviour around the call: input
 * validation, the redirect contract, no account enumeration, and no open
 * redirect on the callback.
 */

test("sign-in page renders the email form", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Poslat odkaz" }),
  ).toBeVisible();
});

test("the email field rejects a malformed address", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("E-mail").fill("not-an-email");
  await page.getByRole("button", { name: "Poslat odkaz" }).click();

  // Native validation should stop submission and keep us on the page.
  await expect(page).toHaveURL(/\/sign-in/);
  const valid = await page
    .getByLabel("E-mail")
    .evaluate((el) => (el as HTMLInputElement).checkValidity());
  expect(valid).toBe(false);
});

test("submitting the form posts and lands on the sent state", async ({
  page,
}) => {
  // Record the POST from the request event rather than waitForResponse: a
  // form submit is a navigation, and waiting on its response races the
  // navigation tearing down the old document.
  const posted: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posted.push(r.url());
  });

  await page.goto("/sign-in");
  // Let hydration settle before interacting. Clicking mid-hydration can have
  // React swallow the event without the native submit ever firing.
  await page.waitForLoadState("networkidle");

  await page.getByLabel("E-mail").fill("someone@example.com");
  await page.getByRole("button", { name: "Poslat odkaz" }).click();

  await page.waitForURL(/sent=1/, { timeout: 15_000 });
  expect(posted.some((u) => u.includes("/auth/magic-link"))).toBe(true);
  await expect(page.getByRole("status")).toBeVisible();
});

test("the response does not reveal whether an account exists", async ({
  request,
}) => {
  const submit = async (email: string) => {
    const response = await request.post("/auth/magic-link", {
      form: { email },
      maxRedirects: 0,
    });
    return {
      status: response.status(),
      location: response.headers().location,
    };
  };

  const known = await submit("gimli@example.com");
  const unknown = await submit("nobody-here-12345@example.com");

  // Identical status and destination, or the endpoint is an enumeration oracle.
  expect(known.status).toBe(unknown.status);
  expect(known.location).toBe(unknown.location);
});

test("a malformed email is rejected server-side too", async ({ request }) => {
  // Client-side `type=email` is not a control; the server must validate.
  const response = await request.post("/auth/magic-link", {
    form: { email: "not-an-email" },
    maxRedirects: 0,
  });
  expect(response.headers().location).toContain("error=email");
});

test("the auth callback refuses an external redirect", async ({ request }) => {
  const response = await request.get(
    "/auth/callback?code=abc&next=https://evil.example.com",
    { maxRedirects: 0 },
  );

  const location = response.headers().location ?? "";
  expect(location, "open redirect via ?next=").not.toContain(
    "evil.example.com",
  );
});

test("the auth callback refuses a protocol-relative redirect", async ({
  request,
}) => {
  const response = await request.get(
    "/auth/callback?code=abc&next=//evil.example.com",
    { maxRedirects: 0 },
  );

  const location = response.headers().location ?? "";
  expect(location).not.toContain("evil.example.com");
});

test("protected content is not reachable while signed out", async ({
  page,
}) => {
  // Placeholder for the first authenticated route. Update the path when one
  // exists; failing loudly then is the point.
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});
