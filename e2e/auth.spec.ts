import { expect, test } from '@playwright/test';

// Happy path against the real DummyJSON backend, using the pre-filled demo
// account (emilys / emilyspass).
test('login → dashboard SSR → load more → add to cart → logout', async ({
  page,
}) => {
  // Unauthenticated root is redirected to the login page by proxy.ts.
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);

  // The form is pre-filled with the demo account — just submit.
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Lands on the dashboard with the user and the first 5 products (SSR).
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('@emilys')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(
    5,
  );

  // "Load more" appends the next page.
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(
    10,
  );

  // Add the first product to the cart → success toast.
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByText(/Added to cart/)).toBeVisible();

  // Logout returns to /login, and the dashboard is then protected.
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
