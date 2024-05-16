import { Page, expect, test } from '@playwright/test';

export async function testFieldsCRUD(page: Page, itemName: string) {

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

  await test.step('Add required email field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-1');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('email-field-description-1');
    await dialog.getByRole('checkbox', { name: 'Required' }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Add optional email field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'E-mail' }).click();
    await dialog.getByRole('textbox', { name: 'Label' }).fill('email-field-2');
    await dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' }).uncheck();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(0)).toContainText('email-field-2');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(2)).toContainText('No');
  });

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
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(2)).toContainText('Yes');
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
    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(2)).toContainText('No');
  });

  await test.step('Save', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
  });

  await test.step('Open for edit', async () => {
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(itemName);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${itemName}-renamed`);
    await expect(page.getByRole('row')).toHaveCount(7);
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

  await test.step('Check and modify required email field', async () => {
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(3).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('email-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Description' }).fill('email-field-description-1-renamed');
    await dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' }).uncheck();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check and delete optional email field', async () => {
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(0)).toContainText('email-field-2');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(4).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).not.toBeChecked();
    await dialog.getByLabel('Close').click();
    await page.getByRole('row').nth(4).getByRole('button', { name: 'Delete' }).click();
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(6);
  });

  await test.step('Check and modify required radio field', async () => {
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(4).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('radio-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op1-3');
    await dialog.getByLabel('Remove option').last().click();
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveCount(0);
    await dialog.getByRole('textbox', { name: 'Option 1' }).fill('op1-1-renamed');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
  });

  await test.step('Check optional radio field and modify its position', async () => {
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(2)).toContainText('No');
    await page.getByRole('row').nth(5).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
    await page.getByRole('row').nth(5).getByRole('button', { name: 'Move field up' }).click();
    await expect(page.getByRole('row').nth(4)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(5)).toContainText('radio-field-1');
    await page.getByRole('button', { name: 'Save' }).click();
  });

  await test.step('Open the item again and check the modified fields', async () => {
    await page.getByRole('link', { name: `${itemName}-renamed` }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(`${itemName}-renamed`);
    await expect(page.getByRole('row')).toHaveCount(6);

    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(2)).toContainText('Yes');

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

    await page.getByRole('row').nth(3).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('email-field-description-1-renamed');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).not.toBeChecked();
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(4).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(0);
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('row').nth(5).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('radio-field-description-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1-renamed');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(0);
    await dialog.getByLabel('Close').click();
    await expect(dialog).not.toBeVisible();
  });
}
