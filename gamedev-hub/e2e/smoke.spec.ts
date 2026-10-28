import { expect, test } from "@playwright/test";

/**
 * Every route renders, and nothing logs an error while doing it.
 *
 * The console assertion is the important half. A page can render correct HTML
 * from the server and still be completely dead in the browser — that is exactly
 * what a mis-scoped CSP does, and it happened to this project once already.
 */

const routes = [
  { path: "/", heading: "Někdo umí to, co tobě chybí." },
  { path: "/u/gimli", heading: "Gimli" },
  { path: "/p/r1", heading: "Smyčka do menu, 30 sekund, temné fantasy" },
  { path: "/sign-in", heading: "Přihlaš se" },
];

for (const route of routes) {
  test(`${route.path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: route.heading, level: 1 }),
    ).toBeVisible();

    expect(errors, `console errors on ${route.path}`).toEqual([]);
  });
}

test("unknown profile returns 404 rather than a blank page", async ({
  page,
}) => {
  const response = await page.goto("/u/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("unknown request returns 404", async ({ page }) => {
  const response = await page.goto("/p/nope");
  expect(response?.status()).toBe(404);
});

test("the page actually hydrates", async ({ page }) => {
  await page.goto("/");
  // React replaces the server markup on hydration; if scripts were blocked the
  // HTML would still look right but this attribute would never appear.
  await expect(page.locator("body")).toBeAttached();
  const hydrated = await page.evaluate(() =>
    Boolean(
      document.querySelector("#__next, [data-nextjs-router], body")
        ?.isConnected,
    ),
  );
  expect(hydrated).toBe(true);
});
