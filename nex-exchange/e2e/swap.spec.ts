import { test, expect } from "@playwright/test";

test.describe("Swap Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display swap interface", async ({ page }) => {
    await expect(page.getByText("NEX Exchange")).toBeVisible();
    await expect(page.getByText("From")).toBeVisible();
    await expect(page.getByText("To")).toBeVisible();
  });

  test("should show Sharia compliance badge", async ({ page }) => {
    await expect(page.getByText("Sharia Compliant")).toBeVisible();
  });

  test("should toggle halal filter", async ({ page }) => {
    const halalFilter = page.getByLabel("Show Only Halal Assets");
    await expect(halalFilter).toBeVisible();
    
    // Toggle filter
    await halalFilter.click();
    await expect(halalFilter).toBeChecked();
  });

  test("should show connect wallet button when not connected", async ({ page }) => {
    await expect(page.getByText("Connect Wallet")).toBeVisible();
  });

  test("should allow token selection", async ({ page }) => {
    // Click token selector
    const tokenSelector = page.getByText("Select token").first();
    await tokenSelector.click();
    
    // Should show token list
    await expect(page.getByText("NOR")).toBeVisible();
    await expect(page.getByText("DRHT")).toBeVisible();
  });

  test("should display price info when quote is available", async ({ page }) => {
    // This would require mocking the API or having a test environment
    // For now, just verify the UI structure
    await expect(page.getByText("Price Impact")).toBeVisible();
  });
});

test.describe("Sharia Compliance", () => {
  test("should navigate to Sharia page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Sharia").click();
    await expect(page).toHaveURL("/sharia");
    await expect(page.getByText("Sharia-Compliant DeFi")).toBeVisible();
  });

  test("should display zakat calculator", async ({ page }) => {
    await page.goto("/sharia");
    await expect(page.getByText("Zakat Calculator")).toBeVisible();
  });

  test("should calculate zakat", async ({ page }) => {
    await page.goto("/sharia");
    
    const input = page.getByLabel("Total Assets (NOK)");
    await input.fill("10000");
    
    await page.getByText("Calculate Zakat").click();
    
    // Should show zakat amount (2.5% of 10000 = 250)
    await expect(page.getByText(/250/)).toBeVisible();
  });
});

test.describe("Portfolio", () => {
  test("should show connect wallet message when not connected", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByText("Connect Your Wallet")).toBeVisible();
  });
});

test.describe("Advanced Trading", () => {
  test("should display order book", async ({ page }) => {
    await page.goto("/trade");
    await page.getByText("Order Book").click();
    await expect(page.getByText("Bids (Buy Orders)")).toBeVisible();
    await expect(page.getByText("Asks (Sell Orders)")).toBeVisible();
  });

  test("should display limit orders tab", async ({ page }) => {
    await page.goto("/trade");
    await page.getByText("Limit Orders").click();
    await expect(page.getByText("Your Limit Orders")).toBeVisible();
  });

  test("should display stop-loss tab", async ({ page }) => {
    await page.goto("/trade");
    await page.getByText("Stop-Loss").click();
    await expect(page.getByText("Stop-Loss Orders")).toBeVisible();
  });

  test("should display DCA tab", async ({ page }) => {
    await page.goto("/trade");
    await page.getByText("DCA").click();
    await expect(page.getByText("Dollar-Cost Averaging")).toBeVisible();
  });
});

