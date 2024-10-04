import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from './utils';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

test.use({ storageState: adminAuthStateFile });

test('Admin list and download registrations', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  let fieldId: number;

  await test.step('Create event', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2030-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [{
          label: 'name',
          fieldType: 'text',
          required: true
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  await test.step('Create some registrations to the event', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'mario' }
    });
    expect(response.status()).toEqual(201);
    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'paola' }
    });
    expect(response.status()).toEqual(201);
    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'giovanna' }
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('List registrations', async () => {
    await page.goto('/wp-admin');
    await page.locator('#adminmenu').getByRole('link', { name: 'Events' }).first().click();
    await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible();
    await page.getByRole('row', { name: eventName }).getByRole('link').nth(1).click();
    await expect(page.getByText(`Registrations for the event "${eventName}"`)).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(4);
    await expect(page.getByRole('row', { name: 'giovanna' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'paola' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'mario' })).toBeVisible();
  });

  await test.step('Download CSV', async () => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    const download = await downloadPromise;
    const downloadedFile = path.join(os.tmpdir(), download.suggestedFilename())
    await download.saveAs(downloadedFile);
    const fileContent = (await fs.readFile(downloadedFile)).toString();
    const lines = fileContent.split('\n');
    expect(lines[1].split(',')[2]).toEqual(`"giovanna"`);
    expect(lines[2].split(',')[2]).toEqual(`"paola"`);
    expect(lines[3].split(',')[2]).toEqual(`"mario"`);
  });
});
