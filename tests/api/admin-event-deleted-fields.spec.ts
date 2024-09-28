import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthStateFile });

test('Delete published event fields', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;

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
        formFields: [
          {
            label: 'name',
            fieldType: 'text',
            required: true
          },
          {
            label: 'number-of-people',
            fieldType: 'number',
            required: true,
            extra: {
              useAsNumberOfPeople: true
            }
          }
        ]
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
  });

  await test.step('Verify that it is possible to delete unreferenced fields', async () => {
    let response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        formFields: []
      }
    });
    expect(response.status()).toEqual(204);

    response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.formFields).toHaveLength(0);
  });

  await test.step('Set the fields again', async () => {
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
        formFields: [
          {
            label: 'name',
            fieldType: 'text',
            required: true
          },
          {
            label: 'surname',
            fieldType: 'text',
            required: true
          },
          {
            label: 'number-of-people',
            fieldType: 'number',
            required: true,
            extra: {
              useAsNumberOfPeople: true
            }
          }
        ]
      }
    });
    expect(response.status()).toEqual(204);
  });

  let nameFieldId, numberOfPeopleFieldId;
  await test.step('Retrieve fields ids', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { formFields } = await response.json();
    nameFieldId = formFields.filter(f => f.label === 'name')[0].id;
    numberOfPeopleFieldId = formFields.filter(f => f.label === 'number-of-people')[0].id;
  });

  await test.step('Insert some registrations', async () => {
    let response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['mario', 'rossi', 2]
    });
    expect(response.status()).toEqual(201);
    response = await request.post(`/index.php?rest_route=/wpoe/v1/events/${eventId}`, {
      data: ['anna', 'bianchi', 4]
    });
    expect(response.status()).toEqual(201);
  });

  await test.step('Verify that it is possible to delete standard referenced field', async () => {
    let response = await request.put(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
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
        formFields: [
          {
            id: nameFieldId,
            label: 'name',
            fieldType: 'text',
            required: true
          },
          {
            id: numberOfPeopleFieldId,
            label: 'number-of-people',
            fieldType: 'number',
            required: true,
            extra: {
              useAsNumberOfPeople: true
            }
          }
        ]
      }
    });
    expect(response.status()).toEqual(204);

    response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body = await response.json();
    expect(body.formFields).toHaveLength(2);
  });

  await test.step('Verify that the field is marked as deleted in registrations list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/events/${eventId}/registrations&page=1&pageSize=20`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const { head, body } = await response.json();
    expect(head).toHaveLength(3);
    expect(head[0].label).toEqual('name');
    expect(head[0].deleted).toBeFalsy();
    expect(head[1].label).toEqual('number-of-people');
    expect(head[1].deleted).toBeFalsy();
    expect(head[2].label).toEqual('surname');
    expect(head[2].deleted).toBeTruthy();
    expect(body).toHaveLength(2);
    expect(body[0][2]).toEqual('anna');
    expect(body[0][3]).toEqual('4');
    expect(body[0][4]).toEqual('bianchi');
    expect(body[1][2]).toEqual('mario');
    expect(body[1][3]).toEqual('2');
    expect(body[1][4]).toEqual('rossi');
  });

  await test.step('Verify that it is not possible to delete number of people referenced field', async () => {
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
        formFields: [
          {
            id: nameFieldId,
            label: 'name',
            fieldType: 'text',
            required: true
          }
        ]
      }
    });
    expect(response.status()).toEqual(400);
    const { message } = await response.json();
    expect(message).toEqual('It is not possible to remove referenced "number of people" field');
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
