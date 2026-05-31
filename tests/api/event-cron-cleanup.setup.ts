import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

/**
 * This test depends on Cron Jobs plugin, installed via .wp-env.json.
 * This test is run using only one browser, to avoid issues caused by running multiple copies of it in parallel.
 */
test('Cleanup old event using WP-Cron', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId1: number;
  await test.step('Create event in the past with autoremoveSubmissions=false && autoremoveEvent=false', async () => {
    const event = {
      name: `${eventName}-no-remove`,
      date: '2050-01-01T00:00:00.000Z',
      autoremoveSubmissions: false,
      autoremoveEvent: false,
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
    };
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: event
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId1 = body.id;
    await addRegistration(eventId1, body.formFields[0].id);
    await moveEventDateToThePast(eventId1, event);
  });

  let eventId2: number;
  await test.step('Create event in the past with autoremoveSubmissions=true && autoremoveEvent=false', async () => {
    const event = {
      name: `${eventName}-remove-submission`,
      date: '2050-01-01T00:00:00.000Z',
      autoremoveSubmissions: true,
      autoremoveEvent: false,
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
    };
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: event
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId2 = body.id;
    await addRegistration(eventId2, body.formFields[0].id);
    await moveEventDateToThePast(eventId2, event);
  });

  let eventId3: number;
  await test.step('Create event in the past with autoremoveSubmissions=true && autoremoveEvent=true', async () => {
    const event = {
      name: `${eventName}-remove-event`,
      date: '2050-01-01T00:00:00.000Z',
      autoremoveSubmissions: true,
      autoremoveEvent: true,
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
    };
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: event
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId3 = body.id;
    await addRegistration(eventId3, body.formFields[0].id);
    await moveEventDateToThePast(eventId3, event);
  });

  let eventId4: number;
  await test.step('Create event in the future', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: `${eventName}-future`,
        date: '2050-01-01T00:00:00.000Z',
        autoremoveSubmissions: true,
        autoremoveEvent: false,
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
    eventId4 = body.id;
    await addRegistration(eventId4, body.formFields[0].id);
  });

  await test.step('Check that all events exist and have some registrations', async () => {
    for (const id of [eventId1, eventId2, eventId3, eventId4]) {
      const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${id}`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(200);
      const body = await response.json();
      expect(body.hasResponses).toEqual(true);
    }
  });

  await test.step("Check that the /active endpoint doesn't return past events", async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/active`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const ids = (await response.json()).map((e: { id: number }) => e.id);
    expect(ids).not.toContain(eventId1);
    expect(ids).not.toContain(eventId2);
    expect(ids).not.toContain(eventId3);
    expect(ids).toContain(eventId4);
  });

  await test.step('Trigger cron jobs', async () => {
    await page.goto('/wp-admin/tools.php?page=leira-cron-jobs');
    await page.getByRole('row', { name: 'regi_fair_cleanup_cron_hook' }).hover();
    await page.getByRole('row', { name: 'regi_fair_cleanup_cron_hook' }).getByRole('link', { name: 'Run now' }).click();
    await expect(page.getByText('The selected cron jobs are being executed at this moment')).toBeVisible();
  });

  await test.step('Check that first event still exists', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.hasResponses).toEqual(true);
    expect(body.autoremovedAt).toBeNull();
  });

  await test.step('Check that second event still exists, but submissions have been removed', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId2}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.hasResponses).toEqual(false);
    expect(body.autoremovedAt).not.toBeNull();
  });

  await test.step('Check that third event has been deleted', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId3}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
  });

  await test.step('Check that fourth event still exists', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId4}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.hasResponses).toEqual(true);
    expect(body.autoremovedAt).toBeNull();
  });

  await test.step('Delete remaining events', async () => {
    for (const id of [eventId1, eventId2, eventId4]) {
      const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${id}`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(204);
    }
  });

  async function addRegistration(eventId: number, fieldId: number) {
    const response = await request.post(`/index.php?rest_route=/regifair/v1/events/${eventId}`, {
      data: { [fieldId]: 'foo' }
    });
    expect(response.status()).toEqual(201);
  }

  async function moveEventDateToThePast(eventId: number, event: any) {
    const response = await request.put(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        ...event,
        date: '2023-01-01T00:00:00.000Z',
      }
    });
    expect(response.status()).toEqual(200);
  }
});
