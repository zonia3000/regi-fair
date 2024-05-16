import { expect, test } from '@playwright/test';
import { adminAuthState, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthState });

test('Template Admin API', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  await test.step('Create template - authentication is required', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/templates', {
      data: {
        name: 'test',
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

  await test.step('Update template - authentication is required', async () => {
    const response = await request.put('/index.php?rest_route=/wpoe/v1/admin/templates/1', {
      data: {
        id: 1,
        name: 'test',
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

  await test.step('Delete template - authentication is required', async () => {
    const response = await request.delete('/index.php?rest_route=/wpoe/v1/admin/templates/1');
    expect(response.status()).toEqual(401);
    const body = await response.json();
    expect(body.code).toEqual('rest_forbidden');
  });

  await test.step('Create template - validate missing fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/templates', {
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

  await test.step('Create template - validate missing fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/templates', {
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

  await test.step('Get not existing template returns 404', async () => {
    const response = await request.get('/index.php?rest_route=/wpoe/v1/admin/templates/99999999', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
    const body = await response.json();
    expect(body.code).toEqual('template_not_found');
  });

  await test.step('Update template - validate id not numeric', async () => {
    const response = await request.put('/index.php?rest_route=/wpoe/v1/admin/templates/foo', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {}
    });
    expect(response.status()).toEqual(404);
  });

  await test.step('Update template - validate missing fields', async () => {
    const response = await request.put('/index.php?rest_route=/wpoe/v1/admin/templates/1', {
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

  await test.step('Update template - valid payload with not existing template returns 404', async () => {
    const response = await request.put('/index.php?rest_route=/wpoe/v1/admin/templates/99999999', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        id: 99999999,
        name: 'test',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [
          { fieldType: 'text', label: 'Name', required: true }
        ]
      }
    });
    expect(response.status()).toEqual(404);
    const body = await response.json();
    expect(body.code).toEqual('template_not_found');
  });
});
