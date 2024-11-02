import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';
import { searchMessage } from '../mailpit-client';

test.use({ storageState: adminAuthStateFile });

test('Admin edit and delete registration with email notification', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  let fieldId: number;

  await test.step('Create event', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
        formFields: [{
          label: 'email',
          fieldType: 'email',
          required: true,
          extra: {
            confirmationAddress: true
          }
        }]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  await test.step('Create a registration to the event', async () => {
    let response = await request.post(`/index.php?rest_route=/regifair/v1/events/${eventId}`, {
      data: { [fieldId]: 'test@example.com' }
    });
    expect(response.status()).toEqual(201);
  });

  let registrationId: number;
  await test.step('List registrations', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
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

  await test.step('Verify registration confirmation email has been sent', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" is confirmed`);
    expect(message.To[0].Address).toEqual('test@example.com');
    expect(message.Text).toContain(`your registration to the event "${eventName}" is confirmed`);
    expect(message.Text).toContain(`test@example.com`);
  });

  await test.step('Attempt to update the registration with an invalid payload', async () => {
    const response = await request.post(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: { [fieldId]: 'foo' }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('invalid_form_fields');
    expect(body.message).toEqual('Some fields are not valid');
  });

  await test.step('Update the registration', async () => {
    const response = await request.post(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: { [fieldId]: 'test2@example.com' }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Verify that the registration has been updated', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { values } = await response.json();
    expect(values[fieldId]).toEqual('test2@example.com');
  });

  await test.step('Verify registration update email has been sent', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" has been updated`);
    expect(message.To[0].Address).toEqual('test2@example.com');
    expect(message.Text).toContain(`your registration to the event "${eventName}" has been updated by an administrator`);
    expect(message.Text).toContain(`test2@example.com`);
  });

  await test.step('Delete the registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Verify that the registration has been deleted', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations&page=1&pageSize=10`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { body } = await response.json();
    expect(body.length).toEqual(0);
  });

  await test.step('Verify registration deleted email has been sent', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" has been deleted`);
    expect(message.To[0].Address).toEqual('test2@example.com');
    expect(message.Text).toContain(`your registration to the event "${eventName}" has been deleted by an administrator`);
  });

  await test.step('Attempt to load not existing registration', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
    const { code } = await response.json();
    expect(code).toEqual('registration_not_found');
  });

  await test.step('Delete the event', async () => {
    const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Attempt to load registration of not existing event', async () => {
    const response = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}/registrations/${registrationId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
    const { code } = await response.json();
    expect(code).toEqual('event_not_found');
  });
});
