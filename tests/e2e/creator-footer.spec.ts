import { test } from '@playwright/test';
import { expectCreatorFooter } from '../creator/creator-footer-contract';
import { copyFor } from '../../src/creator/creator-copy';

for (const locale of ['de', 'en', 'fr', 'es', 'nl']) {
  test.describe(locale, () => {
    test.use({ locale });
    test('shared footer works at mobile widths', async ({ page }) => {
      await page.goto('/');
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 840 });
        await expectCreatorFooter(page, copyFor(locale).moreApps);
      }
    });
  });
}
