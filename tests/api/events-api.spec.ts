import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Events Admin API', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  await test.step('Create event - authentication is required', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      data: {
        name: 'test',
        date: '2024-04-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(401);
    const body = await response.json();
    expect(body.code).toEqual('rest_forbidden');
  });

  await test.step('Update event - authentication is required', async () => {
    const response = await request.put('/index.php?rest_route=/wpoe/v1/admin/events/1', {
      data: {
        id: 1,
        name: 'test',
        date: '2024-04-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(401);
    const body = await response.json();
    expect(body.code).toEqual('rest_forbidden');
  });

  await test.step('Delete event - authentication is required', async () => {
    const response = await request.delete('/index.php?rest_route=/wpoe/v1/admin/events/1');
    expect(response.status()).toEqual(401);
    const body = await response.json();
    expect(body.code).toEqual('rest_forbidden');
  });

  await test.step('Create event - validate missing fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {}
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('rest_missing_callback_param');
  });

  await test.step('Create event - validate empty name', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: '',
        date: '2024-04-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('rest_invalid_param');
    expect(body.data.params.name).toEqual('name must be at least 1 character long.');
  });

  await test.step('Create event - validate invalid date', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: 'test',
        date: '00:00',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('rest_invalid_param');
    expect(body.data.params.date).toEqual('Invalid date.');
  });

  await test.step('Create event - validate missing fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {}
    });
    expect(response.status()).toEqual(400);
    const body = await response.json();
    expect(body.code).toEqual('rest_missing_callback_param');
  });

  await test.step('Get not existing event returns 404', async () => {
    const response = await request.get('/index.php?rest_route=/wpoe/v1/admin/events/99999999', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
    const body = await response.json();
    expect(body.code).toEqual('event_not_found');
  });
});
