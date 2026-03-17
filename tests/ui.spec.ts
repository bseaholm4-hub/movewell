import { test, expect } from '@playwright/test';

test.describe('Movewell UI Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the homepage before each test
    await page.goto('/');
  });

  test('Navigation bar changes style on scroll', async ({ page }) => {
    const nav = page.locator('nav');
    
    // Initial state: should not have 'scrolled' class
    await expect(nav).not.toHaveClass(/scrolled/);

    // Scroll down 100px
    await page.evaluate(() => window.scrollTo(0, 100));

    // Wait for the class to be added (scripts.js adds it on scroll > 60)
    await expect(nav).toHaveClass(/scrolled/);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(nav).not.toHaveClass(/scrolled/);
  });

  test('Interactive map container loads correctly', async ({ page }) => {
    // Check if map div exists
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();

    // Check if Leaflet has initialized (it adds leaflet-container class)
    await expect(mapContainer).toHaveClass(/leaflet-container/);
  });

  test('Testimonial carousel is present', async ({ page }) => {
    const track = page.locator('#testimonials');
    await expect(track).toBeVisible();
    
    // Check if it has at least one testimonial card
    const cards = track.locator('.testimonial-card');
    await expect(cards).toHaveCount(4);
  });

  test('Footer is present and contains correct information', async ({ page }) => {
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Movewell');
    await expect(footer).toContainText('All rights reserved');
  });

  test('Favicon is linked in the head', async ({ page }) => {
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveAttribute('href', 'assets/images/favicon.png');
  });

});
