import { test as setup, expect } from '@playwright/test';
import { adminAuthStateFile } from './utils';

setup.use({ storageState: adminAuthStateFile });

setup('Edit settings', async ({ page }) => {

  await setup.step('Open settings page and fill the fields', async () => {
    await page.goto(`/wp-admin/admin.php?page=regi-fair-settings`);
    await page.getByRole('textbox', { name: 'Default event admin e-mail address' }).fill('test@example.com');
    await page.getByRole('spinbutton', { name: 'Default autoremove period' }).fill('10');
    await page.getByRole('textbox', { name: 'Default extra content for confirmation e-mail messages' }).fill(
      'Test <b>content</b><br /><div>foo</div>'
    );
    await page.getByRole('textbox', { name: 'E-mail address used to send confirmation messages to users' }).fill(
      'noreply@example.com'
    );
  });

  await setup.step('Save the settings', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Settings updated').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'Default extra content for confirmation e-mail messages' })).toHaveValue(
      'Test <b>content</b><br />foo'
    );
  });

  await setup.step('Reload the page and verify the saved values', async () => {
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Default event admin e-mail address' })).toHaveValue('test@example.com');
    await expect(page.getByRole('spinbutton', { name: 'Default autoremove period' })).toHaveValue('10');
    await expect(page.getByRole('textbox', { name: 'Default extra content for confirmation e-mail messages' })).toHaveValue(
      'Test <b>content</b><br />foo'
    );
    await expect(page.getByRole('textbox', { name: 'E-mail address used to send confirmation messages to users' })).toHaveValue(
      'noreply@example.com'
    );
  });
});
