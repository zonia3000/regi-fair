import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Change event fields after the event has already received some registrations', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  let field1Id: number;

  await test.step('Create test event', async () => {
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
          label: 'field1',
          fieldType: 'checkbox',
          required: false
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    field1Id = body.formFields[0].id;
  });

  let registrationToken: string;
  await test.step('Create registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [field1Id]: true }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken = body.token;
  });

  let field2Id: number;
  await test.step('Admin updates the event adding one field', async () => {
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
          id: field1Id,
          label: 'field1',
          fieldType: 'checkbox',
          required: false
        }, {
          label: 'field2',
          fieldType: 'text',
          required: true
        }]
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    field2Id = body.formFields[1].id;
  });

  await test.step('User retrieves the registration', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`);
    expect(response.status()).toEqual(200);
    const { values } = await response.json();
    expect(Object.keys(values)).toHaveLength(2);
    expect(values[field1Id]).toEqual(true);
    expect(values[field2Id]).toEqual(null);
  });

  let registrationId: number;
  await test.step('Admin list registrations', async () => {
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
    expect(body[0]).toHaveLength(4);
    expect(body[0][2]).toEqual('Yes');
    expect(body[0][3]).toEqual('');
  });

  await test.step('Admin retrieves the registration', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { values } = await response.json();
    expect(Object.keys(values)).toHaveLength(2);
    expect(values[field1Id]).toEqual(true);
    expect(values[field2Id]).toEqual(null);
  });

  await test.step('Admin updates the event removing first field', async () => {
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
          id: field2Id,
          label: 'field2',
          fieldType: 'text',
          required: true
        }]
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.formFields).toHaveLength(1);
  });

  await test.step('User retrieves the registration', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`);
    expect(response.status()).toEqual(200);
    const { values } = await response.json();
    expect(Object.keys(values)).toHaveLength(1);
    expect(values[field2Id]).toEqual(null);
  });

  await test.step('Admin list registrations', async () => {
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
    expect(body[0]).toHaveLength(4);
    expect(body[0][2]).toEqual('');
    expect(body[0][3]).toEqual('Yes');
  });

  await test.step('Admin retrieves the registration', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { values } = await response.json();
    expect(Object.keys(values)).toHaveLength(1);
    expect(values[field2Id]).toEqual(null);
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