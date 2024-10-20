import { expect, test } from '@playwright/test';
import { testPostStateFile } from './utils';
import fs from 'fs';

test('Register to event [anonymous]', async ({ page }) => {

  let registrationToken = '';
  // Intercept successful registration response
  page.on('response', async (response) => {
    if (response.request().method() === 'POST' && response.status() === 201 && response.url().includes('wpoe')) {
      const responseBody = await response.json();
      registrationToken = responseBody.token;
    }
  });

  const registerBtn = page.getByRole('button', { name: 'Register to the event' });

  let testPageId: number;
  await test.step('Open test event page', async () => {
    const { id } = JSON.parse(fs.readFileSync(testPostStateFile).toString());
    testPageId = id;
    await page.goto(`/?p=${testPageId}`);
    await registerBtn.waitFor();
  });

  const requests: string[] = [];

  await test.step('Subscribe to network events', async () => {
    page.on('request', request => {
      requests.push(request.postData() as string);
    });
  });

  await test.step('Validate required fields', async () => {
    await registerBtn.click();
    await page.getByText('Some fields are not valid').first().waitFor();
    await expect(page.getByText('Required field', { exact: true })).toHaveCount(3);
    await expect(page.getByText('It is necessary to accept the privacy policy')).toBeVisible();
  });

  await test.step('Validate invalid email', async () => {
    await page.getByRole('checkbox', { name: 'privacy' }).click();
    await expect(page.getByRole('checkbox', { name: 'privacy' })).toBeChecked();
    await page.getByRole('textbox', { name: 'email-field-1' }).fill('foo');
    await page.getByRole('textbox', { name: 'email-field-2' }).fill('foo');
    await registerBtn.click();
    await page.getByText('Some fields are not valid').first().waitFor();
    await expect(page.getByText('Required field', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Invalid e-mail address')).toHaveCount(2);
  });

  await test.step('Fill required fields and register', async () => {
    await page.getByRole('textbox', { name: 'text-field-1' }).fill('foo');
    await page.getByRole('textbox', { name: 'email-field-1' }).fill('test@example.com');
    await page.getByLabel('op1-3').check();
    await page.getByRole('textbox', { name: 'email-field-2' }).fill(''); // optional email
    await page.getByRole('checkbox', { name: 'checkbox-field-1' }).click();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-1' })).toBeChecked();
    await registerBtn.click();
    await page.getByText('Your registration has been submitted').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'text-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'text-field-2' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-2' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: 'privacy' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-1' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-2' })).not.toBeChecked();
    await expect(page.getByLabel('op1-3')).not.toBeChecked();
    expect(registrationToken).not.toBe('');
  });

  await test.step('Reopen the registration for editing', async () => {
    await page.goto(`/?p=${testPageId}#registration=${registrationToken}`);
    await page.getByText('Welcome back').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'text-field-1' })).toHaveValue('foo');
    await expect(page.getByRole('textbox', { name: 'text-field-2' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-1' })).toHaveValue('test@example.com');
    await expect(page.getByRole('textbox', { name: 'email-field-2' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: 'privacy' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-1' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-2' })).not.toBeChecked();
    await expect(page.getByLabel('op1-3')).toBeChecked();
  });

  await test.step('Trigger validation on registration editing', async () => {
    await page.getByRole('textbox', { name: 'email-field-1' }).fill('');
    await page.getByRole('textbox', { name: 'email-field-2' }).fill('foo');
    await page.getByRole('button', { name: 'Update the registration' }).click();
    await page.getByText('Some fields are not valid').first().waitFor();
    await expect(page.getByText('Required field', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Invalid e-mail address')).toHaveCount(1);
  });

  await test.step('Edit the registration', async () => {
    await page.getByRole('textbox', { name: 'email-field-1' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'email-field-2' }).fill('');
    await page.getByLabel('op1-2').check();
    await page.getByRole('button', { name: 'Update the registration' }).click();
    await page.getByText('Your registration has been updated').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'text-field-1' })).toHaveValue('foo');
  });

  await test.step('Delete the registration', async () => {
    await page.getByRole('button', { name: 'Delete the registration' }).click();
    await page.getByRole('dialog').getByText('Do you really want to delete the registration to this event?').waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await page.getByText('Your registration has been deleted').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'text-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'text-field-2' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-2' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: 'privacy' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-1' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'checkbox-field-2' })).not.toBeChecked();
    await expect(page.getByLabel('op1-2')).not.toBeChecked();
  });
});
