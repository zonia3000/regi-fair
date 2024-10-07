import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

/**
 * Use cases:
 * 1. new seats become available when user deletes their registration, but waiting registration has more people than available seats;
 * 2. new seats become available when user deletes their registration and waiting registration is moved to confirmed;
 * 3. new seats become available when user updates their registration removing people;
 * 4. new seats become available when admin updates a registration removing people;
 * 5. new seats become available when admin deletes a registration;
 * 6. waiting registration is moved to confirmed if user updates it reducing the number of people to fit the available seats;
 * 7. waitingList parameter is ignored if there are enough available seats;
 * 8. admin can't set the number of available seats to be lower than the current confirmed registered users;
 * 9. admin can't unset the waiting list flag if there are people in the waiting list;
 */
test('Events with waiting list API', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  let eventId: number;
  let fieldId: number;
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
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  await test.step('Check waiting list flag in public event data', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.waitingList).toEqual(true);
  });

  let registrationToken1: string;
  await test.step('Create first registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken1 = body.token;
    expect(body.remaining).toEqual(1);
  });

  let registrationToken2: string;
  await test.step('Create second registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=false`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken2 = body.token;
    expect(body.remaining).toEqual(0);
  });

  await test.step('Attempt to register without waiting list flag', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(400);
    const { code, message } = await response.json();
    expect(code).toEqual('invalid_form_fields');
    expect(message).toEqual('Unable to register the specified number of people');
  });

  let registrationToken3: string;
  await test.step('Register with waiting list flag', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken3 = body.token;
    expect(body.remaining).toEqual(0);
  });

  let registrationId1: string;
  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(2);
    registrationId1 = result.body[1][0];
    expect(result.total).toEqual(2);
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(2);
  });

  let registrationId3: string;
  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
    registrationId3 = result.body[0][0];
    expect(result.total).toEqual(1);
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(2);
  });

  await test.step('Get single confirmed registration', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const registration = await response.json();
    expect(registration.values[fieldId]).toEqual('2');
    expect(registration.waitingList).toEqual(false);
  });

  await test.step('Get single registration in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId3}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const registration = await response.json();
    expect(registration.values[fieldId]).toEqual('2');
    expect(registration.waitingList).toEqual(true);
  });

  await test.step('Check available seats in public event data', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.availableSeats).toEqual(0);
  });

  await test.step('User deletes the second registration [case1]', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken2}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(1);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
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
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(1);
  });

  await test.step('User deletes the first registration [case2]', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken1}`);
    expect(response.status()).toEqual(200);
    const { remaining } = await response.json();
    expect(remaining).toEqual(1);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
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
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('Add 4th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(1);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('Check available seats in public event data', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.availableSeats).toEqual(1);
  });

  await test.step('User updates the third registration removing one person [case3]', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken3}`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  let registrationId4: string;
  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
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
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
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
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('Admin updates the 4th registration removing one person [case4]', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId4}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
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
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
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
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId4}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('Admin deletes the third registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId3}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  let registrationToken7: string;
  await test.step('Add 7th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken7 = body.token;
    expect(body.remaining).toEqual(1);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(1);
  });

  await test.step('User updates the 7th registration in waiting list removing one person [case6]', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken7}`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations in waiting list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10&waitingList=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body).toHaveLength(0);
  });

  await test.step('User deletes the 7th registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken7}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(1);
  });

  await test.step('The waitingList parameter is ignored if there are enough available seats [case7]', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '1' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const result = await response.json();
    expect(result.body).toHaveLength(3);
    expect(result.totalParticipants).toEqual(3);
    expect(result.totalWaiting).toEqual(0);
  });

  await test.step('Attempt to update event reducing the number of available seats [case8]', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        maxParticipants: 2,
        formFields: [{
          id: fieldId,
          label: 'number of people',
          fieldType: 'number',
          required: true,
          extra: {
            useAsNumberOfPeople: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('invalid_payload');
    expect(body.message).toEqual("The number of available seats can't be lower than the current confirmed registered people");
  });

  let registrationToken8: string;
  await test.step('Add 8th registration in waiting list', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken8 = body.token;
    expect(body.remaining).toEqual(0);
  });

  await test.step('Attempt to update event removing the waiting list [case9]', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        maxParticipants: 3,
        formFields: [{
          id: fieldId,
          label: 'number of people',
          fieldType: 'number',
          required: true,
          extra: {
            useAsNumberOfPeople: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('invalid_payload');
    expect(body.message).toEqual("It is not possible to remove the waiting list because there are some people in it");
  });

  await test.step('User deletes the 8th registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken8}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('It is now possible to remove the waiting list', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        maxParticipants: 3,
        formFields: [{
          id: fieldId,
          label: 'number of people',
          fieldType: 'number',
          required: true,
          extra: {
            useAsNumberOfPeople: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('It is not possible to register using the waitingList flag if waiting list is disabled', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}&waitingList=true`, {
      data: { [fieldId]: '2' }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('waiting_list_not_enabled');
    expect(body.message).toEqual('Waiting list is not enabled');
  });

  await test.step('Delete test event', async () => {
    const deleteEventResponse = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(deleteEventResponse.status()).toEqual(204);
  });
});
