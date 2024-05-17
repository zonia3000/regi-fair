import { expect, test } from '@playwright/test';
import { adminAuthState, getNonceAndCookiesForApi } from './utils';

test.use({ storageState: adminAuthState });

test('Create event from template', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const templateName = Math.random().toString(36).substring(7);

  let templateId: string;
  await test.step('Create template', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/templates', {
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
        formFields: [
          {
            label: 'text-field-1',
            fieldType: 'text',
            required: true,
            description: 'text-field-description-1'
          },
          {
            label: 'text-field-2',
            fieldType: 'text',
            required: false
          },
          {
            label: 'email-field-1',
            fieldType: 'email',
            required: true,
            description: 'email-field-description-1',
            extra: { confirmationAddress: true }
          },
          {
            label: 'email-field-2',
            fieldType: 'email',
            required: false,
            extra: { confirmationAddress: false }
          },
          {
            label: 'radio-field-1',
            fieldType: 'radio',
            required: true,
            description: 'radio-field-description-1',
            extra: { options: ['op1-1', 'op1-2', 'op1-3'] }
          },
          {
            label: 'radio-field-2',
            fieldType: 'radio',
            required: false,
            extra: { options: ['op2-1', 'op2-2'] }
          },
        ]
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    templateId = body.id;
  });

  await test.step('Open events page', async () => {
    await page.locator('#adminmenu').getByRole('link', { name: 'Events' }).first().click();
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

    await expect(page.getByRole('row')).toHaveCount(7);

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
  });

  await test.step('Delete template', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/templates/${templateId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});
