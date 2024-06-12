import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit email fields in event', async ({ eventPage }) => {
  await testEmailFields(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit email fields in template', async ({ templatePage }) => {
  await testEmailFields(templateTest, templatePage.page, templatePage.templateName);
});

async function testEmailFields(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add required email field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('email-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional email field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-2');
    await dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' }).uncheck();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(3);
  });

  await test.step('Check and modify required email field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('email-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-1-renamed');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('email-field-description-1-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).uncheck();
    await dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' }).uncheck();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and modify optional email field', async () => {
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).not.toBeChecked();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-2-renamed');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' }).check();
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
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('email-field-1-renamed');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('email-field-2-renamed');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    const dialog = page.getByRole('dialog');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('email-field-description-1-renamed');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).not.toBeChecked();
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-2-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).toBeChecked();
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}
