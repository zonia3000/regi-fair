import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit fields position in event', async ({ eventPage }) => {
  await testFieldsPosition(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit fields position in template', async ({ templatePage }) => {
  await testFieldsPosition(templateTest, templatePage.page, templatePage.templateName);
});

async function testFieldsPosition(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add text field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Text' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('text-field');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field');
  });

  await test.step('Add email field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field');
  });

  await test.step('Add number field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Number', exact: true }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('number-field');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(4);
  });

  await test.step('Check the fields', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('email');

    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('number-field');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('number');
  });

  await test.step('Move the last field up', async () => {
    await page.getByRole('row').nth(3).getByRole('button', { name: 'Move field up' }).click();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('number-field');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field');
  });

  await test.step('Move the first field down', async () => {
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Move field down' }).click();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('number-field');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(4);
  });

  await test.step('Check the fields', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('number-field');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field');
  });

  await test.step('Delete the first field', async () => {
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check the fields', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field');
  });
}