import { expect, test } from '@playwright/test';
import { adminAuthStateFile } from './utils';

test.use({ storageState: adminAuthStateFile });

test('Admin event page - main fields CRUD', async ({ page }) => {

  await page.goto('/wp-admin');

  await test.step('Open events page', async () => {
    await page.goto('/wp-admin/admin.php?page=wpoe-events');
    await expect(page.getByText('Your events')).toBeVisible();
  });

  const eventName = Math.random().toString(36).substring(7);

  await test.step('Add event', async () => {
    await page.getByRole('button', { name: 'Add event' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'From scratch' }).click();
    await expect(page.getByRole('heading', { name: 'Create event' })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'Name' }).fill(eventName);
    await page.getByRole('textbox', { name: 'Date' }).fill('2050-01-01');
    await expect(page.getByRole('checkbox', { name: 'Autoremove user data after the event' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('test@example.com');
    await expect(page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('Test <b>content</b><br />foo');
  });

  await test.step('Save', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: eventName })).toHaveCount(1);
  });

  await test.step('Open for edit', async () => {
    await page.getByRole('link', { name: eventName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(eventName);
    await expect(page.getByRole('textbox', { name: 'Date' })).toHaveValue('2050-01-01');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${eventName}-renamed`);
    await page.getByRole('textbox', { name: 'Date' }).fill('2051-01-01');
    await page.getByRole('checkbox', { name: 'Set a maximum number of participants' }).check();
    await page.getByRole('spinbutton', { name: 'Total available seats' }).fill('100');
    await page.getByRole('checkbox', { name: 'Autoremove user data after the event' }).uncheck();
    await page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' }).uncheck();
    await page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' }).uncheck();
    await page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' }).uncheck();
  });

  await test.step('Save', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: `${eventName}-renamed` })).toHaveCount(1);
  });

  await test.step('Verify saved data', async () => {
    await page.getByRole('link', { name: `${eventName}-renamed` }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${eventName}-renamed`);
    await expect(page.getByRole('checkbox', { name: 'Set a maximum number of participants' })).toBeChecked();
    await expect(page.getByRole('spinbutton', { name: 'Total available seats' })).toHaveValue('100');
    await expect(page.getByRole('checkbox', { name: 'Autoremove user data after the event' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' }).check();
    await expect(page.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' }).check();
    await expect(page.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('');
  });

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
