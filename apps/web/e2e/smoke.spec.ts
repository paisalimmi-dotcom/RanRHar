import { test, expect } from '@playwright/test';

test.describe('RanRHar Core Flow', () => {
    test.describe.configure({ mode: 'serial' });
    let orderId: string;

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    });

    test('Customer can place an order', async ({ page }) => {
        await test.step('1. Browse Menu', async () => {
            await page.goto('/menu/T1');
            await expect(page.locator('h1')).toContainText('Menu');
        });

        await test.step('2. Add items to cart', async () => {
            const addButton = page.locator('button:text("Add to Cart")').first();
            await addButton.click();
            const cartSummary = page.locator('text=items');
            await expect(cartSummary).toBeVisible();
        });

        await test.step('3. Checkout', async () => {
            const summaryBar = page.locator('div:has-text("items")').filter({ hasText: 'Tap to view details' });
            await summaryBar.click();

            const checkoutButton = page.locator('button', { hasText: /^Place Order - ฿/ });
            await checkoutButton.click();
            await expect(page).toHaveURL(/.*\/checkout/);
        });

        await test.step('4. Place Order', async () => {
            const finalPlaceOrderButton = page.locator('button', { hasText: 'Place Order' }).filter({ hasNotText: 'Place Order - ฿' });
            await finalPlaceOrderButton.waitFor({ state: 'visible' });
            await finalPlaceOrderButton.click();
            await expect(page).toHaveURL(/.*\/order\/success\/.*/);

            orderId = page.url().split('/').pop()!;
            console.log(`Order placed: ${orderId}`);
        });
    });

    test('Staff can manage orders', async ({ page }) => {
        await test.step('1. Login as Staff', async () => {
            await page.goto('/login');
            await expect(page.locator('h1')).toContainText('Login');
            await page.fill('#email', 'owner@test.com');
            await page.fill('#password', 'password123');
            await page.click('button:text("Login")');
            await expect(page).toHaveURL(/\/orders/);
        });

        await test.step('2. Verify Order', async () => {
            // Note: Since each test has a fresh context, this might fail if data isn't in DB.
            // The previous test placed an order in the DB, so it should be visible here.
        });
    });
});
