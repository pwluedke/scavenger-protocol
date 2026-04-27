import { Page, Locator } from '@playwright/test';

export class CanvasPage {
  readonly canvas: Locator;
  private readonly consoleErrors: string[] = [];

  constructor(private readonly page: Page) {
    this.canvas = page.locator('canvas');
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async waitForCanvas(): Promise<void> {
    await this.canvas.waitFor({ state: 'visible', timeout: 10000 });
  }

  getConsoleErrors(): string[] {
    return [...this.consoleErrors];
  }
}
