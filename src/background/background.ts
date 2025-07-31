// Background service worker for flipscript Chrome Extension

class BackgroundService {
  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this.setupContextMenus();
      this.setupMessageListener();
      this.setupInstallListener();
      this.setupKeyboardShortcuts();
      // Background service initialized successfully
    } catch (error) {
      // Background service initialization failed silently
      // Extension will continue to function with limited features
    }
  }

  private setupContextMenus(): void {
    // Remove existing context menus
    chrome.contextMenus.removeAll(() => {
      // Create main context menu
      chrome.contextMenus.create({
        id: 'flipscript-main',
        title: 'flipscript',
        contexts: ['selection']
      });

      // Create sub-menus for different tones
      const tones = [
        { id: 'professional', title: '💼 Professional', icon: '💼' },
        { id: 'casual', title: '😊 Casual', icon: '😊' },
        { id: 'friendly', title: '🤝 Friendly', icon: '🤝' },
        { id: 'formal', title: '📚 Formal', icon: '📚' },
        { id: 'funny', title: '😄 Funny', icon: '😄' },
        { id: 'confident', title: '💪 Confident', icon: '💪' },
        { id: 'polite', title: '🙏 Polite', icon: '🙏' },
        { id: 'direct', title: '🎯 Direct', icon: '🎯' },
        { id: 'enthusiastic', title: '🚀 Enthusiastic', icon: '🚀' },
        { id: 'diplomatic', title: '⚖️ Diplomatic', icon: '⚖️' },
        { id: 'persuasive', title: '💡 Persuasive', icon: '💡' },
        { id: 'apologetic', title: '😔 Apologetic', icon: '😔' }
      ];

      tones.forEach(tone => {
        chrome.contextMenus.create({
          id: `rephrase-${tone.id}`,
          parentId: 'flipscript-main',
          title: tone.title,
          contexts: ['selection']
        });
      });

      // Add TL;DR option
      chrome.contextMenus.create({
        id: 'tldr-explain',
        parentId: 'flipscript-main',
        title: '💡 Explain (TL;DR)',
        contexts: ['selection']
      });
    });
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
      try {
        if (request.action === 'selectedText') {
          this.handleSelectedText(request.text, request.type);
        } else if (request.action === 'openPopup') {
          this.openPopup();
        }
      } catch (error) {
        // Try to open popup anyway as fallback
        this.openPopup();
      }
    });
  }

  private handleSelectedText(text: string, type?: string): void {
    if (text && text.trim()) {
      // Store the selected text and action type
      let action = null;
      if (type === 'tldr') {
        action = { type: 'tldr', timestamp: Date.now() };
      } else if (type === 'rephrase') {
        action = { type: 'rephrase', timestamp: Date.now() };
      }
      
      chrome.storage.local.set({ 
        'selectedText': text.trim(),
        'pendingAction': action
      }, () => {
        if (chrome.runtime.lastError) {
          // Error storing selected text
        }
        // Open the popup
        this.openPopup();
      });
    } else {
      // Open popup anyway
      this.openPopup();
    }
  }

  private openPopup(): void {
    try {
      chrome.action.openPopup();
    } catch (error) {
      // Silently handle popup opening errors
    }
  }

  public setupContextMenuHandler(): void {
    chrome.contextMenus.onClicked.addListener((info, _tab) => {
      if (info.selectionText) {
        const selectedText = info.selectionText.trim();
        
        if (selectedText) {
          // Store the selected text and action
          const menuItemId = String(info.menuItemId);
          let action;
          
          if (menuItemId.startsWith('rephrase-')) {
            action = { type: 'rephrase', tone: menuItemId.replace('rephrase-', ''), timestamp: Date.now() };
          } else if (menuItemId === 'tldr-explain') {
            action = { type: 'tldr', timestamp: Date.now() };
          }

          chrome.storage.local.set({
            'selectedText': selectedText,
            'pendingAction': action
          }, () => {
            // Open popup
            chrome.action.openPopup();
          });
        }
      }
    });
  }

  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // First time installation
        this.showWelcomeMessage();
        this.setupDefaultSettings();
      } else if (details.reason === 'update') {
        // Extension updated
        // Extension updated successfully
      }
    });
  }

  private showWelcomeMessage(): void {
    try {
      // Check if notifications API is available
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'flipscript',
          message: 'Welcome! Please configure your Groq API key in the extension settings.'
        });
      } else {
        // Fallback: just log to console
        // Extension installed successfully
      }
    } catch (error) {
      // Extension installed successfully
    }
  }

  private setupDefaultSettings(): void {
    const defaultSettings = {
      theme: 'light',
      default_tone: 'professional',
      enable_history: true,
      auto_theme: false,
      selected_model: 'llama3-70b-8192'
    };

    chrome.storage.sync.set(defaultSettings, () => {
      // Default settings initialized
    });
  }

  public handleIconClick(tab: chrome.tabs.Tab): void {
    // Get selected text from the active tab with error handling
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
        if (chrome.runtime.lastError) {
          // Error sending message to tab
          // Fallback: just open popup without text
          chrome.action.openPopup();
          return;
        }
        
        if (response && response.text) {
          chrome.storage.local.set({ 'selectedText': response.text }, () => {
            if (chrome.runtime.lastError) {
              // Error storing selected text
            }
            chrome.action.openPopup();
          });
        } else {
          // No text selected, just open popup
          chrome.action.openPopup();
        }
      });
    } else {
      // No tab or tab.id, just open popup
      chrome.action.openPopup();
    }
  }

  private setupKeyboardShortcuts(): void {
    // Listen for keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'open-extension') {
        this.handleKeyboardShortcut('rephrase');
      } else if (command === 'open-tldr') {
        this.handleKeyboardShortcut('tldr');
      }
    });
  }

  private handleKeyboardShortcut(actionType: 'rephrase' | 'tldr'): void {
    try {
      // Check if we can access tabs API
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        chrome.action.openPopup();
        return;
      }

      // Get the active tab with better error handling
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          // Fallback: just open popup without text
          chrome.action.openPopup();
          return;
        }
        
        if (tabs && tabs.length > 0 && tabs[0] && tabs[0].id) {
          // Try to get selected text from the active tab
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (chrome.runtime.lastError) {
              // Fallback: just open popup without text
              chrome.action.openPopup();
              return;
            }
            
            if (response && response.text && response.text.trim()) {
              // Text is selected, store it with pending action for auto-execution
              chrome.storage.local.set({ 
                'selectedText': response.text.trim(),
                'pendingAction': { type: actionType, timestamp: Date.now() }
              }, () => {
                if (chrome.runtime.lastError) {
                  // Error storing selected text
                } else {
                  // Add a small delay to ensure storage is set before opening popup
                  setTimeout(() => {
                    chrome.action.openPopup();
                  }, 50);
                }
              });
            } else {
              // No text selected, just open popup
              chrome.action.openPopup();
            }
          });
        } else {
          // No active tab found, just open popup
          chrome.action.openPopup();
        }
      });
    } catch (error) {
      // Fallback: just open popup
      chrome.action.openPopup();
    }
  }
}

// Initialize background service with error handling
let backgroundService: BackgroundService;

try {
  backgroundService = new BackgroundService();
  
  // Setup context menu handler
  backgroundService.setupContextMenuHandler();
  
  // Handle extension icon click
  chrome.action.onClicked.addListener((tab) => {
    try {
      backgroundService.handleIconClick(tab);
    } catch (error) {
      // Error handling icon click
      // Fallback: just open popup
      chrome.action.openPopup();
    }
  });
  
  // Background service initialized successfully
} catch (error) {
  // Failed to initialize background service
} 