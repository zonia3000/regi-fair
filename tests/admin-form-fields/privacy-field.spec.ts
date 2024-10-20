import { Page, TestType, expect } from '@playwright/test';
import { test as eventTest } from '../event-fixture';
import { test as templateTest } from '../template-fixture';
import { adminAuthStateFile } from '../utils';

eventTest.use({ storageState: adminAuthStateFile });
templateTest.use({ storageState: adminAuthStateFile });

eventTest('Edit privacy field in event', async ({ eventPage }) => {
  await testPrivacyField(eventTest, eventPage.page, eventPage.eventName);
});
templateTest('Edit privacy field in template', async ({ templatePage }) => {
  await testPrivacyField(templateTest, templatePage.page, templatePage.templateName);
});

async function testPrivacyField(test: TestType<any, any>, page: Page, itemName: string) {

  await test.step('Add privacy field', async () => {
    await page.getByRole('button', { name: 'Add form field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Privacy policy' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('privacy');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('privacy');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
  });

  await test.step('Save and reopen', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: itemName })).toHaveCount(1);
    await page.getByRole('link', { name: itemName }).click();
    await expect(page.getByRole('heading', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(2);
  });

  await test.step('Check privacy field', async () => {
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('privacy');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(1)).toContainText('privacy');
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('Yes');
    await page.getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('privacy policy');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('row').nth(1).getByRole('cell').nth(0)).toContainText('privacy');
  });
}
