import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Validate options (radio and dropdown fields)', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);
  let eventId: number;
  let fieldId1: number, fieldId2: number, fieldId3: number;

  await test.step('Create event with options fields', async () => {
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
        formFields: [
          {
            label: 'radio',
            fieldType: 'radio',
            required: true,
            extra: { options: ['op1-1', 'op1-2'] }
          },
          {
            label: 'dropdown-single',
            fieldType: 'dropdown',
            required: true,
            extra: { options: ['op1-1', 'op1-2'], multiple: false }
          },
          {
            label: 'dropdown-multiple',
            fieldType: 'dropdown',
            required: false,
            extra: { options: ['op1-1', 'op1-2', 'op1-3'], multiple: true }
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId1 = body.formFields[0].id;
    fieldId2 = body.formFields[1].id;
    fieldId3 = body.formFields[2].id;
  });

  await test.step('Attempt to register with invalid fields', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId1]: 'foo', [fieldId2]: 'bar', [fieldId3]: ['baz', 'bax'] }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(Object.keys(body.data.fieldsErrors)).toHaveLength(3);
    expect(body.data.fieldsErrors[fieldId1]).toEqual('Field value not allowed');
    expect(body.data.fieldsErrors[fieldId2]).toEqual('Field value not allowed');
    expect(body.data.fieldsErrors[fieldId3]).toEqual('Field value not allowed');
  });

  await test.step('Register with valid fields', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId1]: 'op1-1', [fieldId2]: 'op1-2', [fieldId3]: ['op1-1', 'op1-2'] }
    });
    expect(response.status()).toEqual(201);
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