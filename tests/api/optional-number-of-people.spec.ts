import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Event with optional number of people field', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);
  let eventId: number;
  let fieldId: number;

  await test.step('Create test event', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
            label: 'number-of-people',
            fieldType: 'number',
            required: false,
            extra: {
              useAsNumberOfPeople: true
            }
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  await test.step('Create registration specifying the field', async () => {
    const response = await request.post(`/index.php?rest_route=/regifair/v1/events/${eventId}`, {
      data: { [fieldId]: 3 }
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('Create registration specifying the field', async () => {
    const response = await request.post(`/index.php?rest_route=/regifair/v1/events/${eventId}`, {
      data: { [fieldId]: '' }
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('List the registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0][2]).toEqual('1');
    expect(body[1][2]).toEqual('3');
  });

  await test.step('Delete test event', async () => {
    const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});