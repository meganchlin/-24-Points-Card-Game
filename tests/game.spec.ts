import { test, expect } from '@playwright/test';

test('Game win', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');

    // Click the get profile link.
    await page.getByRole('link', { name: 'Game' }).click();

    // Wait for the URL to change (indicating the redirect)
    await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

    // Expects the page to redirect to profile page.
    await expect(page.url()).toContain('http://localhost:31000/game');

    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Draw Card' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop Drawing' })).toBeVisible();
    await expect(page.getByText('Your Score:')).toBeVisible();

    await page.click('button:has-text("Draw Card")');

    await page.waitForTimeout(1000);

    // Get the cards container directly
    const container = await page.$('.cards-container');

    // Ensure that the container is not null
    expect(container).toBeTruthy();

    // Get the number of child elements within the container
    const childElements = await container!.$$('> *');

    // Assert that there is at least one child element
    expect(childElements.length).toEqual(1)
  
    // Click the button that triggers the alert
    await page.click('button:has-text("Stop Drawing")');
  
    // Wait for the alert to be displayed
    const alert = await page.waitForEvent('dialog');
  
    // Verify the alert type
    expect(alert.type()).toBe('alert');
  
    // Verify that the alert message contains certain words
    const alertMessage = alert.message();
    expect(alertMessage).toContain('You won! Game Ended!');

    // Accept the alert by clicking the "OK" button
    await alert.accept();
});

test('Game lose', async ({ page }) => {
    try {
        console.log("Starting 'Game lose' test...");
        await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user2&group=gamePlayer');
        await page.getByRole('link', { name: 'Game' }).click();
        await page.waitForURL((url) => url.href.includes('game'));
        console.log("Logged in and game page loaded.");

        await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
        await page.getByRole('button', { name: 'Start Game' }).click();
        console.log("Game started.");

        for (let i = 0; i < 10; i++) {
            await page.waitForSelector('button:has-text("Draw Card")', { state: "visible" });
            if (await page.isDisabled('button:has-text("Draw Card")')) {
                console.error(`Draw Card button is disabled at iteration ${i}`);
                break;
            }
            await page.click('button:has-text("Draw Card")', { force: true });
            console.log(`Draw Card clicked ${i+1} times.`);
            await page.waitForTimeout(1000);
        }

        await page.waitForSelector('button:has-text("Stop Drawing")', { state: "visible" });
        await page.click('button:has-text("Stop Drawing")', { force: true });
        console.log("Stop Drawing button clicked.");

        const alert = await page.waitForEvent('dialog');
        expect(alert.message()).toContain('You lose! Game Ended!');
        console.log("Alert received with message: " + alert.message());
        await alert.accept();
    } catch (error) {
        console.error(`Error during 'Game lose' test: ${error}`);
        await page.screenshot({ path: `error_screenshots/tests_error_${Date.now()}.png` });
        throw error;
    }
}, 60000)

test('Waiting for game start', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=admin&group=gameAdmin');

    await page.getByRole('link', { name: 'GameConfig' }).click();
    await page.locator('[id="__BVID__38"]').click();
    await page.locator('[id="__BVID__38"]').fill('3');
    await page.getByRole('button', { name: 'Update Config' }).click();

    await page.getByRole('link', { name: 'Game', exact: true }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByText('Please wait for more players')).toBeVisible();
  
    await page.getByRole('link', { name: 'GameConfig' }).click();
    await page.locator('[id="__BVID__38"]').click();
    await page.locator('[id="__BVID__38"]').fill('1');
    await page.getByRole('button', { name: 'Update Config' }).click();

    // Wait for the alert to be displayed
    const alert = await page.waitForEvent('dialog');

    // Accept the alert by clicking the "OK" button
    await alert.accept();
});