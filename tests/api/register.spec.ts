import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Validate registration payload', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventPayload = {
    date: '2050-01-01T00:00:00.000Z',
    autoremove: true,
    autoremovePeriod: 30,
    waitingList: false,
    editableRegistrations: true,
    formFields: [
      {
        label: 'name',
        fieldType: 'text',
        required: true
      },
      {
        label: 'email',
        fieldType: 'email',
        required: true
      }
    ]
  }

  let eventId1: number;
  let fieldId1Event1: number, fieldId2Event1: number;
  await test.step('Create first test event', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: Math.random().toString(36).substring(7),
        ...eventPayload
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId1 = body.id;
    fieldId1Event1 = body.formFields[0].id;
    fieldId2Event1 = body.formFields[1].id;
  });

  let eventId2: number;
  let fieldId1Event2: number, fieldId2Event2: number;
  await test.step('Create second test event', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: Math.random().toString(36).substring(7),
        ...eventPayload
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId2 = body.id;
    fieldId1Event2 = body.formFields[0].id;
    fieldId2Event2 = body.formFields[1].id;
  });

  await test.step('Detect invalid payload structure', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: 'foo'
    });
    expect(response.status()).toEqual(400);
    let body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(body.message).toEqual('The payload must be an array');
  });

  await test.step('Detect invalid number of fields', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1Event1]: 'foo', [fieldId2Event1]: 'bar', [fieldId1Event2]: 'baz' }
    });
    expect(response.status()).toEqual(400);
    let body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(body.message).toEqual('Invalid number of fields');
  });

  await test.step('Detect missing keys', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1Event2]: 'foo', [fieldId2Event2]: 'bar' }
    });
    expect(response.status()).toEqual(400);
    let body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(body.message).toEqual(`Missing field ${fieldId1Event1}`);
  });

  let registrationToken: string;
  await test.step('Create a valid registration to the first event', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId1}`, {
      data: { [fieldId1Event1]: 'foo', [fieldId2Event1]: 'test@example.com' }
    });
    expect(response.status()).toEqual(201);
    let body = await response.json();
    registrationToken = body.token;
  });

  await test.step('Update registration detects event id mismatch', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId2}/${registrationToken}`, {
      data: { [fieldId1Event2]: 'foo2', [fieldId2Event2]: 'test2@example.com' }
    });
    expect(response.status()).toEqual(400);
    let body = await response.json();
    expect(body.code).toEqual('registration_not_found');
    expect(body.message).toEqual('Registration not found');
  });

  await test.step('Delete registration detects event id mismatch', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId2}/${registrationToken}`);
    expect(response.status()).toEqual(400);
    let body = await response.json();
    expect(body.code).toEqual('registration_not_found');
    expect(body.message).toEqual('Registration not found');
  });

  await test.step('Disable registration editing on first event', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId1}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: Math.random().toString(36).substring(7),
        ...eventPayload,
        editableRegistrations: false,
      }
    });
    expect(response.status()).toEqual(200);
  });

  await test.step('Attempt to update a registration that is not editable', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId1}/${registrationToken}`, {
      data: { [fieldId1Event1]: 'foo2', [fieldId2Event1]: 'test2@example.com' }
    });
    expect(response.status()).toEqual(403);
    let body = await response.json();
    expect(body.code).toEqual('registrations_not_editable');
    expect(body.message).toEqual('This event doesn\'t allow to edit the registrations');
  });

  await test.step('Attempt to delete a registration that is not editable', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId1}/${registrationToken}`);
    expect(response.status()).toEqual(403);
    let body = await response.json();
    expect(body.code).toEqual('registrations_not_editable');
    expect(body.message).toEqual('This event doesn\'t allow to edit the registrations');
  });

  await test.step('Delete test events', async () => {
    for (const eventId of [eventId1, eventId2]) {
      const deleteEventResponse = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(deleteEventResponse.status()).toEqual(204);
    }
  });
});
