import { test, expect } from '@playwright/test';

async function gotoApp(page) {
  await page.goto('file://' + process.cwd().replace(/\\/g, '/') + '/index.html');
}

test.describe('ZZZ calculator E2E', () => {
  test('loads and renders KPI plus marginal rows', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#kpi .box').first()).toBeVisible();
    await expect(page.locator('#marginalBody tr')).toHaveCount(await page.locator('#marginalBody tr').count());
    await expect(page.locator('#marginalBody tr')).not.toHaveCount(0);
  });

  test('updates KPI when atk changes', async ({ page }) => {
    await gotoApp(page);
    const first = await page.locator('#kpi .box .v').first().textContent();
    await page.locator('#atk').fill('4000');
    const next = await page.locator('#kpi .box .v').first().textContent();
    expect(next).not.toBe(first);
  });

  test('switches language to korean', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#languageSelect').selectOption('ko');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(page.locator('h1')).toContainText('젠레스 존 제로');
  });

  test('switches to anomaly mode and enables crit override controls', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#mode').selectOption('anomaly');
    await expect(page.locator('#anomalySection')).toBeVisible();
    await expect(page.locator('#anomCritRatePct')).toBeDisabled();
    await page.locator('#anomAllowCrit').selectOption('1');
    await expect(page.locator('#anomCritRatePct')).toBeEnabled();
  });

  test('keeps marginal input value after rerender', async ({ page }) => {
    await gotoApp(page);
    const atkInput = page.locator('#marginalBody input.appliedDelta[data-key="atk"]');
    await atkInput.fill('555');
    await atkInput.press('Enter');
    await expect(page.locator('#marginalBody input.appliedDelta[data-key="atk"]')).toHaveValue('555');
  });
});
