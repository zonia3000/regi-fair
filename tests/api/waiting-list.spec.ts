import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Events with waiting list API', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  let eventId1: number;
  let fieldId1: number;
  await test.step('Create test event with waiting list and number of people', async () => {
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
        waitingList: true,
        editableRegistrations: true,
        maxParticipants: 3,
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
    eventId1 = body.id;
    fieldId1 = body.formFields[0].id;
  });

  let registrationToken1: string;
  await test.step('Create first registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken1 = body.token;
    expect(body.remaining).toEqual(1);
  });

  let registrationToken2: string;
  await test.step('Create second registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken2 = body.token;
    expect(body.remaining).toEqual(0);
  });

  await test.step('Attempt to register without waiting list flag', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1]: '2' }
    });
    expect(response.status()).toEqual(400);
    const { code, message } = await response.json();
    expect(code).toEqual('invalid_form_fields');
    expect(message).toEqual('Unable to register the specified number of people');
  });

  let registrationToken3: string;
  await test.step('Register with waiting list flag', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}&waitingList=true`, {
      data: { [fieldId1]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken3 = body.token;
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(2);
    expect(result.total).toEqual(2);
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(2);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(2);
  });

  await test.step('User delete the second registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId1}/${registrationToken2}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(1);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
    expect(result.totalParticipants).toEqual(2);
    expect(result.totalWaiting).toEqual(2);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
  });

  await test.step('User deletes the first registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId1}/${registrationToken1}`);
    expect(response.status()).toEqual(200);
    const { remaining } = await response.json();
    expect(remaining).toEqual(1);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
    expect(result.totalParticipants).toEqual(2);
    expect(result.totalWaiting).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  let registrationToken4: string;
  await test.step('Add 4th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}&waitingList=true`, {
      data: { [fieldId1]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken4 = body.token;
    expect(body.remaining).toEqual(1);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('User updates the third registration removing one person', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId1}/${registrationToken3}`, {
      data: { [fieldId1]: '1' }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  let registrationId4: string;
  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(2);
    registrationId4 = result.body[0][0];
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('Add 5th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}&waitingList=true`, {
      data: { [fieldId1]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('Admin updates the 4th registration removing one person', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations/${registrationId4}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: { [fieldId1]: '1' }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('Add 6th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}&waitingList=true`, {
      data: { [fieldId1]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('Admin deletes the 4th registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations/${registrationId4}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('Delete test event 1', async () => {
    const deleteEventResponse = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(deleteEventResponse.status()).toEqual(204);
  });
});
