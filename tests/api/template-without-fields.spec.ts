import { expect, test } from '@playwright/test';
import { adminAuthState, getNonceAndCookiesForApi } from '../utils';

test.use({ storageState: adminAuthState });

test('Template without fields', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const templateName = Math.random().toString(36).substring(7);

  let templateId: number;
  await test.step('Create template without fields', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/templates', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: templateName,
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: []
      }
    });
    expect(response.status()).toEqual(201);
    const body = await response.json();
    templateId = body.id;
  });

  await test.step('Verify that the template appears in the list', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/templates`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body: any[] = await response.json();
    const templates = body.filter(t => t.id === templateId);
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual(templateName);
  });

  await test.step('Verify that the template can be retrieved throught API', async () => {
    const response = await request.get(`/index.php?rest_route=/wpoe/v1/admin/templates/${templateId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const template = await response.json();
    expect(template.id).toEqual(templateId);
    expect(template.name).toEqual(templateName);
  });

  await test.step('Delete the template', async () => {
    const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/templates/${templateId}`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(204);
  });
});
