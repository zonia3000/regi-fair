import { expect, test } from '@playwright/test';
import { testFieldsCRUD } from './fields-crud';
import { adminAuthStateFile } from './utils';

test.use({ storageState: adminAuthStateFile });

test('Event fields CRUD', async ({ page }) => {

  await page.goto('/wp-admin');

  await test.step('Open events page', async () => {
    await page.locator('#adminmenu').getByRole('link', { name: 'Events' }).first().click();
    await expect(page.getByRole('heading', { name: 'Your events' })).toHaveCount(1);
  });

  const eventName = Math.random().toString(36).substring(7);

  await test.step('Add event', async () => {
    await page.getByRole('button', { name: 'Add event' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'From scratch' }).click();
    await expect(page.getByRole('heading', { name: 'Create event' })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'Name' }).fill(eventName);
    await page.getByRole('textbox', { name: 'Date' }).fill('2050-01-01');
  });

  await testFieldsCRUD(page, eventName);

  await test.step('Go back and delete the event', async () => {
    const url = page.url();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('row', { name: eventName }).getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('row', { name: eventName })).toHaveCount(0);
    await page.goto(url);
    await expect(page.getByText('Event not found')).toHaveCount(1);
  });
});
