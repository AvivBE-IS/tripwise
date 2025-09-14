import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check form elements
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check navigation link
    await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email Address');
    await expect(emailInput).toBeFocused();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Navigate to register
    await page.getByText("Don't have an account? Sign Up").click();
    await expect(page).toHaveURL('/register');
    
    // Navigate back to login
    await page.getByText("Already have an account? Sign In").click();
    await expect(page).toHaveURL('/login');
  });
});