import { test, expect } from '../../fixtures/extension.fixture';
import { ExtensionPopupPage } from '../../pages/extension-popup.page';
import { getExtensionId, openExtensionPopup } from '../../fixtures/extension.fixture';
import { TestHelpers } from '../../utils/test-helpers';

/**
 * Test suite for Session Persistence functionality
 * Tests text persistence across tabs during the same session
 * and session cleanup when extension closes
 */
test.describe('Session Persistence', () => {
  let popupPage: ExtensionPopupPage;
  let extensionId: string;

  test.beforeEach(async ({ context }) => {
    // Ensure test results directory exists
    TestHelpers.ensureTestResultsDir();
    
    // Check if extension files exist
    if (!TestHelpers.checkExtensionFiles()) {
      throw new Error('Extension files not found. Please run "npm run build" first.');
    }

    // Get extension ID and open popup
    extensionId = await getExtensionId(context);
    const page = await openExtensionPopup(context, extensionId);
    popupPage = new ExtensionPopupPage(page);
    
    // Wait for popup to load
    await popupPage.waitForPopupLoad();
  });

  test.describe('Session Storage Debug', () => {
    test('should verify session storage is working', async () => {
      TestHelpers.logStep('Starting session storage debug test');
      
      const testText = "Debug test text for session storage";
      
      // Step 1: Navigate to Rephrase tab
      TestHelpers.logStep('1. Navigating to Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      // Step 2: Enter text in Rephrase tab
      TestHelpers.logStep(`2. Entering text in Rephrase tab: "${testText}"`);
      await popupPage.enterText(testText);
      
      // Verify text is entered in Rephrase tab
      const rephraseText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be entered in Rephrase tab', rephraseText === testText);
      expect(rephraseText).toBe(testText);
      
      // Step 3: Check browser console for session storage logs
      TestHelpers.logStep('3. Checking browser console for session storage logs');
      
      // Get console logs to see if session storage is working
      const logs = await popupPage.page.evaluate(() => {
        return new Promise((resolve) => {
          const originalLog = console.log;
          const logs: string[] = [];
          
          console.log = (...args) => {
            logs.push(args.join(' '));
            originalLog.apply(console, args);
          };
          
          // Wait a bit for any session storage logs
          setTimeout(() => {
            console.log = originalLog;
            resolve(logs);
          }, 1000);
        });
      });
      
      console.log('Browser console logs:', logs);
      
      // Step 4: Check sessionStorage directly
      TestHelpers.logStep('4. Checking sessionStorage directly');
      const sessionStorageData = await popupPage.page.evaluate(() => {
        const data: any = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('flipscript_session_')) {
            data[key] = sessionStorage.getItem(key);
          }
        }
        return data;
      });
      
      console.log('SessionStorage data:', sessionStorageData);
      
      // Take screenshot
      await popupPage.takeScreenshot('debug-session-storage');
      
      TestHelpers.logStep('Session storage debug test completed');
    });
  });

  test.describe('Cross-Tab Text Synchronization', () => {
    test('should persist text from Rephrase tab to TLDR tab', async () => {
      TestHelpers.logStep('Starting cross-tab text synchronization test');
      
      const testText = "This is sample text for cross-tab synchronization test";
      
      // Step 1: Navigate to Rephrase tab
      TestHelpers.logStep('1. Navigating to Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      // Step 2: Enter text in Rephrase tab
      TestHelpers.logStep(`2. Entering text in Rephrase tab: "${testText}"`);
      await popupPage.enterText(testText);
      
      // Verify text is entered in Rephrase tab
      const rephraseText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be entered in Rephrase tab', rephraseText === testText);
      expect(rephraseText).toBe(testText);
      
      // Take screenshot of Rephrase tab with text
      await popupPage.takeScreenshot('01-rephrase-tab-with-text');
      
      // Step 3: Navigate to TLDR tab
      TestHelpers.logStep('3. Navigating to TLDR tab');
      await popupPage.navigateToTLDRTab();
      await TestHelpers.wait(500);
      
      // Step 4: Verify text appears in TLDR tab
      TestHelpers.logStep('4. Verifying text appears in TLDR tab');
      const tldrText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be synchronized to TLDR tab', tldrText === testText);
      expect(tldrText).toBe(testText);
      
      // Take screenshot of TLDR tab with synchronized text
      await popupPage.takeScreenshot('02-tldr-tab-with-synchronized-text');
      
      TestHelpers.logStep('Cross-tab text synchronization test completed');
    });

    test('should persist text from TLDR tab to Rephrase tab', async () => {
      TestHelpers.logStep('Starting TLDR to Rephrase synchronization test');
      
      const testText = "This is sample text for TLDR to Rephrase synchronization";
      
      // Step 1: Navigate to TLDR tab
      TestHelpers.logStep('1. Navigating to TLDR tab');
      await popupPage.navigateToTLDRTab();
      await TestHelpers.wait(500);
      
      // Step 2: Enter text in TLDR tab
      TestHelpers.logStep(`2. Entering text in TLDR tab: "${testText}"`);
      await popupPage.enterText(testText);
      
      // Verify text is entered in TLDR tab
      const tldrText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be entered in TLDR tab', tldrText === testText);
      expect(tldrText).toBe(testText);
      
      // Take screenshot of TLDR tab with text
      await popupPage.takeScreenshot('03-tldr-tab-with-text');
      
      // Step 3: Navigate to Rephrase tab
      TestHelpers.logStep('3. Navigating to Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      // Step 4: Verify text appears in Rephrase tab
      TestHelpers.logStep('4. Verifying text appears in Rephrase tab');
      const rephraseText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be synchronized to Rephrase tab', rephraseText === testText);
      expect(rephraseText).toBe(testText);
      
      // Take screenshot of Rephrase tab with synchronized text
      await popupPage.takeScreenshot('04-rephrase-tab-with-synchronized-text');
      
      TestHelpers.logStep('TLDR to Rephrase synchronization test completed');
    });
  });

  test.describe('Session Cleanup on Extension Close', () => {
    test('should clear all session data when extension is closed', async () => {
      TestHelpers.logStep('Starting session cleanup test');
      
      const testText = "This is sample text for session cleanup test";
      
      // Step 1: Enter text in Rephrase tab
      TestHelpers.logStep('1. Entering text in Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await popupPage.enterText(testText);
      
      // Verify text is entered
      const initialText = await popupPage.getInputText();
      TestHelpers.logAssertion('Text should be entered initially', initialText === testText);
      expect(initialText).toBe(testText);
      
      // Take screenshot before closing
      await popupPage.takeScreenshot('05-before-extension-close');
      
      // Step 2: Close the popup (simulate extension close)
      TestHelpers.logStep('2. Closing extension popup');
      await popupPage.closePopup();
      await TestHelpers.wait(1000);
      
      // Step 3: Reopen the popup
      TestHelpers.logStep('3. Reopening extension popup');
      const newPage = await openExtensionPopup(await popupPage.getContext(), extensionId);
      const newPopupPage = new ExtensionPopupPage(newPage);
      await newPopupPage.waitForPopupLoad();
      
      // Step 4: Navigate to Rephrase tab
      TestHelpers.logStep('4. Navigating to Rephrase tab in new session');
      await newPopupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      // Step 5: Verify text is cleared (no persistence across sessions)
      TestHelpers.logStep('5. Verifying text is cleared in new session');
      const clearedText = await newPopupPage.getInputText();
      TestHelpers.logAssertion('Text should be cleared in new session', clearedText === '');
      expect(clearedText).toBe('');
      
      // Take screenshot after reopening
      await newPopupPage.takeScreenshot('06-after-extension-reopen');
      
      TestHelpers.logStep('Session cleanup test completed');
    });
  });

  test.describe('Tab-Specific Text Management', () => {
    test('should maintain separate text for each tab during session', async () => {
      TestHelpers.logStep('Starting tab-specific text management test');
      
      const rephraseText = "This is text for the Rephrase tab";
      const tldrText = "This is different text for the TLDR tab";
      
      // Step 1: Enter text in Rephrase tab
      TestHelpers.logStep('1. Entering text in Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await popupPage.enterText(rephraseText);
      
      // Verify Rephrase tab text
      const rephraseInputText = await popupPage.getInputText();
      TestHelpers.logAssertion('Rephrase tab should have correct text', rephraseInputText === rephraseText);
      expect(rephraseInputText).toBe(rephraseText);
      
      // Step 2: Enter different text in TLDR tab
      TestHelpers.logStep('2. Entering different text in TLDR tab');
      await popupPage.navigateToTLDRTab();
      await popupPage.enterText(tldrText);
      
      // Verify TLDR tab text
      const tldrInputText = await popupPage.getInputText();
      TestHelpers.logAssertion('TLDR tab should have correct text', tldrInputText === tldrText);
      expect(tldrInputText).toBe(tldrText);
      
      // Step 3: Switch back to Rephrase tab
      TestHelpers.logStep('3. Switching back to Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      // Step 4: Verify Rephrase tab still has its original text
      TestHelpers.logStep('4. Verifying Rephrase tab maintains its text');
      const rephraseTextAfterSwitch = await popupPage.getInputText();
      TestHelpers.logAssertion('Rephrase tab should maintain its text', rephraseTextAfterSwitch === rephraseText);
      expect(rephraseTextAfterSwitch).toBe(rephraseText);
      
      // Step 5: Switch back to TLDR tab
      TestHelpers.logStep('5. Switching back to TLDR tab');
      await popupPage.navigateToTLDRTab();
      await TestHelpers.wait(500);
      
      // Step 6: Verify TLDR tab still has its original text
      TestHelpers.logStep('6. Verifying TLDR tab maintains its text');
      const tldrTextAfterSwitch = await popupPage.getInputText();
      TestHelpers.logAssertion('TLDR tab should maintain its text', tldrTextAfterSwitch === tldrText);
      expect(tldrTextAfterSwitch).toBe(tldrText);
      
      // Take screenshots
      await popupPage.takeScreenshot('07-rephrase-tab-specific-text');
      await popupPage.navigateToTLDRTab();
      await popupPage.takeScreenshot('08-tldr-tab-specific-text');
      
      TestHelpers.logStep('Tab-specific text management test completed');
    });
  });

  test.describe('Real-time Text Updates', () => {
    test('should maintain tab-specific text when both tabs have content', async () => {
      TestHelpers.logStep('Starting tab-specific text management test');
      
      const rephraseText = "Text for Rephrase tab";
      const tldrText = "Text for TLDR tab";
      
      // Step 1: Enter text in Rephrase tab
      TestHelpers.logStep('1. Entering text in Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await popupPage.enterText(rephraseText);
      
      // Step 2: Switch to TLDR tab and enter different text
      TestHelpers.logStep('2. Switching to TLDR tab and entering different text');
      await popupPage.navigateToTLDRTab();
      await popupPage.enterText(tldrText);
      
      // Step 3: Switch back to Rephrase tab and verify it maintains its text
      TestHelpers.logStep('3. Switching back to Rephrase tab');
      await popupPage.navigateToRephraseTab();
      await TestHelpers.wait(500);
      
      const rephraseTextAfterSwitch = await popupPage.getInputText();
      TestHelpers.logAssertion('Rephrase tab should maintain its text', rephraseTextAfterSwitch === rephraseText);
      expect(rephraseTextAfterSwitch).toBe(rephraseText);
      
      // Step 4: Switch back to TLDR tab and verify it maintains its text
      TestHelpers.logStep('4. Switching back to TLDR tab');
      await popupPage.navigateToTLDRTab();
      await TestHelpers.wait(500);
      
      const tldrTextAfterSwitch = await popupPage.getInputText();
      TestHelpers.logAssertion('TLDR tab should maintain its text', tldrTextAfterSwitch === tldrText);
      expect(tldrTextAfterSwitch).toBe(tldrText);
      
      // Take screenshots
      await popupPage.takeScreenshot('09-rephrase-tab-specific-text');
      await popupPage.navigateToTLDRTab();
      await popupPage.takeScreenshot('10-tldr-tab-specific-text');
      
      TestHelpers.logStep('Tab-specific text management test completed');
    });
  });
}); 