import { expect, test } from '@playwright/test';
import { adminAuthState, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthState });

test('Event without fields', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  await test.step('Create event without fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2024-04-01',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
  });

  await test.step('Verify that the event appears in the list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body: any[] = await response.json();
    const events = body.filter(t => t.id === eventId);
    expect(events).toHaveLength(1);
    expect(events[0].name).toEqual(eventName);
  });

  await test.step('Verify that the event can be retrieved throught admin API', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const event = await response.json();
    expect(event.id).toEqual(eventId);
    expect(event.name).toEqual(eventName);
  });

  await test.step('Verify that the event can be retrieved throught public API', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const event = await response.json();
    expect(event.id).toEqual(eventId);
    expect(event.name).toEqual(eventName);
  });

  await test.step('Delete the event', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});
