import { expect, BrowserContext, Page } from '@playwright/test';

export const adminAuthStateFile = 'tests/.state/admin-session.json';

export async function getNonceAndCookiesForApi(page: Page, context: BrowserContext) {
  await page.goto('/wp-admin/admin.php?page=regi-fair-events');
  await expect(page.getByText('Your events')).toBeVisible();
  const nonce = await page.evaluate(async () => {
    return (window as any).regi_fair_request.nonce;
  });
  expect(nonce).toBeDefined();
  const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  return { nonce, cookies };
}

export const testPostStateFile = 'tests/.state/test-post.json';
