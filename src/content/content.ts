// Content script for flipscript Chrome Extension

// Prevent multiple instances using a simple approach
if ((window as any).flipscriptContentScriptInitialized) {
  // Already initialized, skipping...
} else {
  (window as any).flipscriptContentScriptInitialized = true;

  class ContentScript {
    private selectedText: string = '';
    private hoverButton: HTMLElement | null = null;
    private selectionTimeout: number | null = null;
    private isProcessingSelection: boolean = false;
    private autoHideTimeout: number | null = null;
    private settingsLoaded: boolean = false;
    private settings: { enablePopover: boolean; popoverAutoHideTime: number } = {
      enablePopover: true, // Start enabled by default
      popoverAutoHideTime: 5000
    };

    constructor() {
      this.init();
    }

    private async init(): Promise<void> {
      await this.loadSettings();
      this.settingsLoaded = true;
      this.setupTextSelection();
      this.setupMessageListener();
      this.setupSettingsListener();
    }

    private async loadSettings(): Promise<void> {
      try {
        const result = await chrome.storage.sync.get(['enablePopover', 'popoverAutoHideTime']);
        this.settings.enablePopover = result.enablePopover ?? true;
        this.settings.popoverAutoHideTime = result.popoverAutoHideTime ?? 5000;
      } catch (error) {
        // Use default settings on error
      }
    }

    private setupSettingsListener(): void {
      // Simple storage listener - may not work reliably in all cases
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          if (changes.enablePopover) {
            this.settings.enablePopover = changes.enablePopover.newValue ?? true;
            // Immediately clear popover if disabled
            if (!this.settings.enablePopover && this.hoverButton) {
              this.clearHighlight();
            }
          }
          if (changes.popoverAutoHideTime) {
            this.settings.popoverAutoHideTime = changes.popoverAutoHideTime.newValue ?? 5000;
          }
        }
      });
    }

    private handleTextSelection(): void {
      // Clear any existing timeout
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }

      // Debounce the selection handling to prevent multiple rapid calls
      this.selectionTimeout = window.setTimeout(() => {
        this.processTextSelection();
      }, 50);
    }

    private processTextSelection(): void {
      // Prevent multiple simultaneous processing
      if (this.isProcessingSelection) {
        return;
      }

      // Don't process if settings haven't loaded yet
      if (!this.settingsLoaded) {
        return;
      }

      this.isProcessingSelection = true;

      try {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          const selectedText = selection.toString().trim();
          this.selectedText = selectedText;
          
          // Only show popover if enabled in settings
          if (this.settings.enablePopover) {
            this.highlightSelection();
          }
        }
      } catch (error) {
        // Handle any errors silently
      } finally {
        this.isProcessingSelection = false;
      }
    }

    private setupTextSelection(): void {
      // Listen for text selection with improved handling
      document.addEventListener('mouseup', () => {
        this.handleTextSelection();
      });

      // Listen for keyboard selection (Ctrl+A, Shift+Arrow keys, etc.)
      document.addEventListener('keyup', (e) => {
        // Check for common selection keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
            e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown' ||
            (e.ctrlKey && e.key === 'a')) {
          this.handleTextSelection();
        }
      });

      // Clear selection when clicking elsewhere
      document.addEventListener('mousedown', (e) => {
        if (!e.target || !(e.target as Element).closest('.flipscript-premium-container')) {
          this.clearHighlight();
        }
      });

      // Listen for context menu
      document.addEventListener('contextmenu', () => {
        this.handleTextSelection();
      });

      // Clear on scroll
      document.addEventListener('scroll', () => {
        this.clearHighlight();
      }, { passive: true });

      // Listen for selection changes
      document.addEventListener('selectionchange', () => {
        this.handleTextSelection();
      });
    }

    private highlightSelection(): void {
      this.clearHighlight();
      
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        this.showHoverButton(rect);
      }
    }

    private clearHighlight(): void {
      // Clear auto-hide timeout
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
        this.autoHideTimeout = null;
      }

      if (this.hoverButton) {
        // Remove immediately without animation to prevent flickering
        this.hoverButton.remove();
        this.hoverButton = null;
      }
    }

    private showHoverButton(rect: DOMRect): void {
      // Inject CSS styles first
      this.injectButtonStyles();
      
      const container = document.createElement('div');
      container.className = 'flipscript-hover-button';
      
      // Create premium hover button with inline styles
      container.innerHTML = `
        <div class="flipscript-premium-container">
          <button class="flipscript-premium-btn rephrase-btn" data-action="rephrase" title="Rephrase text">
            <span class="btn-label">Rephrase</span>
          </button>
          <div class="btn-divider"></div>
          <button class="flipscript-premium-btn explain-btn" data-action="tldr" title="Explain text">
            <span class="btn-label">Explain</span>
          </button>
        </div>
      `;

      // Position the container with improved positioning
      const containerRect = this.calculatePremiumPosition(rect);
      
      container.style.cssText = `
        position: fixed;
        top: ${containerRect.top}px;
        left: ${containerRect.left}px;
        z-index: 2147483647;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        pointer-events: auto;
        animation: flipscript-fade-in 0.2s ease-out;
      `;

      // Add premium hover effects to buttons
      const buttons = container.querySelectorAll('.flipscript-premium-btn');
      buttons.forEach(button => {
        const buttonEl = button as HTMLElement;
        
        // Add click handler
        buttonEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const action = buttonEl.dataset.action;
          if (action) {
            // Store the current selected text before clearing
            // const currentSelectedText = this.selectedText;
            // Button clicked, storing text
            
            // Send the stored text to popup
            this.sendTextToPopup(action);
            
            // Clear the highlight immediately without animation to prevent flickering
            this.clearHighlight();
          }
        });
      });

      // Ensure container is added to the page
      try {
        document.body.appendChild(container);
        this.hoverButton = container;
        
        // Set up auto-hide timeout
        this.setupAutoHide();
      } catch (error) {
        // Silently handle button injection errors to avoid console spam
        // The button will simply not appear if there's an issue
      }
    }

    private setupAutoHide(): void {
      // Clear any existing timeout
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
      }

      // Set new auto-hide timeout
      this.autoHideTimeout = window.setTimeout(() => {
        this.clearHighlight();
      }, this.settings.popoverAutoHideTime);
    }

    private injectButtonStyles(): void {
      // Check if styles are already injected
      if (document.getElementById('flipscript-button-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'flipscript-button-styles';
      style.textContent = `
        /* Flipscript Button Styles - High Specificity */
        .flipscript-premium-container {
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
          padding: 6px !important;
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(229, 229, 229, 0.8) !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          margin: 0 !important;
          position: relative !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          box-sizing: border-box !important;
        }

        .flipscript-premium-btn {
          background: #3B82F6 !important;
          color: white !important;
          border: 1px solid #60A5FA !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease-in-out !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: -0.01em !important;
          min-width: 80px !important;
          height: 36px !important;
          position: relative !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          margin: 0 !important;
          outline: none !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
          box-shadow: 0 2px 8px -1px rgba(59, 130, 246, 0.2) !important;
        }

        .flipscript-premium-btn:hover {
          background: #2563EB !important;
          color: white !important;
          box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.3) !important;
          border-color: #93C5FD !important;
          transform: translateY(-1px) !important;
        }

        .flipscript-premium-btn:active {
          transform: translateY(0) !important;
          transition: all 0.1s !important;
        }

        .flipscript-premium-btn .btn-label {
          font-weight: 500 !important;
          white-space: nowrap !important;
          font-size: 13px !important;
          color: white !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }

        .btn-divider {
          width: 1px !important;
          height: 24px !important;
          background: rgba(229, 229, 229, 0.8) !important;
          margin: 0 3px !important;
          flex-shrink: 0 !important;
        }

        @keyframes flipscript-fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes flipscript-fade-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
        }
      `;

      document.head.appendChild(style);
    }

    private calculatePremiumPosition(rect: DOMRect): { top: number; left: number } {
      const containerWidth = 180; // Width for compact buttons
      const containerHeight = 48; // Height for compact design
      const margin = 8;
      
      // Calculate initial position - show above the selection
      let top = rect.top - containerHeight - margin;
      let left = rect.left + rect.width / 2 - containerWidth / 2;
      
      // Ensure container stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if container goes off-screen
      if (left < margin) {
        left = margin;
      } else if (left + containerWidth > viewportWidth - margin) {
        left = viewportWidth - containerWidth - margin;
      }
      
      // Adjust vertical position if container goes off-screen
      if (top < margin) {
        // Show below the selection if there's no space above
        top = rect.bottom + margin;
      }
      
      // Ensure container doesn't go below viewport
      if (top + containerHeight > viewportHeight - margin) {
        top = viewportHeight - containerHeight - margin;
      }
      
      return { top, left };
    }

    private sendTextToPopup(action: string): void {
      if (!this.selectedText) {
        return;
      }

      // Sending text to popup

      // Try multiple approaches to send the message
      const sendMessage = () => {
        try {
          // Check if chrome runtime is available and valid
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
              action: 'selectedText',
              text: this.selectedText,
              type: action
            }, () => {
              if (chrome.runtime.lastError) {
                // Runtime error occurred, using fallback
                this.fallbackToStorage(action);
              } else {
                // Message sent successfully via runtime
              }
            });
          } else {
            // Chrome runtime not available, using fallback
            this.fallbackToStorage(action);
          }
        } catch (error) {
          // Failed to send message to extension
          // Try fallback approach
          this.fallbackToStorage(action);
        }
      };

      // Try sending message
      sendMessage();
    }

    private fallbackToStorage(action: string): void {
      try {
        // Using storage fallback for action
        // Fallback: use chrome.storage to communicate
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            'selectedText': this.selectedText,
            'pendingAction': { type: this.getActionType(action), timestamp: Date.now() }
          }, () => {
            if (chrome.runtime.lastError) {
              // Storage fallback also failed
            } else {
              // Message sent via storage fallback successfully
              // Try to open popup directly
              this.openPopupDirectly();
            }
          });
        } else {
          // Try to open popup directly as last resort
          this.openPopupDirectly();
        }
      } catch (error) {
        // Storage fallback failed
        // Try to open popup directly as last resort
        this.openPopupDirectly();
      }
    }

    private openPopupDirectly(): void {
      try {
        // Try to open popup directly via runtime message
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ action: 'openPopup' }, () => {
            if (chrome.runtime.lastError) {
              // Failed to open popup
            } else {
              // Popup opened successfully
            }
          });
        }
      } catch (error) {
        // Failed to open popup
      }
    }

    private getActionType(action: string): string {
      // Map action to the correct type
      return action === 'tldr' ? 'tldr' : 'rephrase';
    }

    private setupMessageListener(): void {
      try {
        // Check if chrome runtime is available and valid
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
            try {
              if (request.action === 'getSelectedText') {
                // Get current selection as fallback
                const currentSelection = this.getSelectedText();
                const response = { text: currentSelection || this.selectedText };
                sendResponse(response);
              }
            } catch (error) {
              // Error handling message
              sendResponse({ text: '' });
            }
          });
        } else {
          // Chrome runtime not available for message listener
        }
      } catch (error) {
        // Failed to setup message listener
      }
    }

    public getSelectedText(): string {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : '';
      return selectedText;
    }
  }

  // Initialize content script with error handling
  try {
    new ContentScript();
    // Content script initialized successfully
  } catch (error) {
    // Failed to initialize content script
  }
} 