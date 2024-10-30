import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from './utils';

test.use({ storageState: adminAuthStateFile });

test('Attempt to register to ended event', async ({ page, request, context }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);
  const postName = Math.random().toString(36).substring(7);

  let eventId: number;
  let fieldId: number;
  await test.step('Create event in the future', async () => {
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
            label: 'text-field',
            fieldType: 'text',
            required: true
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    fieldId = body.formFields[0].id;
  });

  let registrationToken: string;
  await test.step('Verify that it is possible to register to future event', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'foo' }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken = body.token;
  });

  await test.step('Update event date moving it to the past', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2020-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [
          {
            id: fieldId,
            label: 'text-field',
            fieldType: 'text',
            required: true
          }
        ]
      }
    });
    expect(response.status()).toEqual(200);
  });

  await test.step('Verify that it is not possible to register to past event', async () => {
    const response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: { [fieldId]: 'foo' }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('event_ended');
    expect(body.message).toEqual('You cannot register because the event is already ended');
  });

  await test.step('Verify that it is not possible to update past event', async () => {
    const response = await request.put(`/index.php?rest_route=/wpoe/v1/events/${eventId}/${registrationToken}`, {
      data: { [fieldId]: 'foo' }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('event_ended');
    expect(body.message).toEqual('You cannot register because the event is already ended');
  });

  let postId: number;
  await test.step('Create test post', async () => {
    const response = await request.post('/index.php?rest_route=/wp/v2/posts', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        title: postName,
        status: 'publish',
        content: `<!-- wp:wp-open-events/form {"eventId":"${eventId}","className":"wp-block-wp-open-events-form"} /-->`
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    postId = body.id
  });

  await test.step('Open test event page', async () => {
    await page.goto(`/?p=${postId}`);
    await expect(page.getByText('Event is ended').first()).toBeVisible();
  });

  await test.step('Delete test post', async () => {
    const response = await request.delete(`/index.php?rest_route=/wp/v2/posts/${postId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
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