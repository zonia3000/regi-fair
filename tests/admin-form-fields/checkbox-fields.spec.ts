import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit checkbox fields in event', async ({ eventPage }) => {
  await testCheckboxFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit checkbox fields in template', async ({ templatePage }) => {
  await testCheckboxFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testCheckboxFields(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add checkbox field without description', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Checkbox' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('checkbox-field-1');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('checkbox-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Add checkbox field with description', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Checkbox' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('checkbox-field-2');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('checkbox-field-2-description');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('checkbox-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check and modify checkbox 1', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('checkbox-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('checkbox-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('checkbox-field-1-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('checkbox-field-1-description');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify checkbox 2', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('checkbox-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('checkbox-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('checkbox-field-2-description');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('checkbox-field-2-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('checkbox-field-2-description-renamed');
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
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('checkbox-field-1-renamed');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('checkbox-field-2-renamed');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');

    const dialog = page.getByRole('dialog');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('checkbox-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('checkbox-field-1-description');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('checkbox-field-2-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('checkbox-field-2-description-renamed');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}
