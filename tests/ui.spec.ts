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

test.describe('FAQ Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/faq.html');
  });

  test('FAQ page loads and hero is visible', async ({ page }) => {
    const hero = page.locator('section.hero.faq-hero');
    await expect(hero).toBeVisible();
    await expect(page.locator('h1.hero-headline')).toHaveText('FAQ');
  });

  test('All four category section labels are present', async ({ page }) => {
    const labels = page.locator('.section-label');
    await expect(labels).toHaveCount(4);
    await expect(labels.nth(0)).toContainText('About');
    await expect(labels.nth(1)).toContainText('Services');
    await expect(labels.nth(2)).toContainText('Payment');
    await expect(labels.nth(3)).toContainText('Treatment');
  });

  test('Accordion items are collapsed by default', async ({ page }) => {
    const firstItem = page.locator('.faq-item').first();
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('Clicking an accordion item opens it', async ({ page }) => {
    const firstItem = page.locator('.faq-item').first();
    const summary = firstItem.locator('summary');
    await summary.click();
    await expect(firstItem).toHaveAttribute('open', '');
    const answer = firstItem.locator('.faq-answer');
    await expect(answer).toBeVisible();
  });

  test('Clicking an open accordion item closes it', async ({ page }) => {
    const firstItem = page.locator('.faq-item').first();
    const summary = firstItem.locator('summary');
    await summary.click();
    await expect(firstItem).toHaveAttribute('open', '');
    await summary.click();
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('Nav link to FAQ is present on the homepage', async ({ page }) => {
    await page.goto('/');
    const faqLink = page.locator('nav a[href="faq.html"]');
    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveText('FAQ');
  });

});

