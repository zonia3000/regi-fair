import { expect, test } from '@playwright/test';
import { adminAuthStateFile } from './utils';

test.use({ storageState: adminAuthStateFile });

test('Admin template page - main fields CRUD', async ({ page }) => {

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
    await expect(page.getByRole('checkbox', { name: 'Autoremove user data after the event' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('test@example.com');
    await expect(page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('Test <b>content</b><br />foo');
  });

  await test.step('Save', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: templateName })).toHaveCount(1);
  });

  await test.step('Open for edit', async () => {
    await page.getByRole('link', { name: templateName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(templateName);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${templateName}-renamed`);
    await page.getByRole('checkbox', { name: 'Autoremove user data after the event' }).uncheck();
    await page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' }).uncheck();
    await page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' }).uncheck();
    await page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' }).uncheck();
  });

  await test.step('Save', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: templateName })).toHaveCount(1);
  });

  await test.step('Verify saved data', async () => {
    await page.getByRole('link', { name: templateName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${templateName}-renamed`);
    await expect(page.getByRole('checkbox', { name: 'Autoremove user data after the event' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' }).check();
    await expect(page.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' }).check();
    await expect(page.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('');
  });

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