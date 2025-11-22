// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  test('should match the homepage snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png', { 
      maxDiffPixelRatio: 0.01 
    });
  });

  test('should match the interview setup form snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('form')).toHaveScreenshot('interview-form.png', { 
      maxDiffPixelRatio: 0.01 
    });
  });

  test('should match the interview question view snapshot', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Fill in the form
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Phone').fill('+1234567890');
    
    // Select a role
    await page.getByLabel('Role Applying For').click();
    await page.getByText('Frontend Developer').click();
    
    // Check GDPR consent
    await page.getByLabel('I agree to the Privacy Policy and Terms of Service').check();
    
    // Start the interview
    await page.getByRole('button', { name: 'Start Interview' }).click();
    
    // Wait for the interview page to load
    await expect(page.getByText('Question 1 of')).toBeVisible();
    
    await expect(page.locator('.interview-container')).toHaveScreenshot('interview-question.png', { 
      maxDiffPixelRatio: 0.01 
    });
  });

  test('should match the interview completion view snapshot', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Fill in the form
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Phone').fill('+1234567890');
    
    // Select a role
    await page.getByLabel('Role Applying For').click();
    await page.getByText('Frontend Developer').click();
    
    // Check GDPR consent
    await page.getByLabel('I agree to the Privacy Policy and Terms of Service').check();
    
    // Start the interview
    await page.getByRole('button', { name: 'Start Interview' }).click();
    
    // Wait for the interview page to load
    await expect(page.getByText('Question 1 of')).toBeVisible();
    
    // Answer the first question
    await page.getByPlaceholder('Type your answer here...').fill('This is my answer to the first question.');
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    
    // Answer the second question
    await expect(page.getByText('Question 2 of')).toBeVisible();
    await page.getByPlaceholder('Type your answer here...').fill('This is my answer to the second question.');
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    
    // Verify interview completion
    await expect(page.getByText('Interview Completed')).toBeVisible();
    
    await expect(page.locator('.completion-container')).toHaveScreenshot('interview-completion.png', { 
      maxDiffPixelRatio: 0.01 
    });
  });

  test('should match the dashboard view snapshot', async ({ page }) => {
    // For now, we'll test the dashboard route
    // In a real implementation, you would need to authenticate first
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png', { 
      maxDiffPixelRatio: 0.01 
    });
  });
});