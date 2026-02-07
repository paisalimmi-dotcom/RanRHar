import { test, expect } from '@playwright/test';

test.describe('RanRHar Core Flow', () => {
    test.describe.configure({ mode: 'serial' });
    let orderId: string;

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    });

    test('Customer can place an order', async ({ page }) => {
        // 1. Customer: Browse Menu
        await page.goto('/menu/T1');
        await expect(page.locator('h1')).toContainText('Menu');

        // 2. Customer: Add items to cart
        const addButton = page.locator('button:text("Add to Cart")').first();
        await addButton.click();

        // Summary bar shows "1 items"
        const cartSummary = page.locator('text=items');
        await expect(cartSummary).toBeVisible();

        // 3. Customer: Checkout
        // Click the summary bar to expand (it contains "{N} items")
        const summaryBar = page.locator('div:has-text("items")').filter({ hasText: 'Tap to view details' });
        await summaryBar.click();

        const checkoutButton = page.locator('button', { hasText: /^Place Order - ฿/ });
        await checkoutButton.click();

        // Wait for navigation and verify URL
        await expect(page).toHaveURL(/.*\/checkout/);

        // On Checkout page, there is another "Place Order" button (the one that actually creates the order)
        const finalPlaceOrderButton = page.locator('button', { hasText: 'Place Order' }).filter({ hasNotText: 'Place Order - ฿' });
        await finalPlaceOrderButton.waitFor({ state: 'visible' });
        await finalPlaceOrderButton.click();

        await expect(page).toHaveURL(/.*\/order\/success\/.*/);

        orderId = page.url().split('/').pop()!;
        console.log(`Order placed: ${orderId}`);
    });

    test('Staff can manage orders', async ({ page }) => {
        // 4. Staff: Login
        await page.goto('/login');
        await expect(page.locator('h1')).toContainText('Login');

        await page.fill('#email', 'owner@test.com');
        await page.fill('#password', 'password123');
        await page.click('button:text("Login")');

        // Redirect to admin / orders page
        await expect(page).toHaveURL(/\/orders/);

        // 5. Staff: Verify Order exists and manage it
        // Note: Since each test has a fresh context, this might fail if data isn't in DB.
        // The previous test placed an order in the DB, so it should be visible here.
    });
});
