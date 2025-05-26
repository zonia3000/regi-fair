import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit field with useWpUserEmail flag in event', async ({ eventPage }) => {
  await testWpUserEmailFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit field with useWpUserEmail flag in template', async ({ templatePage }) => {
  await testWpUserEmailFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testWpUserEmailFields(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add email field with useWpUserEmail', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field');
    await dialog.getByRole('checkbox', { name: 'For registered users, hide this field and automatically pick the e-mail address from Wordpress user data' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('email-field');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName, exact: true })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(2);
  });

  await test.step('Check field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('email-field');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field');
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'For registered users, hide this field and automatically pick the e-mail address from Wordpress user data' })).toBeChecked();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });
}
