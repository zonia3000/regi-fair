import { test as setup, expect } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi, testPostStateFile } from './utils';
import { TEST_FIELDS } from './test-fields';
import fs from 'fs';

setup.use({ storageState: adminAuthStateFile });

const TEST_POST_NAME = '__playwright_test_post__';
const TEST_EVENT_NAME = '__playwright_test_event__';

setup('Create test event', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  await setup.step('Delete old test post, if exists', async () => {
    const response = await request.get(`/index.php?rest_route=/wp/v2/posts`, {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body: any[] = await response.json();
    const posts = body.filter(p => p.title.rendered === TEST_POST_NAME);
    if (posts.length > 0) {
      expect(posts.length).toEqual(1);
      const response = await request.delete(`/index.php?rest_route=/wp/v2/posts/${posts[0].id}&force=true`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(200);
    }
  });

  await setup.step('Delete old test event, if exists', async () => {
    const response = await request.get('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      }
    });
    expect(response.status()).toEqual(200);
    const body: any[] = await response.json();
    const events = body.filter(e => e.name === TEST_EVENT_NAME);

    if (events.length > 0) {
      expect(events.length).toEqual(1);
      const response = await request.delete(`/index.php?rest_route=/wpoe/v1/admin/events/${events[0].id}`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(204);
    }
  });

  let eventId: number;

  await setup.step('Create event', async () => {
    const response = await request.post('/index.php?rest_route=/wpoe/v1/admin/events', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        name: TEST_EVENT_NAME,
        date: '2050-01-01T00:00:00.000Z',
        autoremove: true,
        autoremovePeriod: 30,
        waitingList: false,
        editableRegistrations: true,
        formFields: TEST_FIELDS
      }
    });
    expect(response.status()).toEqual(201);
    const { id } = await response.json();
    eventId = id;
  });

  await setup.step('Create test post', async () => {
    const response = await request.post('/index.php?rest_route=/wp/v2/posts', {
      headers: {
        'Cookie': cookies,
        'X-WP-Nonce': nonce
      },
      data: {
        title: TEST_POST_NAME,
        status: 'publish',
        content: `<!-- wp:wp-open-events/form {"eventId":"${eventId}"} --><div class="wp-block-wp-open-events-form">TODO</div><!-- /wp:wp-open-events/form -->`
      }
    });
    expect(response.status()).toEqual(201);
    const { id } = await response.json();
    fs.writeFileSync(testPostStateFile, JSON.stringify({ id }));
  });
});
