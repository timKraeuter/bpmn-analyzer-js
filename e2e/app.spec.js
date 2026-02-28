import { test, expect } from "@playwright/test";

test("at least 2 of 4 properties are fulfilled after analysis", async ({
  page,
}) => {
  await page.goto("/");

  // Wait for analysis to complete: all 4 property icons should transition
  // from icon-question to either icon-check (fulfilled) or icon-xmark (violated).
  await expect(page.locator(".properties .icon-question")).toHaveCount(0, {
    timeout: 15_000,
  });

  // Count fulfilled properties (icon has both 'fulfilled' and 'icon-check' classes).
  const fulfilledCount = await page
    .locator(".properties .fulfilled.icon-check")
    .count();

  expect(fulfilledCount).toBeGreaterThanOrEqual(2);
});
