import { test, expect } from '@playwright/test';

test('Login page has title', async ({ page }) => {
    await page.goto('http://localhost:31000/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/24 Points/);
});

// test('Login link', async ({ page }) => {
//     await page.goto('http://localhost:31000/');
  
//     // Click the login link.
//     await page.getByRole('link', { name: 'Login' }).click();

//     // // Wait for the URL to change (indicating the redirect)
//     // await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

//     // Expects the page to redirect to GitLab login page.
//     await expect(page.url()).toContain('coursework.cs.duke.edu/users/sign_in');
// });

test('Login link', async ({ page }) => {
    await page.goto('http://localhost:31000/');
  
    await Promise.all([
        page.getByRole('link', { name: 'Login' }).click(),
        page.waitForURL(/coursework\.cs\.duke\.edu\/users\/sign_in/, {
            waitUntil: 'networkidle',  // Waits until there are no more than 2 network connections for at least 500 ms.
            timeout: 10000  // Waits for 10 seconds for the URL to match the regex pattern.
        })
    ]);

    // Asserts that the current URL matches the expected login page URL.
    expect(page.url()).toMatch(/coursework\.cs\.duke\.edu\/users\/sign_in/);

});



test('Login success', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');
  
    await expect(page.getByText('Welcome, user1')).toBeVisible();
});

test('Redirect to rule after login', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');
  
    // Expects the page to redirect to rule page.
    await expect(page.url()).toContain('http://localhost:31000/rule');
});

test('Profile page', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');

    // Click the get profile link.
    await page.getByRole('link', { name: 'UserProfile' }).click();

    // Wait for the URL to change (indicating the redirect)
    await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

    // Expects the page to redirect to profile page.
    await expect(page.url()).toContain('http://localhost:31000/profile');

    // Wait for the profile card to be visible
    await page.waitForSelector('.profile-card');

    // Get the text content of the header
    const headerText = await page.innerText('.profile-card header');

    // Get the text content of the user name
    const userNameText = await page.innerText('.profile-card h3');

    // Assert that the header text matches the expected value
    expect(headerText).toBe('User Profile');

    // Assert that the user name text matches the expected value
    expect(userNameText).toBe('user1');   
});

test('Ranking page', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');

    // Click the get profile link.
    await page.getByRole('link', { name: 'Ranking' }).click();

    // Wait for the URL to change (indicating the redirect)
    await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

    // Expects the page to redirect to profile page.
    await expect(page.url()).toContain('http://localhost:31000/ranking');

    // Wait for the "Player Rankings" header to be visible
    await page.waitForSelector('h1');

    // Get the text content of the "Player Rankings" header
    const headerText = await page.innerText('h1.text-center');

    // Assert that the header text matches the expected value
    expect(headerText).toBe('Player Rankings'); 
});

test('Game page', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=user1&group=gamePlayer');

    // Click the get profile link.
    await page.getByRole('link', { name: 'Game' }).click();

    // Wait for the URL to change (indicating the redirect)
    await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

    // Expects the page to redirect to profile page.
    await expect(page.url()).toContain('http://localhost:31000/game');

    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
});

test('Game Config page', async ({ page }) => {
    await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=admin&group=gameAdmin');

    // Click the get profile link.
    await page.getByRole('link', { name: 'GameConfig' }).click();

    // Wait for the URL to change (indicating the redirect)
    await page.waitForURL((url) => url.href !== "http://localhost:31000/rule");

    // Expects the page to redirect to profile page.
    await expect(page.url()).toContain('http://localhost:31000/config');

    // Wait for the "Player Rankings" header to be visible
    await page.waitForSelector('h1');

    // Get the text content of the "Player Rankings" header
    const headerText = await page.innerText('h1');

    // Assert that the header text matches the expected value
    expect(headerText).toBe('Game Config');
});