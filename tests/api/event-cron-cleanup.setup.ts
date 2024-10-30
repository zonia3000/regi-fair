import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

/**
 * This test is run using only one browser, to avoid issues caused by running multiple copies of it in parallel.
 */
test('Cleanup old event using WP-Cron', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId1: number;
  await test.step('Create event in the past', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2023-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [
          {
            label: 'text-field',
            fieldType: 'text',
            required: true
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId1 = body.id;
  });

  let eventId2: number;
  await test.step('Create event in the future', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2050-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [
          {
            label: 'text-field',
            fieldType: 'text',
            required: true
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId2 = body.id;
  });

  await test.step('Check that first event exists', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
  });

  await test.step('Check that second event exists', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId2}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
  });

  await test.step('Trigger cron jobs', async () => {
    await page.goto('/wp-admin/tools.php?page=crontrol_admin_manage_page');
    await page.getByRole('row', { name: 'wpoe_cleanup_cron_hook' }).hover();
    await page.getByRole('row', { name: 'wpoe_cleanup_cron_hook' }).getByRole('link', { name: 'Run now' }).click();
    await expect(page.getByText('Scheduled the cron event wpoe_cleanup_cron_hook to run now')).toBeVisible();
  });

  await test.step('Check that first event has been deleted', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
  });

  await test.step('Check that second event still exists', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId2}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
  });
});
