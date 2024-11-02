import { Page, test as baseTest, expect, mergeTests } from '@playwright/test';

export class EventAdminPage {

  private readonly page: Page;
  private readonly eventName: string;

  constructor(page: Page) {
    this.page = page;
    this.eventName = Math.random().toString(36).substring(7);
  }

  async openCreateEventPage() {
    await this.page.goto('/wp-admin/admin.php?page=regi-fair-events');
    await this.page.getByRole('button', { name: 'Add event' }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'From scratch' }).click();
    await expect(this.page.getByRole('heading', { name: 'Create event' })).toHaveCount(1);
    await this.page.getByRole('textbox', { name: 'Name' }).fill(this.eventName);
    await this.page.getByRole('textbox', { name: 'Date' }).fill('2050-01-01');
  }

  async deleteEvent() {
    const url = this.page.url();
    await this.page.getByRole('button', { name: 'Back' }).click();
    await this.page.getByRole('row', { name: this.eventName }).getByRole('button', { name: 'Delete' }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(this.page.getByRole('row', { name: this.eventName })).toHaveCount(0);
    await this.page.goto(url);
    await expect(this.page.getByText('Event not found')).toHaveCount(1);
  }
}

const eventTest = baseTest.extend({
  eventPage: async ({ page }, use) => {
    const eventPage = new EventAdminPage(page);
    await eventPage.openCreateEventPage();
    await use(eventPage);
    await eventPage.deleteEvent();
  }
});

export const test = mergeTests(baseTest, eventTest);
