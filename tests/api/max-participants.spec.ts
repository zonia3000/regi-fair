import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Reach the maximum number of seats', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);
  let eventId: number;

  await test.step('Create event with maximum number of participants', async () => {
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
        maxParticipants: 3,
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
    eventId = body.id;
  });

  await test.step('Add registrations until the limit is reached', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['value1']
    });
    expect(response.status()).toEqual(201);
    let body = await response.json();
    expect(body.remaining).toEqual(2);

    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['value2']
    });
    expect(response.status()).toEqual(201);
    body = await response.json();
    expect(body.remaining).toEqual(1);

    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['value3']
    });
    expect(response.status()).toEqual(201);
    body = await response.json();
    expect(body.remaining).toEqual(0);

    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['value4']
    });
    expect(response.status()).toEqual(400);
    body = await response.json();
    expect(body.code).toEqual('no_more_seats');
  });

  await test.step('Delete test event', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});
