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

test("applying quick fix resolves all property violations", async ({
  page,
}) => {
  await page.goto("/");

  // Wait for initial analysis to complete.
  await expect(page.locator(".properties .icon-question")).toHaveCount(0, {
    timeout: 15_000,
  });

  // Two quick fix lightbulbs should be visible (one on each gateway).
  await expect(page.locator(".quick-fix-note")).toHaveCount(2);

  // Click the quick fix on the exclusive merge gateway (Gateway_17yykq8)
  // to change it to a parallel gateway, fixing the synchronization issue.
  await page.locator("#Gateway_17yykq8").click();

  // After applying the fix, re-analysis is triggered (debounced 500ms).
  // Wait for all properties to become fulfilled.
  await expect(page.locator("#Safeness")).toHaveClass(/fulfilled/, {
    timeout: 15_000,
  });
  await expect(page.locator("#ProperCompletion")).toHaveClass(/fulfilled/);
  await expect(page.locator("#OptionToComplete")).toHaveClass(/fulfilled/);
  await expect(page.locator("#NoDeadActivities")).toHaveClass(/fulfilled/);

  // No quick fix lightbulbs should remain.
  await expect(page.locator(".quick-fix-note")).toHaveCount(0);
});
