import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Admin edit registration with max participants', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;

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
        maxParticipants: 2,
        formFields: [{
          label: 'number of people',
          fieldType: 'number',
          required: true,
          extra: {
            useAsNumberOfPeople: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
  });

  await test.step('Create a registration to the event', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [1]
    });
    expect(response.status()).toEqual(201);
  });

  let registrationId: number;
  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body.length).toEqual(1);
    registrationId = body[0][0];
  });

  await test.step('Attempt to update the registration with more participants than the allowed value', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: [3]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(body.message).toEqual('Unable to register the specified number of people');
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
