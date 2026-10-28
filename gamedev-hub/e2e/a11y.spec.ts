import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * WCAG 2.1 A/AA via axe. Automated checks catch roughly a third of real
 * accessibility problems — passing here is a floor, not a certificate.
 */

const routes = ["/", "/u/gimli", "/p/r1", "/sign-in"];

for (const route of routes) {
  test(`${route} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact ?? "?"}): ${v.nodes.length} node(s)`,
    );

    expect(summary, `axe violations on ${route}`).toEqual([]);
  });
}

test("the sign-in form is keyboard operable", async ({ page }) => {
  await page.goto("/sign-in");

  await page.keyboard.press("Tab");
  const email = page.getByLabel("E-mail");
  await email.focus();
  await expect(email).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Poslat odkaz" }),
  ).toBeFocused();
});
