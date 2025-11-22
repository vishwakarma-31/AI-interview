// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('AI Interview Flow', () => {
  test('should allow candidate to start an interview', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Check that the interview setup form is visible
    await expect(page.getByText('Start a New Interview')).toBeVisible();
    
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
    
    // Check that we're on the interview page
    await expect(page.getByText('Question 1 of')).toBeVisible();
  });

  test('should display error for invalid form submission', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Try to submit without filling the form
    await page.getByRole('button', { name: 'Start Interview' }).click();
    
    // Check that error messages are displayed
    await expect(page.getByText('Please enter your full name')).toBeVisible();
    await expect(page.getByText('Please enter your email')).toBeVisible();
    await expect(page.getByText('Please enter your phone number')).toBeVisible();
  });

  test('should allow candidate to complete a full interview', async ({ page }) => {
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
  });

  test('should allow candidate to use speech recognition', async ({ page }) => {
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
    
    // Check that speech recognition buttons are available
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible();
  });

  test('should show webcam when available', async ({ page }) => {
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
    
    // Check that webcam is visible
    await expect(page.getByTestId('webcam')).toBeVisible();
  });
});