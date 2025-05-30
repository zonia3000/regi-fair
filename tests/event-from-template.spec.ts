import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from './utils';
import { TEST_FIELDS } from './test-fields';

test.use({ storageState: adminAuthStateFile });

test('Create event from template', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const templateName = Math.random().toString(36).substring(7);

  let templateId: string;
  await test.step('Create template', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/templates', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: templateName,
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: TEST_FIELDS,
        adminEmail: 'test2@example.com',
        extraEmailContent: 'foo'
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    templateId = body.id;
  });

  await test.step('Open events page', async () => {
    await page.goto('/wp-admin/admin.php?page=regi-fair-events');
    await expect(page.getByRole('heading', { name: 'Your events' })).toHaveCount(1);
  });

  await test.step('Add event', async () => {
    await page.getByRole('button', { name: 'Add event' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'From template' }).click();
    await dialog.getByRole('combobox').selectOption(templateName);
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Create event' })).toHaveCount(1);
  });

  await test.step('Verify data loaded from template', async () => {
    await expect(page.getByRole('checkbox', { name: 'Autoremove user data after the event' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('test2@example.com');
    await expect(page.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('foo');

    await expect(page.getByRole('row')).toHaveCount(12);

    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('text-field-1');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(0)).toContainText('text-field-2');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(1)).toContainText('text');
    await expect(page.getByRole('row').nth(2).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(0)).toContainText('email-field-1');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(3).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(0)).toContainText('email-field-2');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(1)).toContainText('email');
    await expect(page.getByRole('row').nth(4).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(0)).toContainText('radio-field-1');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(5).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(0)).toContainText('radio-field-2');
    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(1)).toContainText('radio');
    await expect(page.getByRole('row').nth(6).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(7).getByRole('cell').nth(0)).toContainText('checkbox-field-1');
    await expect(page.getByRole('row').nth(7).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(7).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(8).getByRole('cell').nth(0)).toContainText('checkbox-field-2');
    await expect(page.getByRole('row').nth(8).getByRole('cell').nth(1)).toContainText('checkbox');
    await expect(page.getByRole('row').nth(8).getByRole('cell').nth(2)).toContainText('No');

    await expect(page.getByRole('row').nth(9).getByRole('cell').nth(0)).toContainText('dropdown-field-1');
    await expect(page.getByRole('row').nth(9).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(9).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(10).getByRole('cell').nth(0)).toContainText('dropdown-field-2');
    await expect(page.getByRole('row').nth(10).getByRole('cell').nth(1)).toContainText('dropdown');
    await expect(page.getByRole('row').nth(10).getByRole('cell').nth(2)).toContainText('Yes');

    await expect(page.getByRole('row').nth(11).getByRole('cell').nth(0)).toContainText('privacy');
    await expect(page.getByRole('row').nth(11).getByRole('cell').nth(1)).toContainText('privacy');
    await expect(page.getByRole('row').nth(11).getByRole('cell').nth(2)).toContainText('Yes');

    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('text-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(2).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('text-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(3).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('email-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).toBeChecked();
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(4).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('email-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail' })).not.toBeChecked();
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(5).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('radio-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op1-3');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(3);
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(6).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('radio-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(0);
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(7).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('checkbox-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(9).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-1');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('dropdown-field-description-1');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Multiple' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op1-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op1-2');
    await expect(dialog.getByRole('textbox', { name: 'Option 3' })).toHaveValue('op1-3');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(3);
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(10).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Label' })).toHaveValue('dropdown-field-2');
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue('');
    await expect(dialog.getByRole('checkbox', { name: 'Required' })).toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: 'Multiple' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Option 1' })).toHaveValue('op2-1');
    await expect(dialog.getByRole('textbox', { name: 'Option 2' })).toHaveValue('op2-2');
    await expect(dialog.getByLabel('Remove option')).toHaveCount(2);
    await dialog.getByLabel('Close').click();

    await page.getByRole('row').nth(11).getByRole('button', { name: 'Edit' }).click();
    await expect(dialog).toContainText('privacy');
    await dialog.getByLabel('Close').click();
  });

  await test.step('Delete template', async () => {
    const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/templates/${templateId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});
