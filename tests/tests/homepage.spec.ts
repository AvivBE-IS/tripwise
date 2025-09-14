import { test, expect } from '@playwright/test';

test.describe('Travel&Joy Homepage', () => {
  test('should display homepage with hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check if main elements are present
    await expect(page).toHaveTitle(/Travel&Joy/);
    await expect(page.locator('h1')).toContainText('Plan Your Perfect Trip');
    await expect(page.getByText('AI-powered travel planning made simple')).toBeVisible();
    
    // Check navigation
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    
    // Check features section
    await expect(page.getByText('AI-Powered Planning')).toBeVisible();
    await expect(page.getByText('Interactive Timeline')).toBeVisible();
    await expect(page.getByText('Share Your Adventures')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByText('Create your account')).toBeVisible();
  });
});