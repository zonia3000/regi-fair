import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Events Admin API', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  await test.step('Create event - authentication is required', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
    const response = await request.put('/index.php?rest_route=/regifair/v1/admin/events/1', {
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
    const response = await request.delete('/index.php?rest_route=/regifair/v1/admin/events/1');
    expect(response.status()).toEqual(401);
    const body = await response.json();
    expect(body.code).toEqual('rest_forbidden');
  });

  await test.step('Create event - validate missing fields', async () => {
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
    const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
    const response = await request.get('/index.php?rest_route=/regifair/v1/admin/events/99999999', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(404);
    const body = await response.json();
    expect(body.code).toEqual('event_not_found');
  });

  await test.step('Create event - forbidden tags are stripped', async () => {
    const eventName = Math.random().toString(36).substring(7);
    const createEventResponse = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: eventName,
        date: '2024-04-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: [],
        extraEmailContent: 'Test <b>content</b><br /><div>foo</div>',
      }
    });
    expect(createEventResponse.status()).toEqual(201);
    let body = await createEventResponse.json();
    const eventId = body.id;

    const getEventResponse = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(getEventResponse.status()).toEqual(200);
    body = await getEventResponse.json();
    expect(body.extraEmailContent).toEqual('Test <b>content</b><br />foo');

    const deleteEventResponse = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(deleteEventResponse.status()).toEqual(204);
  });

  await test.step('List event having only deleted fields', async () => {
    const eventName = Math.random().toString(36).substring(7);
    const createEventResponse = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
        formFields: [{ label: 'name', fieldType: 'text', required: true }]
      }
    });
    expect(createEventResponse.status()).toEqual(201);
    let body = await createEventResponse.json();
    const eventId = body.id;

    let getEventResponse = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(getEventResponse.status()).toEqual(200);
    body = await getEventResponse.json();
    expect(body.formFields).toHaveLength(1);
    const fieldId = body.formFields[0].id;

    const registrationResponse = await request.post(`/index.php?rest_route=/regifair/v1/events/${eventId}`, {
      data: { [fieldId]: 'bob' }
    });
    expect(registrationResponse.status()).toEqual(201);

    const updateEventResponse = await request.put(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
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
        formFields: []
      }
    });
    expect(updateEventResponse.status()).toEqual(200);

    getEventResponse = await request.get(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(getEventResponse.status()).toEqual(200);
    body = await getEventResponse.json();
    expect(body.formFields).toHaveLength(0);

    const deleteEventResponse = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(deleteEventResponse.status()).toEqual(204);
  });
});
