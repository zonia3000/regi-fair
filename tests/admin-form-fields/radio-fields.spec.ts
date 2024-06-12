import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit radio fields in event', async ({ eventPage }) => {
  await testRadioFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit radio fields in template', async ({ templatePage }) => {
  await testRadioFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testRadioFields(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add required radio field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Radio' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('radio-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('radio-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op1-1');
    await dialog.getByRole('textbox', { name: 'Option 2' }).fill('op1-2');
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('textbox', { name: 'Option 3' }).fill('op1-3');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional radio field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Radio' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('radio-field-2');
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op2-1');
    await dialog.getByRole('textbox', { name: 'Option 2' }).fill('op2-2');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check and modify required radio field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('radio-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op1-3');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('radio-field-1-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('radio-field-description-1-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).uncheck();
    await dialog.getByLabel('Remove option').last().click();
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveCount(0);
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op1-1-renamed');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify optional radio field', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('radio-field-2-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('textbox', { name: 'Option 3' }).fill('op2-3');
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
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('radio-field-1-renamed');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('radio-field-2-renamed');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    const dialog = page.getByRole('dialog');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('radio-field-description-1-renamed');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: /Option \d+/ })).toHaveCount(2);
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-2-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: /Option \d+/ })).toHaveCount(3);
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op2-3');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}