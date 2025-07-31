# Chrome Extension UI Automation Tests

This test suite uses **Playwright** to automate testing of the "Text to Rephrase" Chrome extension, specifically focusing on identifying and fixing the broken delete button functionality.

## 🎯 Test Objective

**Primary Goal**: Identify that the delete button in the Rephrase tab only clears the result, not the input text, and provide a fix.

## 📁 Project Structure

```
tests/
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Test dependencies
├── fixtures/
│   └── extension.fixture.ts     # Extension loading and helper functions
├── pages/
│   └── extension-popup.page.ts  # Page Object Model for popup UI
├── specs/
│   └── rephrase/
│       └── rephrase-section.spec.ts # All rephrase-related test cases
├── utils/
│   └── test-helpers.ts          # Utility functions
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Build the extension first**:
   ```bash
   cd /path/to/chrome-rephraser-react
   npm run build:clean
   ```

2. **Install test dependencies**:
   ```bash
   cd tests
   npm install
   npx playwright install chromium
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# View test report
npm run test:report
```

## 🧪 Test Case: Delete Button Functionality

### Scenario
```
GIVEN: User has entered text in the rephrase input field
WHEN: User clicks the delete/clear button
THEN: Input field should be completely cleared
```

### Current Issue
The delete button currently only clears the result text, not the input text. This test will:

1. ✅ **Identify the bug** - Test will fail, demonstrating the issue
2. 🔧 **Provide the fix** - Code changes to make delete button work correctly
3. ✅ **Verify the fix** - Re-run test to confirm it now passes

### Current Test Cases

#### Delete Button Functionality
1. **Open extension popup** via extension icon
2. **Navigate to Rephrase tab** (if multiple tabs exist)
3. **Enter test text**: "This is sample text for rephrasing functionality test"
4. **Verify text appears** correctly in the rephrase input field
5. **Click delete button** (Trash2 icon)
6. **Verify input field is cleared** (currently fails - this is the bug)
7. **Capture screenshots** showing before/after states

#### Session Persistence Functionality
1. **Cross-Tab Text Synchronization**: Text entered in one tab appears in other tabs
2. **Session Cleanup**: All text is cleared when extension is closed
3. **Tab-Specific Text Management**: Each tab maintains its own text when both have content
4. **Real-time Text Updates**: Text changes are immediately stored and synchronized
5. **Session Storage Debug**: Verifies session storage is working correctly

### Future Test Cases to be Added
- **Text Input Functionality**: Word count, input validation
- **Tone Selection**: Preset tone selection and custom tones
- **Creativity Slider**: Slider functionality and value changes
- **Rephrase Button**: API integration and result generation
- **Result Display**: Copy functionality and result formatting
- **Custom Tone**: Custom tone input and persistence

## 🔍 Expected Test Results

### Delete Button Test
- **Initial Run**: Should FAIL ❌ (delete button doesn't work)
- **After Fix**: Should PASS ✅ (delete button clears rephrase input)
- **Reports**: HTML reports with screenshots showing before/after fix

### Session Persistence Tests
- **Cross-Tab Synchronization**: Should PASS ✅ (text flows between tabs)
- **Session Cleanup**: Should PASS ✅ (text cleared on extension close)
- **Tab-Specific Management**: Should PASS ✅ (each tab maintains its text)
- **Real-time Updates**: Should PASS ✅ (immediate storage and sync)
- **Session Storage Debug**: Should PASS ✅ (verifies storage functionality)

## 🛠️ Fix Implementation

### Problem Analysis
The issue is in `src/popup/components/RephraseTab.tsx`:

```typescript
const handleClear = () => {
  // Only clear result, keep the input text
  setResult('');
  setAutoTriggered(false);
  // Don't clear text, customTone, or showCustomTone to persist them
  // setSelectedTone(defaultTone); // Keep current tone selection
};
```

### Solution
The `handleClear` function should also clear the input text:

```typescript
const handleClear = () => {
  // Clear both result and input text
  setResult('');
  setText(''); // Add this line to clear input text
  setAutoTriggered(false);
};
```

## 📊 Test Reports

After running tests, view detailed reports:

```bash
npm run test:report
```

Reports include:
- ✅/❌ Test results
- 📸 Screenshots of each step
- 🎥 Video recordings (on failure)
- 📝 Detailed logs and traces

## 🔧 Troubleshooting

### Common Issues

#### 1. Extension Not Found
```
Error: Extension dist directory not found
```
**Solution**: Run `npm run build:clean` in the main project directory first.

#### 2. Extension Won't Load
```
Error: No background pages found
```
**Solution**: 
- Check that `dist/manifest.json` exists
- Verify extension has proper permissions
- Try running in headed mode: `npm run test:headed`

#### 3. Elements Not Found
```
Error: Element not found
```
**Solution**: 
- Check that extension popup is loading correctly
- Verify element selectors in `extension-popup.page.ts`
- Run in debug mode: `npm run test:debug`

#### 4. Test Timeout
```
Error: Test timeout
```
**Solution**:
- Increase timeout in `playwright.config.ts`
- Check for slow extension loading
- Verify extension is not hanging

### Debug Mode

Run tests in debug mode to step through:

```bash
npm run test:debug
```

This opens Playwright Inspector where you can:
- Step through test execution
- Inspect elements
- View network requests
- Debug extension loading

## 📝 Adding New Tests

### Test Structure
```typescript
import { test, expect } from '../../fixtures/extension.fixture';
import { ExtensionPopupPage } from '../../pages/extension-popup.page';

test.describe('Rephrase Section', () => {
  test('your test name', async ({ context }) => {
    // Setup
    const extensionId = await getExtensionId(context);
    const page = await openExtensionPopup(context, extensionId);
    const popupPage = new ExtensionPopupPage(page);
    
    // Test steps
    await popupPage.navigateToRephraseTab();
    await popupPage.enterText('test text');
    
    // Assertions
    expect(await popupPage.getInputText()).toBe('test text');
  });
});
```

### Best Practices

1. **Use Page Object Model** - All UI interactions through `ExtensionPopupPage`
2. **Robust Selectors** - Multiple fallback strategies for element selection
3. **Comprehensive Logging** - Use `TestHelpers.logStep()` for debugging
4. **Screenshots** - Capture before/after states for visual verification
5. **Error Handling** - Graceful handling of extension loading issues

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Extension Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:clean
      - run: cd tests && npm install
      - run: cd tests && npx playwright install chromium
      - run: cd tests && npm test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the Page Object Model pattern
3. Add comprehensive logging
4. Include screenshots for visual verification
5. Update this README with new test information

---

**Note**: This test suite is designed to identify and fix the delete button bug. After the fix is applied, the test will pass and demonstrate the correct functionality. 