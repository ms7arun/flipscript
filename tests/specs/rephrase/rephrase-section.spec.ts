import { test, expect } from '../../fixtures/extension.fixture';
import { ExtensionPopupPage } from '../../pages/extension-popup.page';
import { getExtensionId, openExtensionPopup } from '../../fixtures/extension.fixture';
import { TestHelpers } from '../../utils/test-helpers';

/**
 * Test suite for Rephrase section functionality
 * This file contains all test cases related to the Rephrase tab
 * 
 * Current test cases:
 * - Delete button functionality (verifies delete button works correctly)
 * 
 * Future test cases to be added:
 * - Text input functionality
 * - Tone selection
 * - Creativity slider
 * - Rephrase button functionality
 * - Result display and copying
 * - Custom tone functionality
 */
test.describe('Rephrase Section', () => {
  let popupPage: ExtensionPopupPage;
  let extensionId: string;

  test.beforeEach(async ({ context }) => {
    // Ensure test results directory exists
    TestHelpers.ensureTestResultsDir();
    
    // Check if extension files exist
    if (!TestHelpers.checkExtensionFiles()) {
      throw new Error('Extension files not found. Please run "npm run build" first.');
    }

    // Get extension info
    const extensionInfo = TestHelpers.getExtensionInfo();
    if (extensionInfo) {
      console.log(`Testing extension: ${extensionInfo.name} v${extensionInfo.version}`);
      console.log(`Description: ${extensionInfo.description}`);
    }

    // Get extension ID and open popup
    extensionId = await getExtensionId(context);
    const page = await openExtensionPopup(context, extensionId);
    popupPage = new ExtensionPopupPage(page);
    
    // Wait for popup to load
    await popupPage.waitForPopupLoad();
  });

  test.describe('Delete Button Functionality', () => {
    test('should clear input text when delete button is clicked', async () => {
    TestHelpers.logStep('Starting delete button functionality test');
    
    // Step 1: Navigate to rephrase tab
    TestHelpers.logStep('1. Navigating to Rephrase tab');
    await popupPage.navigateToRephraseTab();
    await TestHelpers.wait(500);
    
    // Step 2: Enter test text
    const testText = TestHelpers.getTestText();
    TestHelpers.logStep(`2. Entering test text: "${testText}"`);
    await popupPage.enterText(testText);
    
    // Verify text appears correctly
    const inputText = await popupPage.getInputText();
    TestHelpers.logAssertion('Input text should match entered text', inputText === testText);
    expect(inputText).toBe(testText);
    
    // Take screenshot before delete action
    await popupPage.takeScreenshot('01-before-delete-action');
    
    // Step 3: Check delete button state
    TestHelpers.logStep('3. Checking delete button state');
    const isDeleteEnabled = await popupPage.isDeleteButtonEnabled();
    TestHelpers.logAssertion('Delete button should be visible and enabled', isDeleteEnabled);
    expect(isDeleteEnabled).toBe(true);
    
    // Get delete button info for debugging
    const deleteButtonInfo = await popupPage.getDeleteButtonInfo();
    console.log('Delete button details:', deleteButtonInfo);
    
    // Step 4: Click delete button
    TestHelpers.logStep('4. Clicking delete button');
    await popupPage.clickDeleteButton();
    await TestHelpers.wait(500); // Wait for action to complete
    
    // Take screenshot after delete action
    await popupPage.takeScreenshot('02-after-delete-action');
    
      // Step 5: Verify input field is cleared after delete
      TestHelpers.logStep('5. Verifying input field is cleared after delete');
    const textAfterDelete = await popupPage.getInputText();
    
    // EXPECTED BEHAVIOR: Input should be cleared
      TestHelpers.logAssertion('Input field should be cleared after delete button click', textAfterDelete === '');
      expect(textAfterDelete).toBe('');
      console.log('✅ Delete button is working correctly');
    
    // Step 6: Additional verification - check word count
    TestHelpers.logStep('6. Checking word count after delete');
    const wordCountAfterDelete = await popupPage.getWordCount();
    console.log(`Word count after delete: ${wordCountAfterDelete}`);
    
    // Step 7: Verify no result is visible (since we didn't rephrase)
    TestHelpers.logStep('7. Verifying no result is visible');
    const isResultVisible = await popupPage.isResultVisible();
    TestHelpers.logAssertion('No result should be visible before rephrasing', !isResultVisible);
    
    // Take final screenshot
    await popupPage.takeScreenshot('03-final-state');
    
      TestHelpers.logStep('Delete button test completed successfully');
    });
  });
}); 