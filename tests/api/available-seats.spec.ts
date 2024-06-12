import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Available seats on event with number of people field', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;

  await test.step('Create event with number of people field', async () => {
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
        maxParticipants: 10,
        formFields: [{
          label: 'number-of-people',
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

  await test.step('Check available seats', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.availableSeats).toEqual(10);
  });

  await test.step('Reject float number of people', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [1.5]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.data.fieldsErrors[0]).toEqual('Number must be an integer');
  });

  await test.step('Reject number of people lower than 1', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [0]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.data.fieldsErrors[0]).toEqual('You have to register at least one person');
  });

  let registrationToken: string;

  await test.step('Register 2 people', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [2]
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken = body.token;
    expect(body.remaining).toEqual(8);
  });

  await test.step('Add max to number of people field', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        maxParticipants: 10,
        formFields: [{
          label: 'number-of-people',
          fieldType: 'number',
          required: true,
          extra: {
            useAsNumberOfPeople: true,
            max: 3
          }
        }]
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Attempt to register a number of people greater than the limit', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [4]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.data.fieldsErrors[0]).toEqual('It is not possible to add more than 3 people in the same registration');
  });

  await test.step('Remove max to number of people field', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        maxParticipants: 10,
        formFields: [{
          label: 'number-of-people',
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

  await test.step('Register other 4 people', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [4]
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(4);
  });

  await test.step('Attempt to register more than available seats', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: [5]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.data.fieldsErrors[0]).toEqual('The number is greater than the available number of seats');
  });

  await test.step('Update the first registration attempting to register more than available seats', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: [7]
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.data.fieldsErrors[0]).toEqual('The number is greater than the available number of seats');
  });

  await test.step('Update the first registration adding one person', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: [3]
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(3);
  });

  await test.step('Update the first registration removing one person', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: [2]
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(4);
  });

  await test.step('Delete the first registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(6);
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

test('Available seats on event without number of people field', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;

  await test.step('Create event with max participants and without number of people field', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/admin/events`, {
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
          label: 'name',
          fieldType: 'text',
          required: true
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
  });

  let registrationToken: string;

  await test.step('Register one person', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['Mario']
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken = body.token;
    expect(body.remaining).toEqual(1);
  });

  await test.step('Register another person', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['Jenny']
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('The third registration is rejected', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['Paul']
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('no_more_seats');
    expect(body.message).toEqual('No more seats available');
  });

  await test.step('It is still possible to modify the first registration', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: ['Maria']
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(0);
  });

  await test.step('Delete the first registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`);
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.remaining).toEqual(1);
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