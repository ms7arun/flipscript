import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test helper utilities for Chrome extension testing
 */
export class TestHelpers {
  /**
   * Ensure test results directory exists
   */
  static ensureTestResultsDir(): void {
    const resultsDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  }

  /**
   * Clean up test results directory
   */
  static cleanupTestResults(): void {
    const resultsDir = path.join(__dirname, '../test-results');
    if (fs.existsSync(resultsDir)) {
      fs.rmSync(resultsDir, { recursive: true, force: true });
    }
  }

  /**
   * Generate unique test data
   */
  static getTestText(): string {
    return "This is sample text for rephrasing functionality test";
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log test step with timestamp
   */
  static logStep(step: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] STEP: ${step}`);
  }

  /**
   * Log test assertion with timestamp
   */
  static logAssertion(assertion: string, result: boolean): void {
    const timestamp = new Date().toISOString();
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`[${timestamp}] ASSERTION: ${assertion} - ${status}`);
  }

  /**
   * Log error with timestamp
   */
  static logError(error: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${error}`);
    if (details) {
      console.error(`[${timestamp}] DETAILS:`, details);
    }
  }

  /**
   * Check if extension files exist
   */
  static checkExtensionFiles(): boolean {
    const distPath = path.join(__dirname, '../../dist');
    const manifestPath = path.join(distPath, 'manifest.json');
    const popupPath = path.join(distPath, 'popup.html');

    const distExists = fs.existsSync(distPath);
    const manifestExists = fs.existsSync(manifestPath);
    const popupExists = fs.existsSync(popupPath);

    console.log('Extension files check:');
    console.log(`  - dist directory: ${distExists ? '✅' : '❌'}`);
    console.log(`  - manifest.json: ${manifestExists ? '✅' : '❌'}`);
    console.log(`  - popup.html: ${popupExists ? '✅' : '❌'}`);

    return distExists && manifestExists && popupExists;
  }

  /**
   * Get extension manifest information
   */
  static getExtensionInfo(): { name: string; version: string; description: string } | null {
    try {
      const manifestPath = path.join(__dirname, '../../dist/manifest.json');
      if (!fs.existsSync(manifestPath)) {
        return null;
      }

      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      return {
        name: manifest.name || 'Unknown',
        version: manifest.version || 'Unknown',
        description: manifest.description || 'No description'
      };
    } catch (error) {
      console.error('Error reading manifest:', error);
      return null;
    }
  }
} 