import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit number fields in event', async ({ eventPage }) => {
  await testNumberFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit number fields in template', async ({ templatePage }) => {
  await testNumberFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testNumberFields(test: TestType<any, any>, page: Page, itemName: string) {
  await test.step('Add required number field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Number', exact: true }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('number-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('number-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional number field with min and max', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Number', exact: true }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field-2');
    await dialog.getByRole('spinbutton', { name: 'Minimum value' }).fill('3');
    await dialog.getByRole('spinbutton', { name: 'Maximum value' }).fill('10');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('number-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Add "Number of people" field, with max value', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Number of people' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-of-people');
    await dialog.getByRole('spinbutton', { name: 'Maximum value' }).fill('15');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('number-of-people');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(4);
  });

  await test.step('Check and modify required number field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('number-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('number-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field-1-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('number-field-description-1-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).uncheck();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field-1-renamed');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify optional number field', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('number-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('spinbutton', { name: 'Minimum value' })).toHaveValue('3');
    await expect(dialog.getByRole('spinbutton', { name: 'Maximum value' })).toHaveValue('10');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-field-2-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('spinbutton', { name: 'Minimum value' }).fill('');
    await dialog.getByRole('spinbutton', { name: 'Maximum value' }).fill('50');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify "Number of people" field', async () => {
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('number-of-people');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(3).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-of-people');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('spinbutton', { name: 'Maximum value' })).toHaveValue('15');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('number-of-people-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('spinbutton', { name: 'Maximum value' }).fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(4);
  });

  await test.step('Check the modified fields', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('number-field-1-renamed');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('number-field-2-renamed');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('number-of-people-renamed');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('number');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('Yes');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('number-field-description-1-renamed');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('spinbutton', { name: 'Minimum value' })).toHaveValue('');
    await expect(dialog.getByRole('spinbutton', { name: 'Maximum value' })).toHaveValue('');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-field-2-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('spinbutton', { name: 'Minimum value' })).toHaveValue('');
    await expect(dialog.getByRole('spinbutton', { name: 'Maximum value' })).toHaveValue('50');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(3).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('number-of-people-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('spinbutton', { name: 'Maximum value' })).toHaveValue('');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}