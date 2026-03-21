import { test, expect } from '@playwright/test';

async function gotoApp(page) {
  await page.goto('/');
  await expect(page.locator('#kpi .box').first()).toBeVisible();
}

test.describe('ZZZ calculator E2E', () => {
  test('loads and renders KPI plus marginal rows', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#marginalBody tr').first()).toBeVisible();
    await expect(page.locator('#marginalBody tr')).not.toHaveCount(0);
  });

  test('updates KPI when atk changes', async ({ page }) => {
    await gotoApp(page);

    const values = page.locator('#kpi .box .v');
    const before = await values.allTextContents();

    await page.locator('#atk').fill('4000');

    await expect.poll(async () => {
      return await values.allTextContents();
    }).not.toEqual(before);
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

    await page.evaluate(() => {
      const el = document.getElementById('anomAllowCrit');
      el.value = '1';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(page.locator('#anomCritRatePct')).toBeEnabled();
    await expect(page.locator('#anomCritDmgPct')).toBeEnabled();
  });

  test('keeps marginal input value after rerender', async ({ page }) => {
    await gotoApp(page);

    const atkInput = page.locator('#marginalBody input.appliedDelta[data-key="atk"]');
    await expect(atkInput).toBeVisible();

    await atkInput.fill('555');
    await atkInput.press('Enter');

    await expect(page.locator('#marginalBody input.appliedDelta[data-key="atk"]')).toHaveValue('555');
  });
});