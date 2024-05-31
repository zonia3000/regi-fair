import { expect, test } from '@playwright/test';
import { testPostStateFile } from './utils';
import fs from 'fs';

test('Register to event [anonymous]', async ({ page }) => {

  const registerBtn = page.getByRole('button', { name: 'Register to the event' });

  await test.step('Open test event page', async () => {
    const { id } = JSON.parse(fs.readFileSync(testPostStateFile).toString());
    await page.goto(`/?p=${id}`);
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
  });

  await test.step('Validate invalid email', async () => {
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
    await registerBtn.click();
    await page.getByText('Your registration has been submitted').first().waitFor();
    await expect(page.getByRole('textbox', { name: 'text-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'text-field-2' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-1' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'email-field-2' })).toHaveValue('');
    await expect(page.getByLabel('op1-3')).not.toBeChecked();
  });
});
