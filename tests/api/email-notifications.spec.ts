import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';
import { searchMessage, searchMessages } from '../mailpit-client';

test.use({ storageState: adminAuthStateFile });

test('Email notification', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  let fieldId: number;
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
        adminEmail: 'admin@example.com',
        formFields: [{
          label: 'email',
          fieldType: 'email',
          required: true,
          extra: {
            confirmationAddress: true
          }
        }],
        extraEmailContent: 'extracontent'
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  let registrationToken: string;
  await test.step('Create a registration', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'test@example.com' }
    });
    expect(response.status()).toEqual(201);
    let body = await response.json();
    registrationToken = body.token;
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

  await test.step('Verify user is notified by email', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" is confirmed`);
    expect(message.To[0].Address).toEqual('test@example.com');
    expect(message.Text).toContain(`your registration to the event "${eventName}" is confirmed`);
    expect(message.Text).toContain(`test@example.com`);
    expect(message.Text).toContain('extracontent');
  });

  await test.step('Verify admin is notified by email', async () => {
    const message = await searchMessage(request, `New registration for the event "${eventName}"`);
    expect(message.To[0].Address).toEqual('admin@example.com');
    expect(message.Text).toContain(`a new registration to the event "${eventName}" has been added`);
    expect(message.Text).toContain(`test@example.com`);
  });

  await test.step('Update the registration', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: { [fieldId]: 'test2@example.com' }
    });
    expect(response.status()).toEqual(200);
  });

  await test.step('Verify user is notified by email', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" has been updated`);
    expect(message.To[0].Address).toEqual('test2@example.com');
    expect(message.Text).toContain(`test2@example.com`);
    expect(message.Text).toContain('extracontent');
  });

  await test.step('Verify admin is notified by email', async () => {
    const message = await searchMessage(request, `Registration updated for the event "${eventName}"`);
    expect(message.To[0].Address).toEqual('admin@example.com');
    expect(message.Text).toContain(`test2@example.com`);
  });

  await test.step('Admin updates the registration', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: { [fieldId]: 'test@example.com' }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Verify user is notified by email', async () => {
    const messages = await searchMessages(request, `Registration to the event "${eventName}" has been updated`);
    expect(messages).toHaveLength(3);
    const message = messages.find(m => m.Text.includes('has been updated by an administrator'))!;
    expect(message.To[0].Address).toEqual('test@example.com');
    expect(message.Text).toContain(`test@example.com`);
    expect(message.Text).toContain('extracontent');
  });

  await test.step('Admin deletes the registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=true`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });

  await test.step('Verify user is notified by email', async () => {
    const message = await searchMessage(request, `Registration to the event "${eventName}" has been deleted`);
    expect(message.To[0].Address).toEqual('test@example.com');
    expect(message.Text).toContain('has been deleted by an administrator');
    expect(message.Text).toContain('extracontent');
  });

  let registrationToken2: string;
  await test.step('Create another registration', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'foo@example.com' }
    });
    expect(response.status()).toEqual(201);
    let body = await response.json();
    registrationToken2 = body.token;
  });

  await test.step('User deletes the registration', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken2}`);
    expect(response.status()).toEqual(200);
  });

  await test.step('Verify user is notified by email', async () => {
    const messages = await searchMessages(request, `Registration to the event "${eventName}" has been deleted`);
    expect(messages).toHaveLength(2);
    const message = messages.find(m => m.To[0].Address === 'foo@example.com')!;
    expect(message.Text).toContain(`your registration to the event "${eventName}" has been deleted`);
    expect(message.Text).toContain('extracontent');
  });

  await test.step('Verify admin is notified by email', async () => {
    const message = await searchMessage(request, `Registration deleted for the event "${eventName}"`);
    expect(message.To[0].Address).toEqual('admin@example.com');
    expect(message.Text).toContain(`a user deleted their registration to the event "${eventName}"`);
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