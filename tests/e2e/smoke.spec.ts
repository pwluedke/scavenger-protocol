import { test, expect } from '@playwright/test';
import { CanvasPage } from './pages/canvas-page';

test.describe('game boot', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('canvas renders on load', async () => {
    await canvasPage.waitForCanvas();
    await expect(canvasPage.canvas).toBeVisible();
  });

  test('no console errors on boot', async () => {
    await canvasPage.waitForCanvas();
    expect(canvasPage.getConsoleErrors()).toHaveLength(0);
  });

  test('page title is Scavenger Protocol', async ({ page }) => {
    await expect(page).toHaveTitle('Scavenger Protocol');
  });
});
