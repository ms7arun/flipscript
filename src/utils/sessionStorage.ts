/**
 * Session Storage Service
 * Manages text persistence across tabs during the same session
 * Clears all data when extension is closed
 */

interface SessionData {
  text: string;
  timestamp: number;
  tabSource: 'rephrase' | 'tldr';
}

class SessionStorageService {
  private static instance: SessionStorageService;
  private sessionData: Map<string, SessionData> = new Map();
  private sessionId: string;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  public static getInstance(): SessionStorageService {
    if (!SessionStorageService.instance) {
      SessionStorageService.instance = new SessionStorageService();
    }
    return SessionStorageService.instance;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize session and set up cleanup listeners
   */
  private initializeSession(): void {
    if (this.isInitialized) return;

    // Set up session cleanup on extension close
    this.setupSessionCleanup();

    // Load any existing session data from memory
    this.loadSessionData();

    this.isInitialized = true;
  }

  /**
   * Set up listeners for session cleanup when extension closes
   */
  private setupSessionCleanup(): void {
    // Listen for window unload (extension popup closing)
    const handleBeforeUnload = () => {
      this.clearSession();
    };

    // Listen for visibility change (extension popup losing focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.clearSession();
      }
    };

    // Listen for page hide (extension popup being closed)
    const handlePageHide = () => {
      this.clearSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Store cleanup function for later removal
    this.cleanupListeners = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }

  private cleanupListeners?: () => void;

  /**
   * Store text for a specific tab
   */
  public setTabText(tabId: 'rephrase' | 'tldr', text: string): void {
    this.sessionData.set(tabId, {
      text,
      timestamp: Date.now(),
      tabSource: tabId
    });

    // Store in sessionStorage as backup (will be cleared on extension close)
    try {
      sessionStorage.setItem(`flipscript_session_${tabId}`, JSON.stringify({
        text,
        timestamp: Date.now(),
        sessionId: this.sessionId
      }));
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Get text for a specific tab
   */
  public getTabText(tabId: 'rephrase' | 'tldr'): string {
    // First try to get from memory
    const memoryData = this.sessionData.get(tabId);
    if (memoryData) {
      return memoryData.text;
    }

    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem(`flipscript_session_${tabId}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Only use if it's from the same session
        if (data.sessionId === this.sessionId) {
          // Update memory cache
          this.sessionData.set(tabId, {
            text: data.text,
            timestamp: data.timestamp,
            tabSource: tabId
          });
          return data.text;
        }
      }
    } catch (error) {
      // Silently handle retrieval errors
    }

          return '';
  }

  /**
   * Get text from any tab (for cross-tab synchronization)
   */
  public getAnyTabText(): string {
    // Try rephrase tab first
    const rephraseText = this.getTabText('rephrase');
    if (rephraseText) {
      return rephraseText;
    }

    // Try TLDR tab
    const tldrText = this.getTabText('tldr');
    if (tldrText) {
      return tldrText;
    }

    return '';
  }

  /**
   * Clear text for a specific tab
   */
    public clearTabText(tabId: 'rephrase' | 'tldr'): void {
    this.sessionData.delete(tabId);
    
    try {
      sessionStorage.removeItem(`flipscript_session_${tabId}`);
    } catch (error) {
      // Silently handle clear errors
    }
  }

  /**
   * Clear all session data
   */
    public clearSession(): void {
    this.sessionData.clear();
    
    try {
      // Clear all session storage items for this extension
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('flipscript_session_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      // Silently handle clear errors
    }

    // Remove event listeners
    if (this.cleanupListeners) {
      this.cleanupListeners();
    }
  }

  /**
   * Load session data from sessionStorage
   */
  private loadSessionData(): void {
    try {
      ['rephrase', 'tldr'].forEach(tabId => {
        const stored = sessionStorage.getItem(`flipscript_session_${tabId}`);
        if (stored) {
          const data = JSON.parse(stored);
          // Only load if it's from the same session
          if (data.sessionId === this.sessionId) {
                      this.sessionData.set(tabId as 'rephrase' | 'tldr', {
            text: data.text,
            timestamp: data.timestamp,
            tabSource: tabId as 'rephrase' | 'tldr'
          });
        }
        }
      });
    } catch (error) {
      // Silently handle loading errors
    }
  }

  /**
   * Get session info for debugging
   */
  public getSessionInfo(): { sessionId: string; dataCount: number; tabs: string[] } {
    return {
      sessionId: this.sessionId,
      dataCount: this.sessionData.size,
      tabs: Array.from(this.sessionData.keys())
    };
  }

  /**
   * Check if session has any data
   */
  public hasSessionData(): boolean {
    return this.sessionData.size > 0;
  }
}

// Export singleton instance
export const SessionStorage = SessionStorageService.getInstance(); 