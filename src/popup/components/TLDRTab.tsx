import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SessionStorage } from '@/utils/sessionStorage';
import { ExplanationPreset, CustomPreset } from '@/types';
import { EXPLANATION_PRESETS } from '@/config/constants';
import ExplanationPresetSelector from './ExplanationPresetSelector';

interface TLDRTabProps {
  onExplain: (text: string, preset?: ExplanationPreset) => Promise<string>;
  isLoading: boolean;
  selectedText: string;
  pendingAction: any;
  settings: any;
}

const TLDRTab: React.FC<TLDRTabProps> = ({
  onExplain,
  isLoading,
  selectedText,
  pendingAction,
  settings,
}) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ExplanationPreset>(() => {
    // Initialize with the default from settings, fallback to 'concise'
    const defaultPresetId = settings.defaultExplanationMode || 'concise';
    const defaultPreset = EXPLANATION_PRESETS.find(p => p.id === defaultPresetId);
    return defaultPreset || EXPLANATION_PRESETS.find(p => p.id === 'concise') || EXPLANATION_PRESETS[0];
  });
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  // @ts-ignore
  const [textFromExternalSource, setTextFromExternalSource] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load custom presets from storage
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

  // Load default preset from settings
  useEffect(() => {
    const loadDefaultPreset = () => {
      const defaultPresetId = settings.defaultExplanationMode || 'concise';
      const allPresets = [...EXPLANATION_PRESETS, ...customPresets];
      const defaultPreset = allPresets.find(p => p.id === defaultPresetId);
      if (defaultPreset) {
        setSelectedPreset(defaultPreset);
      }
    };

    loadDefaultPreset();
  }, [settings.defaultExplanationMode, customPresets]);

  // Load session data on mount
  useEffect(() => {
    // Don't load from session storage on mount - text area should be empty
    // Only handle selectedText from popover/context menu
  }, []); // Empty dependency array - run only on mount

  useEffect(() => {
    // Set text if we have selectedText
    if (selectedText) {
      setText(selectedText);
      // Store in session storage for cross-tab persistence
      SessionStorage.setTabText('tldr', selectedText);
      
      // Auto-trigger explain only if autoExplain is enabled and we have a pending action
      if (!autoTriggered && settings.autoExplain && pendingAction) {
        setAutoTriggered(true);
        setTextFromExternalSource(true); // Mark that text came from external source
        // Auto-trigger explain
        handleExplain(selectedText.trim());
      }
    }
    // Don't clear text when selectedText is empty by default - only when it actually changes
  }, [pendingAction, selectedText]);

  useEffect(() => {
    setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [text]);

  // Autofocus textarea when component mounts or when selectedText changes
  useEffect(() => {
    if (textareaRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [selectedText]); // Focus when selectedText changes

  const handleExplain = async (textToExplain: string) => {
    if (!textToExplain.trim()) return;
    
    try {
      const explanation = await onExplain(textToExplain.trim(), selectedPreset);
      setResult(explanation);
      setAutoTriggered(false);
      
      // Focus on the result area after successful explanation
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.focus();
        }
      }, 100);
    } catch (error) {
      // Error handling is done in parent component
      setAutoTriggered(false);
    }
  };

  const handleManualExplain = async () => {
    if (!text.trim()) return;
    await handleExplain(text.trim());
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // Silently handle copy errors
    }
  };

  const handleClear = () => {
    setText('');
    setResult('');
    setAutoTriggered(false);
    setTextFromExternalSource(false);
    // Clear from session storage
    SessionStorage.clearTabText('tldr');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleManualExplain();
    }
  };

  const handlePresetChange = (preset: ExplanationPreset) => {
    setSelectedPreset(preset);
  };

  const handleCustomPresetCreate = (preset: Omit<CustomPreset, 'isBuiltIn' | 'createdAt' | 'updatedAt'>) => {
    const newCustomPreset: CustomPreset = {
      ...preset,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updatedPresets = [...customPresets, newCustomPreset];
    setCustomPresets(updatedPresets);
    
    // Save to localStorage
    try {
      localStorage.setItem('explanation_custom_presets', JSON.stringify(updatedPresets));
    } catch (error) {
      // Silently handle preset saving errors
    }
  };

  const handleCustomPresetDelete = (presetId: string) => {
    const updatedPresets = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updatedPresets);
    
    // Save to localStorage
    try {
      localStorage.setItem('explanation_custom_presets', JSON.stringify(updatedPresets));
    } catch (error) {
      // Silently handle preset saving errors
    }
  };

  const handleCustomPresetUpdate = (presetId: string, updates: Partial<CustomPreset>) => {
    const updatedPresets = customPresets.map(p => 
      p.id === presetId ? { ...p, ...updates } : p
    );
    setCustomPresets(updatedPresets);
    
    // Save to localStorage
    try {
      localStorage.setItem('explanation_custom_presets', JSON.stringify(updatedPresets));
    } catch (error) {
      // Silently handle preset saving errors
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
      {/* Input Section */}
      <div className="space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Text to Explain
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {wordCount} words
            </span>
            <button
              onClick={handleClear}
              disabled={!text && !result}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Clear all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        {/* Textarea and Controls Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Textarea */}
          <div className="flex-1 min-h-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Store in session storage for cross-tab persistence
                SessionStorage.setTabText('tldr', e.target.value);
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter any word, phrase, or text to explain... (works for simple words too!)"
              className={`w-full h-full min-h-48 p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg transition-all duration-300 text-sm ${
                result 
                  ? 'border border-neutral-300 dark:border-neutral-600' 
                  : 'border-0 bg-neutral-50 dark:bg-neutral-800'
              }`}
            />
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 mt-2 rounded-b-lg">
            {/* Grouped Controls Bubble */}
            <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-full px-3 py-1.5 shadow-sm">
              {/* Preset Selector */}
              <ExplanationPresetSelector
                selectedPreset={selectedPreset}
                onPresetChange={handlePresetChange}
                customPresets={customPresets}
                onCustomPresetCreate={handleCustomPresetCreate}
                onCustomPresetDelete={handleCustomPresetDelete}
                onCustomPresetUpdate={handleCustomPresetUpdate}
              />
            </div>
            
            {/* Explain Button */}
            <button
              onClick={handleManualExplain}
              disabled={isLoading || !text.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              <Sparkles size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Explaining...' : 'Explain'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-triggered indicator */}
      {autoTriggered && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex-shrink-0">
          <div className="text-sm text-green-700 dark:text-green-300">
            ✨ Automatically explaining your selected text...
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {selectedPreset.name} Explanation
            </label>
            <button
              onClick={() => handleCopy(result)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
          
          <div 
            ref={resultRef}
            tabIndex={0}

            className="p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
          >
            <div className="text-base text-neutral-900 dark:text-neutral-100 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TLDRTab; 