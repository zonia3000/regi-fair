import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit text fields in event', async ({ eventPage }) => {
  await testTextFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit text fields in template', async ({ templatePage }) => {
  await testTextFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testTextFields(test: TestType<any, any>, page: Page, itemName: string) {
  await test.step('Add required text field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Text' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('text-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('text-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional text field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Text' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('text-field-2');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check and modify required text field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('text-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('text-field-1-renamed');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify optional text field', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check the modified fields', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('text-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}
