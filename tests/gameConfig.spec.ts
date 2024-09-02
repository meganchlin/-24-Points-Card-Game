import { test, expect } from '@playwright/test';

test('Change game config', async ({ page }) => {
    // await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=admin&group=gameAdmin');

    // // Click the get profile link.
    // await page.getByRole('link', { name: 'GameConfig' }).click();

    // // Expects the page to redirect to profile page.
    // await expect(page.url()).toContain('http://localhost:31000/config');

    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=admin&group=gameAdmin');
    await page.getByRole('link', { name: 'GameConfig' }).click();
    await expect(page).toHaveURL('http://localhost:31000/config');


    await expect(page.getByRole('link', { name: 'GameConfig' })).toBeVisible();
    await page.getByRole('link', { name: 'GameConfig' }).click();
    await expect(page.getByRole('heading', { name: 'Game Config' })).toBeVisible();
    await expect(page.getByText('Total Points:')).toBeVisible();
    await expect(page.getByText('Number Of Deck:')).toBeVisible();
    await expect(page.getByText('Rank Limit:')).toBeVisible();
    await expect(page.getByText('Number Of Players In A Game:')).toBeVisible();
    await expect(page.locator('[id="__BVID__32"]')).toHaveValue('24');
    await expect(page.locator('[id="__BVID__34"]')).toHaveValue('1');
    await expect(page.locator('[id="__BVID__36"]')).toHaveValue('13');
    await expect(page.locator('[id="__BVID__38"]')).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Update Config' })).toBeVisible();

    await page.locator('[id="__BVID__32"]').click();
    await page.locator('[id="__BVID__32"]').fill('1');
    await page.locator('[id="__BVID__34"]').click();
    await page.locator('[id="__BVID__34"]').fill('2');
    await page.locator('[id="__BVID__36"]').click();
    await page.locator('[id="__BVID__36"]').fill('10');
    await page.locator('[id="__BVID__38"]').click();
    await page.locator('[id="__BVID__38"]').fill('5');
    await page.getByRole('button', { name: 'Update Config' }).click();

    // Wait for the alert to be displayed
    const alert = await page.waitForEvent('dialog');
  
    // Verify the alert type
    expect(alert.type()).toBe('alert');
  
    // Verify that the alert message contains certain words
    const alertMessage = alert.message();
    expect(alertMessage).toContain('Game configuration updated successfully');

    // Accept the alert by clicking the "OK" button
    await alert.accept();

    // Click the get profile link.
    await page.getByRole('link', { name: 'GameConfig' }).click();

    await expect(page.locator('[id="__BVID__32"]')).toHaveValue('1');
    await expect(page.locator('[id="__BVID__34"]')).toHaveValue('2');
    await expect(page.locator('[id="__BVID__36"]')).toHaveValue('10');
    await expect(page.locator('[id="__BVID__38"]')).toHaveValue('5');

    // Reset the config back to original
    await page.locator('[id="__BVID__32"]').click();
    await page.locator('[id="__BVID__32"]').fill('24');
    await page.locator('[id="__BVID__34"]').click();
    await page.locator('[id="__BVID__34"]').fill('1');
    await page.locator('[id="__BVID__36"]').click();
    await page.locator('[id="__BVID__36"]').fill('13');
    await page.locator('[id="__BVID__38"]').click();
    await page.locator('[id="__BVID__38"]').fill('1');
    await page.getByRole('button', { name: 'Update Config' }).click();
});