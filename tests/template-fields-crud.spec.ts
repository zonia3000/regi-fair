import { expect, test } from '@playwright/test';
import { testFieldsCRUD } from './fields-crud';
import { adminAuthState } from './utils';

test.use({ storageState: adminAuthState });

test('Template fields CRUD', async ({ page }) => {

  await page.goto('/wp-admin');

  await test.step('Open templates page', async () => {
    await page.locator('#adminmenu').getByRole('link', { name: 'Events' }).first().click();
    await page.getByRole('link', { name: 'Templates', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Event templates' })).toHaveCount(1);
  });

  const templateName = Math.random().toString(36).substring(7);

  await test.step('Open "create template" page', async () => {
    await page.getByRole('button', { name: 'Add event template' }).click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(templateName);
  });

  await testFieldsCRUD(page, templateName);

  await test.step('Go back and delete the template', async () => {
    const url = page.url();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('row', { name: templateName }).getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('row', { name: templateName })).toHaveCount(0);
    await page.goto(url);
    await expect(page.getByText('Template not found')).toHaveCount(1);
  });
});
