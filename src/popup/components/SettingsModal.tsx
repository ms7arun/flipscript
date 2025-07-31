import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, User, ChevronDown } from 'lucide-react';
import { ExtensionSettings, CustomPreset } from '@/types';
import { TONES, EXPLANATION_PRESETS } from '@/config/constants';
import DynamicModelSelector from './DynamicModelSelector';
import CollapsibleSection from './CollapsibleSection';

interface SettingsModalProps {
  settings: ExtensionSettings;
  onSave: (settings: ExtensionSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<ExtensionSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customTones, setCustomTones] = useState<string[]>([]);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isExplanationDropdownOpen, setIsExplanationDropdownOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const toneDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const explanationDropdownRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load custom tones from localStorage
  useEffect(() => {
    const savedCustomTones = localStorage.getItem('flipscript_custom_tones');
    if (savedCustomTones) {
      setCustomTones(JSON.parse(savedCustomTones));
    }
  }, []);

  // Load custom explanation presets from localStorage
  useEffect(() => {
    const loadCustomPresets = async () => {
      try {
        const stored = localStorage.getItem('explanation_custom_presets');
        if (stored) {
          setCustomPresets(JSON.parse(stored));
        }
          } catch (error) {
      // Silently handle preset loading errors
    }
    };

    loadCustomPresets();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
      if (explanationDropdownRef.current && !explanationDropdownRef.current.contains(event.target as Node)) {
        setIsExplanationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-save functionality with debouncing
  const debouncedSave = useCallback(async (newSettings: ExtensionSettings) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(newSettings);
      } catch (error) {
        // Silently handle auto-save errors
      }
    }, 1000); // 1 second delay
  }, [onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (field: keyof ExtensionSettings, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    

    
    // Trigger auto-save
    debouncedSave(newFormData);
  };





  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-save is handled by debouncedSave, so we just close
    onClose();
  };



  const selectedTone = TONES.find(t => t.id === formData.defaultTone);
  const allPresets = [...EXPLANATION_PRESETS, ...customPresets];
  const selectedExplanationPreset = allPresets.find(p => p.id === formData.defaultExplanationMode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Configuration Group */}
            <CollapsibleSection title="API Configuration" defaultExpanded={true}>
              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="w-full p-3 pr-10 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                    placeholder="Enter your Groq API key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Don't have an API key? Get one for free by signing up on the{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Groq Console
                  </a>
                </p>
              </div>

                             {/* Model Selection */}
               <DynamicModelSelector
                 selectedModelId={formData.selectedModel}
                 onModelSelect={(modelId) => handleInputChange('selectedModel', modelId)}
                 apiKey={formData.apiKey}
               />
            </CollapsibleSection>

            {/* General Settings Group */}
            <CollapsibleSection title="General Settings" defaultExpanded={true}>
              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Theme
                </label>
                <div className="relative" ref={themeDropdownRef}>
                                      <button
                      type="button"
                      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                      className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-between"
                    >
                    <span>
                      {formData.theme === 'light' && 'Light'}
                      {formData.theme === 'dark' && 'Dark'}
                      {formData.theme === 'auto' && 'Auto (System)'}
                    </span>
                    <ChevronDown size={16} className="text-neutral-400" />
                  </button>
                  
                  {isThemeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('theme', 'light');
                          setIsThemeDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('theme', 'dark');
                          setIsThemeDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('theme', 'auto');
                          setIsThemeDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Auto (System)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Enable History */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableHistory}
                    onChange={(e) => handleInputChange('enableHistory', e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Enable History
                  </span>
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Save your rephrase and explain history for future reference
                </p>
              </div>

              {/* Enable Popover */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enablePopover}
                    onChange={(e) => handleInputChange('enablePopover', e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Enable Popover
                  </span>
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Show popover when text is selected on web pages
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Note: In some systems, you may need to refresh the page or extension for popover settings to take effect.
                </p>
              </div>

              {/* Auto Hide Time - Only visible when popover is enabled */}
              {formData.enablePopover && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Auto Hide Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.popoverAutoHideTime / 1000}
                    onChange={(e) => handleInputChange('popoverAutoHideTime', parseInt(e.target.value) * 1000)}
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Time before popover automatically hides (1-30 seconds)
                  </p>
                </div>
              )}
            </CollapsibleSection>

            {/* Rephrase Settings Group */}
            <CollapsibleSection title="Rephrase" defaultExpanded={true}>
              {/* Default Tone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default Tone
                </label>
                <div className="relative" ref={toneDropdownRef}>
                                      <button
                      type="button"
                      onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
                      className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-between"
                    >
                    <span className="flex items-center gap-2">
                      {formData.defaultTone.startsWith('custom-') ? (
                        <>
                          <span>👤</span>
                          <span>{formData.defaultTone.replace('custom-', '')}</span>
                        </>
                      ) : (
                        <>
                          <span>{TONES.find(t => t.id === formData.defaultTone)?.icon}</span>
                          <span>{TONES.find(t => t.id === formData.defaultTone)?.name}</span>
                        </>
                      )}
                    </span>
                    <ChevronDown size={16} className="text-neutral-400" />
                  </button>
                  
                  {isToneDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                      {/* Preset Tones */}
                      {TONES.map((tone) => (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('defaultTone', tone.id);
                            setIsToneDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <span className="text-lg">{tone.icon}</span>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{tone.name}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{tone.description}</div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Custom Tones */}
                      {customTones.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700">
                            Custom Tones
                          </div>
                          {customTones.map((tone) => (
                            <button
                              key={`custom-${tone}`}
                              type="button"
                              onClick={() => {
                                handleInputChange('defaultTone', `custom-${tone}`);
                                setIsToneDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                              <User size={16} className="text-blue-600" />
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{tone}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {selectedTone && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedTone.description}
                  </p>
                )}
              </div>

              {/* Auto Rephrase */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.autoRephrase}
                    onChange={(e) => handleInputChange('autoRephrase', e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Auto Rephrase
                  </span>
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Automatically rephrase text when selected from context menu or popover
                </p>
              </div>

              {/* Default Creativity Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default Creativity Level
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>Factual</span>
                    <span>Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.defaultCreativityLevel}
                    onChange={(e) => handleInputChange('defaultCreativityLevel', Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                    {formData.defaultCreativityLevel <= 33 ? 'Factual - Minimal changes' :
                     formData.defaultCreativityLevel <= 66 ? 'Balanced - Moderate rephrasing' :
                     'Creative - Maximum freedom'}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Explain Settings Group */}
            <CollapsibleSection title="Explain" defaultExpanded={true}>
              {/* Default Explanation Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default Explanation Mode
                </label>
                <div className="relative" ref={explanationDropdownRef}>
                                      <button
                      type="button"
                      onClick={() => setIsExplanationDropdownOpen(!isExplanationDropdownOpen)}
                      className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-between"
                    >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{selectedExplanationPreset?.icon}</span>
                      <span>{selectedExplanationPreset?.name}</span>
                    </span>
                    <ChevronDown size={16} className="text-neutral-400" />
                  </button>
                  
                  {isExplanationDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                      {/* Built-in Presets */}
                      {EXPLANATION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('defaultExplanationMode', preset.id);
                            setIsExplanationDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <span className="text-lg">{preset.icon}</span>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{preset.name}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{preset.description}</div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Custom Presets */}
                      {customPresets.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700">
                            Custom Presets
                          </div>
                          {customPresets.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('defaultExplanationMode', preset.id);
                                setIsExplanationDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                              <span className="text-lg">{preset.icon}</span>
                              <div className="flex-1">
                                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{preset.name}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">{preset.description}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {selectedExplanationPreset && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedExplanationPreset.description}
                  </p>
                )}
              </div>

              {/* Auto Explain */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.autoExplain}
                    onChange={(e) => handleInputChange('autoExplain', e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Auto Explain
                  </span>
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Automatically explain text when selected from context menu
                </p>
              </div>
            </CollapsibleSection>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 