import React, { useState, useEffect } from 'react';
import { Settings, History, RotateCcw, Lightbulb } from 'lucide-react';
import { ExtensionSettings, ExplanationPreset } from '@/types';
import { StorageService } from '@/utils/storage';
import { SessionStorage } from '@/utils/sessionStorage';
import { GroqApiService } from '@/utils/api';
import { TONES, DEFAULT_SETTINGS } from '@/config/constants';
import RephraseTab from './components/RephraseTab';
import TLDRTab from './components/TLDRTab';
import HistoryTab from './components/HistoryTab';
import SettingsModal from './components/SettingsModal';
import AnimatedHeader from './components/AnimatedHeader';
import { validateTextLength, validateTLDRText } from '@/utils/api';

type TabType = 'rephrase' | 'tldr' | 'history';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('rephrase');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [pendingAction, setPendingAction] = useState<any>(null);
  // const [lastSettingsSave, setLastSettingsSave] = useState<Date | null>(null);
  // const [showTabSaveIndicator, setShowTabSaveIndicator] = useState(false);

  useEffect(() => {
    initializePopup();
  }, []);

  // Session cleanup when popup is closed/unmounted
  useEffect(() => {
    const handleBeforeUnload = () => {
      SessionStorage.clearSession();
    };

    // Listen for window close/unload only
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup function - clear session when popup closes
      SessionStorage.clearSession();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Clear session storage on popup initialization to ensure fresh start
  useEffect(() => {
    // Clear any existing session data when popup opens
    SessionStorage.clearSession();
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const applyTheme = (theme: string) => {
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      // For light mode, ensure no dark class is present
      html.classList.remove('dark');
    } else if (theme === 'auto') {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  };

  const initializePopup = async () => {
    try {
      // Load settings
      const loadedSettings = await StorageService.getSettings();
      setSettings(loadedSettings);
      
      // Apply theme immediately after loading settings
      applyTheme(loadedSettings.theme);

      // Check for selected text from context menu or floating button
      const text = await StorageService.getSelectedText();
      const action = await StorageService.getPendingAction();

      if (text) {
        setSelectedText(text);
        
        if (action) {
          // Context menu action - set pending action and switch tabs
          setPendingAction(action);

          // Switch to appropriate tab
          if (action.type === 'rephrase') {
            setActiveTab('rephrase');
          } else if (action.type === 'tldr') {
            setActiveTab('tldr');
          }
        }
      }

      // Clear the stored text and action after loading to ensure fresh start next time
      await StorageService.clearSelectedText();
      await StorageService.clearPendingAction();
    } catch (error) {
      // Silently handle initialization errors
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRephrase = async (text: string, tone: string, creativity: number = 50): Promise<string> => {
    if (!settings.apiKey) {
      showMessage('Please add your Groq API key in Settings to use this feature', 'error');
      throw new Error('API key not configured');
    }

    const validation = validateTextLength(text);
    if (!validation.isValid) {
      showMessage(validation.error!, 'error');
      throw new Error(validation.error!);
    }

    setIsLoading(true);
    try {
      const apiService = new GroqApiService(settings.apiKey, settings.selectedModel);
      const result = await apiService.rephraseText(text, tone, creativity);

      // Add to history if enabled
      if (settings.enableHistory) {
        await StorageService.addToHistory({
          type: 'rephrase',
          originalText: text,
          resultText: result,
          tone,
          timestamp: Date.now(),
          model: settings.selectedModel,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to process your request. Please try again.';
      showMessage(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async (text: string, preset?: ExplanationPreset): Promise<string> => {
    if (!settings.apiKey) {
      showMessage('Please add your Groq API key in Settings to use this feature', 'error');
      throw new Error('API key not configured');
    }

    const validation = validateTLDRText(text);
    if (!validation.isValid) {
      showMessage(validation.error!, 'error');
      throw new Error(validation.error!);
    }

    setIsLoading(true);
    try {
      const apiService = new GroqApiService(settings.apiKey, settings.selectedModel);
      const result = await apiService.explainText(text, preset);

      // Add to history if enabled
      if (settings.enableHistory) {
        await StorageService.addToHistory({
          type: 'tldr',
          originalText: text,
          resultText: result,
          timestamp: Date.now(),
          model: settings.selectedModel,
          preset: preset?.id || settings.defaultExplanationMode,
        });
      }

      // Don't show success toast for explain to avoid hiding the result
      // showMessage('Text explained successfully!', 'success');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to process your request. Please try again.';
      showMessage(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = async (newSettings: ExtensionSettings) => {
    try {
      await StorageService.saveSettings(newSettings);
      setSettings(newSettings);
      // Don't show success message for auto-save, only show error if it fails
    } catch (error) {
      showMessage('Unable to save your settings. Please try again.', 'error');
    }
  };

  const tabs = [
    { id: 'rephrase' as const, label: 'Rephrase', icon: RotateCcw },
    { id: 'tldr' as const, label: 'Explain', icon: Lightbulb },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  const handleTabChange = (newTab: TabType) => {
    // Don't clear selectedText when switching tabs to maintain persistence
    if (newTab !== activeTab) {
      setPendingAction(null);
    }
    setActiveTab(newTab);
  };

  return (
    <div className="h-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 flex flex-col overflow-hidden">
      {/* Animated Header */}
      <div className="p-4 flex-shrink-0">
        <AnimatedHeader />
      </div>

      {/* Tabs with Settings Icon */}
      <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 flex-shrink-0 relative">
        {/* Tab Save Indicator - Removed */}
        
        {/* Tab Buttons */}
        <div className="flex flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-neutral-800'
                    : 'text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors border-l border-neutral-200 dark:border-neutral-700"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Tab Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="pb-12">
          {activeTab === 'rephrase' && (
            <RephraseTab
              onRephrase={handleRephrase}
              isLoading={isLoading}
              selectedText={selectedText}
              pendingAction={pendingAction}
              defaultTone={settings.defaultTone}
              tones={[...TONES]}
              settings={settings}
            />
          )}
          {activeTab === 'tldr' && (
            <TLDRTab
              key={`tldr-${settings.defaultExplanationMode}`}
              onExplain={handleExplain}
              isLoading={isLoading}
              selectedText={selectedText}
              pendingAction={pendingAction}
              settings={settings}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab 
              enableHistory={settings.enableHistory}
            />
          )}
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed bottom-4 left-4 right-4 p-3 rounded-lg text-sm font-medium transition-all ${
            message.type === 'success'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default Popup; 