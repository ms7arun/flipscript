import { ExtensionSettings, HistoryItem } from '@/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/config/constants';

export class StorageService {
  // Settings management
  static async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.SELECTED_MODEL,
        STORAGE_KEYS.DEFAULT_TONE,
        STORAGE_KEYS.ENABLE_HISTORY,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.TONE_VIEW_TYPE,
        STORAGE_KEYS.ENABLE_POPOVER,
        STORAGE_KEYS.POPOVER_AUTO_HIDE_TIME,
        STORAGE_KEYS.DEFAULT_EXPLANATION_MODE,
        STORAGE_KEYS.DEFAULT_CREATIVITY_LEVEL,
      ]);

      // Migration: Update old default explanation mode to new default
      let defaultExplanationMode = result[STORAGE_KEYS.DEFAULT_EXPLANATION_MODE];
      if (defaultExplanationMode === 'explain-like-5') {
        defaultExplanationMode = 'concise';
        // Save the migrated setting
        await chrome.storage.sync.set({ [STORAGE_KEYS.DEFAULT_EXPLANATION_MODE]: defaultExplanationMode });
      }

      const settings = {
        apiKey: result[STORAGE_KEYS.API_KEY] || DEFAULT_SETTINGS.apiKey,
        selectedModel: result[STORAGE_KEYS.SELECTED_MODEL] || DEFAULT_SETTINGS.selectedModel,
        defaultTone: result[STORAGE_KEYS.DEFAULT_TONE] || DEFAULT_SETTINGS.defaultTone,
        enableHistory: result[STORAGE_KEYS.ENABLE_HISTORY] ?? DEFAULT_SETTINGS.enableHistory,
        theme: result[STORAGE_KEYS.THEME] || DEFAULT_SETTINGS.theme,
        maxHistoryItems: DEFAULT_SETTINGS.maxHistoryItems,
        toneViewType: result[STORAGE_KEYS.TONE_VIEW_TYPE] || DEFAULT_SETTINGS.toneViewType,
        autoRephrase: result.autoRephrase ?? DEFAULT_SETTINGS.autoRephrase,
        autoExplain: result.autoExplain ?? DEFAULT_SETTINGS.autoExplain,
        enablePopover: result[STORAGE_KEYS.ENABLE_POPOVER] ?? DEFAULT_SETTINGS.enablePopover,
        popoverAutoHideTime: result[STORAGE_KEYS.POPOVER_AUTO_HIDE_TIME] ?? DEFAULT_SETTINGS.popoverAutoHideTime,
        defaultExplanationMode: defaultExplanationMode ?? DEFAULT_SETTINGS.defaultExplanationMode,
        defaultCreativityLevel: result[STORAGE_KEYS.DEFAULT_CREATIVITY_LEVEL] ?? DEFAULT_SETTINGS.defaultCreativityLevel,
      };
      

      return settings;
    } catch (error) {
      // Return default settings on error
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const storageData: Record<string, any> = {};
      
      if (settings.apiKey !== undefined) {
        storageData[STORAGE_KEYS.API_KEY] = settings.apiKey;
      }
      if (settings.selectedModel !== undefined) {
        storageData[STORAGE_KEYS.SELECTED_MODEL] = settings.selectedModel;
      }
      if (settings.defaultTone !== undefined) {
        storageData[STORAGE_KEYS.DEFAULT_TONE] = settings.defaultTone;
      }
      if (settings.enableHistory !== undefined) {
        storageData[STORAGE_KEYS.ENABLE_HISTORY] = settings.enableHistory;
      }
      if (settings.theme !== undefined) {
        storageData[STORAGE_KEYS.THEME] = settings.theme;
      }
      if (settings.toneViewType !== undefined) {
        storageData[STORAGE_KEYS.TONE_VIEW_TYPE] = settings.toneViewType;
      }
      if (settings.autoRephrase !== undefined) {
        storageData.autoRephrase = settings.autoRephrase;
      }
      if (settings.autoExplain !== undefined) {
        storageData.autoExplain = settings.autoExplain;
      }
      if (settings.enablePopover !== undefined) {
        storageData[STORAGE_KEYS.ENABLE_POPOVER] = settings.enablePopover;

      }
      if (settings.popoverAutoHideTime !== undefined) {
        storageData[STORAGE_KEYS.POPOVER_AUTO_HIDE_TIME] = settings.popoverAutoHideTime;
      }
      if (settings.defaultExplanationMode !== undefined) {
        storageData[STORAGE_KEYS.DEFAULT_EXPLANATION_MODE] = settings.defaultExplanationMode;
      }
      if (settings.defaultCreativityLevel !== undefined) {
        storageData[STORAGE_KEYS.DEFAULT_CREATIVITY_LEVEL] = settings.defaultCreativityLevel;
      }

      await chrome.storage.sync.set(storageData);
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  // History management
  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
      return result[STORAGE_KEYS.HISTORY] || [];
    } catch (error) {
      // Return empty history on error
      return [];
    }
  }

  static async addToHistory(item: Omit<HistoryItem, 'id'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };

      // Add to beginning of array
      history.unshift(newItem);

      // Keep only the latest items
      const maxItems = DEFAULT_SETTINGS.maxHistoryItems;
      if (history.length > maxItems) {
        history.splice(maxItems);
      }

      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.HISTORY);
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  static async deleteHistoryItem(itemId: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(item => item.id !== itemId);
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: filteredHistory });
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  // Temporary storage for selected text
  static async getSelectedText(): Promise<string> {
    try {
      const result = await chrome.storage.local.get('selectedText');
      return result.selectedText || '';
    } catch (error) {
      // Return empty string on error
      return '';
    }
  }

  static async setSelectedText(text: string): Promise<void> {
    try {
      await chrome.storage.local.set({ selectedText: text });
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  static async clearSelectedText(): Promise<void> {
    try {
      await chrome.storage.local.remove('selectedText');
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  // Context menu action storage
  static async getPendingAction(): Promise<any> {
    try {
      const result = await chrome.storage.local.get('pendingAction');
      return result.pendingAction || null;
    } catch (error) {
      // Return null on error
      return null;
    }
  }

  static async setPendingAction(action: any): Promise<void> {
    try {
      await chrome.storage.local.set({ pendingAction: action });
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }

  static async clearPendingAction(): Promise<void> {
    try {
      await chrome.storage.local.remove('pendingAction');
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  }
} 