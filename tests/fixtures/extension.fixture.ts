import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extension test fixture that provides a browser context with the extension loaded
 */
export const test = base.extend<{ context: BrowserContext }>({
  context: async ({}, use) => {
    // Ensure dist directory exists
    const distPath = path.join(__dirname, '../../dist');
    if (!fs.existsSync(distPath)) {
      throw new Error(`Extension dist directory not found at ${distPath}. Please run 'npm run build' first.`);
    }

    // Launch browser with extension
    const userDataDir = path.join(__dirname, `../test-user-data-${Math.random().toString(36).substring(7)}`);
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Set to true for CI
      args: [
        `--load-extension=${distPath}`,
        '--disable-extensions-except=' + distPath,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      viewport: { width: 1280, height: 720 }
    });

    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    await use(context);

    // Cleanup
    await context.close();
    // Clean up user data directory
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to get extension ID from the loaded extension
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Wait a bit for extension to fully load
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try to get extension ID from service worker
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0) {
    const serviceWorker = serviceWorkers[0];
    const url = serviceWorker.url();
    const extensionId = url.split('/')[2];
    
    if (extensionId) {
      console.log(`Extension ID from service worker: ${extensionId}`);
      return extensionId;
    }
  }

  // Fallback: try background pages
  const backgroundPages = context.backgroundPages();
  if (backgroundPages.length > 0) {
    const backgroundPage = backgroundPages[0];
    const extensionId = backgroundPage.url().split('/')[2];
    
    if (extensionId) {
      console.log(`Extension ID from background page: ${extensionId}`);
      return extensionId;
    }
  }

  // Last resort: try to get from extension management page
  const page = await context.newPage();
  await page.goto('chrome://extensions/');
  await page.waitForTimeout(2000);
  
  // Look for our extension in the extensions list
  const extensionElements = page.locator('extensions-manager').locator('extensions-item');
  const count = await extensionElements.count();
  
  for (let i = 0; i < count; i++) {
    const element = extensionElements.nth(i);
    const name = await element.locator('.name').textContent();
    if (name && name.includes('flipscript')) {
      const id = await element.getAttribute('id');
      if (id) {
        console.log(`Extension ID from extensions page: ${id}`);
        await page.close();
        return id;
      }
    }
  }
  
  await page.close();
  throw new Error('Could not find extension ID. Extension may not have loaded properly.');
}

/**
 * Helper function to open extension popup
 */
export async function openExtensionPopup(context: BrowserContext, extensionId: string) {
  const popupPage = await context.newPage();
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  
  console.log(`Opening popup at: ${popupUrl}`);
  await popupPage.goto(popupUrl);
  
  // Wait for popup to load
  await popupPage.waitForLoadState('domcontentloaded');
  
  return popupPage;
} 