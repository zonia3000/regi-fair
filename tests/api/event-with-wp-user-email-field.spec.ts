import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Events having field with useWpUserEmail flag', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  let eventId: number;
  let fieldId: number;
  await test.step('Create test event with useWpUserEmail flag', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: 'test',
        date: '2050-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [{
          label: 'email',
          fieldType: 'email',
          required: true,
          extra: {
            useWpUserEmail: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  await test.step('Admin API returns all the fields', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { formFields } = await response.json();
    expect(formFields).toHaveLength(1);
  });

  await test.step('Public API with registered user hides the field', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { formFields } = await response.json();
    expect(formFields).toHaveLength(0);
  });

  await test.step('Public API with anonymous user shows the field', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const { formFields } = await response.json();
    expect(formFields).toHaveLength(1);
  });

  await test.step('Store admin registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {}
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('Store user registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'foo@example.com' }
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('List the registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body.length).toEqual(2);
    expect(body[0][2]).toEqual('foo@example.com');
    expect(body[1][2]).toEqual('wordpress@example.com');
  });
});
