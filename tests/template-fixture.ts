import { Page, test as baseTest, expect, mergeTests } from '@playwright/test';

export class TemplateAdminPage {

  private readonly page: Page;
  private readonly templateName: string;

  constructor(page: Page) {
    this.page = page;
    this.templateName = Math.random().toString(36).substring(7);
  }

  async openCreateTemplatePage() {
    await this.page.goto('/wp-admin/admin.php?page=regi-fair-templates');
    await this.page.getByRole('button', { name: 'Add event template' }).click();
    await this.page.getByRole('textbox', { name: 'Name', exact: true }).fill(this.templateName);
  }

  async deleteTemplate() {
    const url = this.page.url();
    await this.page.getByRole('button', { name: 'Back' }).click();
    await this.page.getByRole('row', { name: this.templateName }).getByRole('button', { name: 'Delete' }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(this.page.getByRole('row', { name: this.templateName })).toHaveCount(0);
    await this.page.goto(url);
    await expect(this.page.getByText('Template not found')).toHaveCount(1);
  }
}

const templateTest = baseTest.extend({
  templatePage: async ({ page }, use) => {
    const templatePage = new TemplateAdminPage(page);
    await templatePage.openCreateTemplatePage();
    await use(templatePage);
    await templatePage.deleteTemplate();
  }
});

export const test = mergeTests(baseTest, templateTest);
