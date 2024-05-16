import { expect, BrowserContext, Page } from '@playwright/test';

export const adminAuthState = 'tests/.auth/admin.json';

export async function getNonceAndCookiesForApi(page: Page, context: BrowserContext) {
  await page.goto('/wp-admin');
  await page.locator('#adminmenu').getByRole('link', { name: 'Events' }).first().click();
  await page.getByText('Your events').waitFor();
  const nonce = await page.evaluate(async () => {
    return (window as any).wpoe_request.nonce;
  });
  expect(nonce).toBeDefined();
  const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  return { nonce, cookies };
}
