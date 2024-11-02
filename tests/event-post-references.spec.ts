import { expect, test } from '@playwright/test';
import { adminAuthStateFile, getNonceAndCookiesForApi } from './utils';

test.use({ storageState: adminAuthStateFile });
test.slow();

test('Event referenced in posts', async ({ page, context, request }) => {

  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName1 = Math.random().toString(36).substring(7);
  const eventName2 = Math.random().toString(36).substring(7);
  const eventName3 = Math.random().toString(36).substring(7);
  const eventName4 = Math.random().toString(36).substring(7);
  const eventName5 = Math.random().toString(36).substring(7);
  const eventName6 = Math.random().toString(36).substring(7);

  let eventId1: number;
  let eventId2: number;
  let eventId3: number;
  let eventId4: number;
  let eventId5: number;
  let eventId6: number;

  await test.step('Create test events', async () => {

    async function createEvent(eventName: string): Promise<number> {
      const response = await request.post('/index.php?rest_route=/regifair/v1/admin/events', {
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
      return body.id;
    }

    eventId1 = await createEvent(eventName1);
    eventId2 = await createEvent(eventName2);
    eventId3 = await createEvent(eventName3);
    eventId4 = await createEvent(eventName4);
    eventId5 = await createEvent(eventName5);
    eventId6 = await createEvent(eventName6);
  });

  const postTitle1 = Math.random().toString(36).substring(7);
  const postTitle2 = Math.random().toString(36).substring(7);
  const postTitle3 = Math.random().toString(36).substring(7);
  const postTitle4 = Math.random().toString(36).substring(7);
  const postTitle5 = Math.random().toString(36).substring(7);
  const postTitle6 = Math.random().toString(36).substring(7);
  const postTitle7 = Math.random().toString(36).substring(7);

  let postId1: number;
  let postId2: number;
  let postId3: number;
  let postId4: number;
  let postId5: number;
  let postId7: number;

  async function addEventToPost(postTitle: string, eventName: string): Promise<number> {
    await page.goto('/wp-admin/post-new.php');
    if (await page.getByText('Welcome to the block editor').isVisible()) {
      await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
    await page.getByLabel('Add title').click();
    await page.getByLabel('Add title').fill(postTitle);
    await page.getByLabel('Add block').click();
    await page.getByPlaceholder('Search').fill('RegiFair Form');
    await page.getByRole('option', { name: 'RegiFair Form' }).click();
    await page.getByRole('combobox', { name: 'Select event' }).selectOption(eventName);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByText('Post published.', { exact: true }).waitFor();
    const postUrlRegex = /\/wp-admin\/post\.php\?post=(\d+)&action=edit/;
    await page.waitForURL(postUrlRegex);
    const match = page.url().match(postUrlRegex);
    expect(match).not.toBeNull();
    expect(match!.length).toBeGreaterThan(1);
    return Number(match![1]);
  }

  await test.step('Add first event to one post', async () => {
    postId1 = await addEventToPost(postTitle1, eventName1);
  });

  await test.step('Add second event to 3 posts', async () => {
    postId2 = await addEventToPost(postTitle2, eventName2);
    postId3 = await addEventToPost(postTitle3, eventName2);
    postId4 = await addEventToPost(postTitle4, eventName2);
  });

  await test.step('Add third event to one post and then unpublish the post', async () => {
    postId5 = await addEventToPost(postTitle5, eventName3);
    await page.reload();
    await page.getByLabel('Change post status: Published').click();
    await page.getByLabel('DraftNot ready to publish.').check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Post reverted to draft').first()).toBeVisible();
  });

  await test.step('Add fourth event to one post and then delete the post', async () => {
    await addEventToPost(postTitle6, eventName4);
    await page.reload();
    await page.getByLabel('Actions').click();
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
    await page.getByRole('button', { name: 'Trash' }).click();
    await page.getByText('1 post moved to the Trash').first().waitFor();
    await page.goto('/wp-admin/edit.php?post_status=trash&post_type=post');
    const postRow = page.getByRole('row', { name: postTitle6 });
    await postRow.hover();
    await postRow.getByText('Delete Permanently').click();
    await page.getByText('1 post permanently deleted.').first().waitFor();
  });

  await test.step('Add 2 events to the same post', async () => {
    await page.goto('/wp-admin/post-new.php');
    await page.getByLabel('Add title').click();
    await page.getByLabel('Add title').fill(postTitle7);
    await page.getByLabel('Add block').click();
    await page.getByPlaceholder('Search').fill('RegiFair Form');
    await page.getByRole('option', { name: 'RegiFair Form' }).click();
    await page.getByRole('combobox', { name: 'Select event' }).selectOption(eventName5);
    await page.getByLabel('Block: RegiFair Form').press('Enter');
    await page.getByLabel('Add block').click();
    await page.getByPlaceholder('Search').fill('RegiFair Form');
    await page.getByRole('option', { name: 'RegiFair Form' }).click();
    await page.getByRole('combobox', { name: 'Select event' }).selectOption(eventName6);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByText('Post published.', { exact: true }).waitFor();
    const postUrlRegex = /\/wp-admin\/post\.php\?post=(\d+)&action=edit/;
    await page.waitForURL(postUrlRegex);
    const match = page.url().match(postUrlRegex);
    expect(match).not.toBeNull();
    expect(match!.length).toBeGreaterThan(1);
    postId7 = Number(match![1]);
  });

  await test.step('Check events references', async () => {
    await page.goto(`/wp-admin/admin.php?page=regi-fair-events`);
    await expect(page.getByRole('heading', { name: 'Your events' })).toHaveCount(1);
    await expect(page.getByRole('row', { name: eventName1 }).getByRole('cell').nth(3)).toContainText(postTitle1);
    await expect(page.getByRole('row', { name: eventName2 }).getByRole('cell').nth(3)).toContainText(postTitle4);
    await page.getByRole('row', { name: eventName2 }).getByRole('cell').nth(3).getByRole('button').click();
    await expect(page.getByRole('dialog')).toContainText(postTitle2);
    await expect(page.getByRole('dialog')).toContainText(postTitle3);
    await expect(page.getByRole('dialog')).toContainText(postTitle4);
    await page.getByRole('dialog').getByLabel('Close').click();
    await expect(page.getByRole('row', { name: eventName3 }).getByRole('cell').nth(3)).toContainText('-');
    await expect(page.getByRole('row', { name: eventName4 }).getByRole('cell').nth(3)).toContainText('-');
    await expect(page.getByRole('row', { name: eventName5 }).getByRole('cell').nth(3)).toContainText(postTitle7);
    await expect(page.getByRole('row', { name: eventName6 }).getByRole('cell').nth(3)).toContainText(postTitle7);
  });

  await test.step('Delete referenced event and open post', async () => {
    await page.getByRole('row', { name: eventName1 }).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('row', { name: eventName1 })).toHaveCount(0);
    await page.goto(`/?p=${postId1}`);
    await page.getByText(postTitle1).waitFor();
    await expect(page.getByText('Loading')).toHaveCount(0);
    await expect(page.getByText('Event not found')).toHaveCount(0);
    await page.goto(`/wp-admin/post.php?post=${postId1}&action=edit`);
    await expect(page.getByText('Loading')).toHaveCount(0);
    await expect(page.getByText('Event not found')).toHaveCount(1);
  });

  await test.step('Delete posts', async () => {
    async function deletePost(postId: number) {
      const response = await request.delete(`/index.php?rest_route=/wp/v2/posts/${postId}&force=true`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(200);
    }
    await deletePost(postId1);
    await deletePost(postId2);
    await deletePost(postId3);
    await deletePost(postId4);
    await deletePost(postId5);
    await deletePost(postId7);
  });

  await test.step('Delete events', async () => {
    async function deleteEvent(eventId: number) {
      const response = await request.delete(`/index.php?rest_route=/regifair/v1/admin/events/${eventId}`, {
        headers: {
          'Cookie': cookies,
          'X-WP-Nonce': nonce
        }
      });
      expect(response.status()).toEqual(204);
    }
    await deleteEvent(eventId2);
    await deleteEvent(eventId3);
    await deleteEvent(eventId4);
    await deleteEvent(eventId5);
    await deleteEvent(eventId6);
  });
});
