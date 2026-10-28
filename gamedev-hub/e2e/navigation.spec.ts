import { expect, test } from "@playwright/test";

/**
 * Clicking through the app the way a person does. Catches dead links, which
 * typed routes cannot: `typedRoutes` proves an href matches a route pattern,
 * not that the target resolves for a given id.
 */

test("feed row navigates to the request detail", async ({ page }) => {
  await page.goto("/");

  const firstRow = page.locator("main ul li a").first();
  const title = await firstRow.locator("h3").innerText();
  await firstRow.click();

  await expect(page).toHaveURL(/\/p\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test("logo returns to the feed", async ({ page }) => {
  await page.goto("/u/gimli");
  await page.getByRole("link", { name: "GameDev Hub" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("avatar opens the signed-in user's profile", async ({ page }) => {
  await page.goto("/");
  await page.locator("header a[href^='/u/']").click();
  await expect(page).toHaveURL(/\/u\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("every in-app link resolves", async ({ page, request }) => {
  const seen = new Set<string>();

  for (const start of ["/", "/u/gimli", "/p/r1", "/sign-in"]) {
    await page.goto(start);
    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    for (const href of hrefs) if (href) seen.add(href);
  }

  const broken: string[] = [];
  for (const href of seen) {
    const response = await request.get(href);
    if (response.status() >= 400) {
      broken.push(`${href} → ${String(response.status())}`);
    }
  }

  expect(broken, "links pointing at missing routes").toEqual([]);
});
