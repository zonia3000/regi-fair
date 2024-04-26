import { expect, BrowserContext, Page } from '@playwright/test';

export async function adminLogin(page: Page) {
  await page.goto('/wp-login.php');
  await page.getByRole('textbox', { name: ' Username or Email Address ' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByText('Log In').click();
}

export async function getNonceAndCookiesForApi(page: Page, context: BrowserContext) {
  await adminLogin(page);
  await page.getByRole('link', { name: 'Events' }).first().click();
  await page.getByText('Your events').waitFor();
  const nonce = await page.evaluate(async () => {
    return (window as any).wpoe_request.nonce;
  });
  expect(nonce).toBeDefined();
  const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  return { nonce, cookies };
}
