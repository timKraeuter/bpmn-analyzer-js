import { test, expect } from "@playwright/test";

/**
 * Wait for the WASM analysis to complete by checking that no property icons
 * are still in the initial "question" state.
 */
async function waitForAnalysis(page) {
  await expect(page.locator(".properties .icon-question")).toHaveCount(0, {
    timeout: 15_000,
  });
}

/** Assert that a property is fulfilled. */
async function expectFulfilled(page, property) {
  await expect(page.locator(`#${property}`)).toHaveClass(/fulfilled/);
}

/** Assert that a property is violated. */
async function expectViolated(page, property) {
  await expect(page.locator(`#${property}`)).toHaveClass(/violated/);
}

test("exactly Synchronization and Unique end event execution are violated", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAnalysis(page);

  await expectViolated(page, "Safeness");
  await expectViolated(page, "ProperCompletion");
  await expectFulfilled(page, "OptionToComplete");
  await expectFulfilled(page, "NoDeadActivities");
});

test("applying quick fix resolves all property violations", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAnalysis(page);

  // Two quick fix lightbulbs should be visible (one on each gateway).
  await expect(page.locator(".quick-fix-note")).toHaveCount(2);

  // Click the quick fix on the exclusive merge gateway (Gateway_17yykq8)
  // to change it to a parallel gateway, fixing the synchronization issue.
  await page.locator("#Gateway_17yykq8").click();

  // After applying the fix, re-analysis is triggered (debounced 500ms).
  // Wait for Safeness to flip to fulfilled before checking the rest.
  await expect(page.locator("#Safeness")).toHaveClass(/fulfilled/, {
    timeout: 15_000,
  });

  await expectFulfilled(page, "Safeness");
  await expectFulfilled(page, "ProperCompletion");
  await expectFulfilled(page, "OptionToComplete");
  await expectFulfilled(page, "NoDeadActivities");

  // No quick fix lightbulbs should remain.
  await expect(page.locator(".quick-fix-note")).toHaveCount(0);
});
