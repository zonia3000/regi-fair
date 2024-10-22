import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit dropdown fields in event', async ({ eventPage }) => {
  await testDropdownFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit dropdown fields in template', async ({ templatePage }) => {
  await testDropdownFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testDropdownFields(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add required dropdown field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Dropdown' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('dropdown-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('dropdown-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op1-1');
    await dialog.getByRole('textbox', { name: 'Option 2' }).fill('op1-2');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('dropdown-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional dropdown field, multiple', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Dropdown' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('dropdown-field-2');
    await dialog.getByRole('checkbox', { name: 'Multiple' }).check();
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('button', { name: 'Add option' }).click();
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op2-1');
    await dialog.getByRole('textbox', { name: 'Option 2' }).fill('op2-2');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('dropdown-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check and modify required dropdown field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('dropdown-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('dropdown-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('dropdown-field-1-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('dropdown-field-description-1-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).uncheck();
    await dialog.getByRole('checkbox', { name: 'Multiple' }).check();
    await dialog.getByLabel('Remove option').last().click();
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveCount(0);
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op1-1-renamed');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify multiple dropdown field', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('dropdown-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await dialog.getByRole('textbox', { name: 'Label' }).fill('dropdown-field-2-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('checkbox', { name: 'Multiple' }).uncheck();
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
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('dropdown-field-1-renamed');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('dropdown-field-2-renamed');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    const dialog = page.getByRole('dialog');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('dropdown-field-description-1-renamed');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Multiple' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: /Option \d+/ })).toHaveCount(1);
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1-renamed');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-2-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Multiple' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: /Option \d+/ })).toHaveCount(3);
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op2-3');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}