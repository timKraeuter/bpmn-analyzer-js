import { test, expect } from "@playwright/test";

test("exactly Synchronization and Unique end event execution are violated", async ({
  page,
}) => {
  await page.goto("/");

  // Wait for analysis to complete: all 4 property icons should transition
  // from icon-question to either icon-check (fulfilled) or icon-xmark (violated).
  await expect(page.locator(".properties .icon-question")).toHaveCount(0, {
    timeout: 15_000,
  });

  // Synchronization (Safeness) should be violated.
  await expect(page.locator("#Safeness")).toHaveClass(/violated/);
  // Unique end event execution (ProperCompletion) should be violated.
  await expect(page.locator("#ProperCompletion")).toHaveClass(/violated/);

  // Guaranteed termination (OptionToComplete) should be fulfilled.
  await expect(page.locator("#OptionToComplete")).toHaveClass(/fulfilled/);
  // No dead activities (NoDeadActivities) should be fulfilled.
  await expect(page.locator("#NoDeadActivities")).toHaveClass(/fulfilled/);
});
