import { Page, Locator, BrowserContext } from '@playwright/test';

/**
 * Page Object Model for the Chrome Extension Popup
 * Handles all interactions with the extension popup UI
 */
export class ExtensionPopupPage {
  readonly page: Page;
  
  // Element selectors with multiple fallback strategies
  readonly rephraseInput: Locator;
  readonly deleteButton: Locator;
  readonly rephraseButton: Locator;
  readonly resultText: Locator;
  readonly copyButton: Locator;
  readonly wordCount: Locator;
  readonly rephraseTab: Locator;

  readonly tldrTab: Locator;
  readonly historyTab: Locator;
  readonly settingsTab: Locator;
  readonly context: BrowserContext;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
    
    // Initialize locators with multiple selector strategies for reliability
    this.rephraseInput = page.locator(
      'textarea[placeholder*="rephrase"], textarea, [data-testid="rephrase-input"], input[type="text"]'
    ).first();
    
    this.deleteButton = page.locator(
      'button[title*="clear"], button[title*="Clear"], [data-testid="delete-btn"], [aria-label*="delete"], button:has-text("×"), svg[data-lucide="trash-2"]'
    ).first();
    
    this.rephraseButton = page.locator(
      'button:has-text("Rephrase"), [data-testid="rephrase-btn"], button:has-text("Rephrasing")'
    ).first();
    
    this.resultText = page.locator(
      '[data-testid="result-text"], .text-neutral-900, .dark\\:text-neutral-100'
    ).first();
    
    this.copyButton = page.locator(
      'button:has-text("Copy"), [data-testid="copy-btn"]'
    ).first();
    
    this.wordCount = page.locator(
      '.text-xs.text-neutral-500, [data-testid="word-count"]'
    ).first();
    
    // Tab selectors
    this.rephraseTab = page.locator('[data-testid="rephrase-tab"], button:has-text("Rephrase")').first();

    this.tldrTab = page.locator('[data-testid="tldr-tab"], button:has-text("TL;DR"), button:has-text("TLDR")').first();
    this.historyTab = page.locator('[data-testid="history-tab"], button:has-text("History")').first();
    this.settingsTab = page.locator('[data-testid="settings-tab"], button:has-text("Settings")').first();
  }

  /**
   * Navigate to the rephrase tab
   */
  async navigateToRephraseTab(): Promise<void> {
    console.log('Navigating to Rephrase tab...');
    await this.rephraseTab.click();
    await this.page.waitForTimeout(500); // Wait for tab switch animation
  }

  /**
   * Navigate to the TLDR tab
   */
  async navigateToTLDRTab(): Promise<void> {
    console.log('Navigating to TLDR tab...');
    await this.tldrTab.click();
    await this.page.waitForTimeout(500); // Wait for tab switch animation
  }

  /**
   * Close the popup (simulate extension close)
   */
  async closePopup(): Promise<void> {
    console.log('Closing popup...');
    await this.page.close();
  }

  /**
   * Get the browser context
   */
  async getContext(): Promise<BrowserContext> {
    return this.context;
  }

  /**
   * Enter text in the rephrase input field
   */
  async enterText(text: string): Promise<void> {
    console.log(`Entering text: "${text}"`);
    await this.rephraseInput.clear();
    await this.rephraseInput.fill(text);
    await this.page.waitForTimeout(100); // Wait for input to register
  }

  /**
   * Get the current text in the rephrase input field
   */
  async getInputText(): Promise<string> {
    const text = await this.rephraseInput.inputValue();
    console.log(`Current input text: "${text}"`);
    return text;
  }

  /**
   * Click the delete/clear button
   */
  async clickDeleteButton(): Promise<void> {
    console.log('Clicking delete button...');
    await this.deleteButton.click();
    await this.page.waitForTimeout(200); // Wait for action to complete
  }

  /**
   * Click the rephrase button
   */
  async clickRephraseButton(): Promise<void> {
    console.log('Clicking rephrase button...');
    await this.rephraseButton.click();
    await this.page.waitForTimeout(500); // Wait for rephrase action
  }

  /**
   * Get the word count display
   */
  async getWordCount(): Promise<string> {
    const count = await this.wordCount.textContent();
    console.log(`Word count: ${count}`);
    return count || '';
  }

  /**
   * Wait for rephrase result to appear
   */
  async waitForResult(): Promise<void> {
    console.log('Waiting for rephrase result...');
    await this.resultText.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get the rephrase result text
   */
  async getResultText(): Promise<string> {
    const result = await this.resultText.textContent();
    console.log(`Result text: "${result}"`);
    return result || '';
  }

  /**
   * Check if result is visible
   */
  async isResultVisible(): Promise<boolean> {
    return await this.resultText.isVisible();
  }

  /**
   * Take a screenshot of the current state
   */
  async takeScreenshot(name: string): Promise<void> {
    console.log(`Taking screenshot: ${name}`);
    await this.page.screenshot({ 
      path: `test-results/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for the popup to be fully loaded
   */
  async waitForPopupLoad(): Promise<void> {
    console.log('Waiting for popup to load...');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000); // Additional wait for React to render
  }

  /**
   * Check if the delete button is visible and enabled
   */
  async isDeleteButtonEnabled(): Promise<boolean> {
    const isVisible = await this.deleteButton.isVisible();
    const isEnabled = await this.deleteButton.isEnabled();
    console.log(`Delete button - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    return isVisible && isEnabled;
  }

  /**
   * Get the delete button's title/aria-label for debugging
   */
  async getDeleteButtonInfo(): Promise<{ title: string | null; ariaLabel: string | null }> {
    const title = await this.deleteButton.getAttribute('title');
    const ariaLabel = await this.deleteButton.getAttribute('aria-label');
    console.log(`Delete button info - Title: ${title}, Aria-label: ${ariaLabel}`);
    return { title, ariaLabel };
  }
} 