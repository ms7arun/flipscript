import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Copy, Trash2, ChevronDown, X, User, Speech, BarChart3, Scale, Palette } from 'lucide-react';
import { SessionStorage } from '../../utils/sessionStorage';
import { STORAGE_KEYS } from '../../config/constants';

interface RephraseTabProps {
  onRephrase: (text: string, tone: string, creativity: number) => Promise<string>;
  isLoading: boolean;
  selectedText: string;
  pendingAction: any;
  defaultTone: string;
  tones: any[];
  settings: any;
}

const RephraseTab: React.FC<RephraseTabProps> = ({
  onRephrase,
  isLoading,
  selectedText,
  pendingAction,
  defaultTone,
  tones,
  settings,
}) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [selectedTone, setSelectedTone] = useState(defaultTone);
  const [creativityLevel, setCreativityLevel] = useState(settings.defaultCreativityLevel || 50); // Load from settings
  const [wordCount, setWordCount] = useState(0);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [customTone, setCustomTone] = useState('');
  const [lastPresetTone, setLastPresetTone] = useState(defaultTone); // Track last selected preset
  // @ts-ignore
  const [textFromExternalSource, setTextFromExternalSource] = useState(false);
  
  // New state for unified tone selector
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [customTones, setCustomTones] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for inline controls
  const [showCreativitySlider, setShowCreativitySlider] = useState(false);
  
  // Refs for auto-scrolling
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);
  const creativityDropdownRef = useRef<HTMLDivElement>(null);

  // Add state for dropdown positioning
  const [toneDropdownPosition, setToneDropdownPosition] = useState({ top: 0, left: 0 });
  const [creativityDropdownPosition, setCreativityDropdownPosition] = useState({ top: 0, left: 0 });

  // Load custom tones from localStorage on mount
  useEffect(() => {
    const savedCustomTones = localStorage.getItem('flipscript_custom_tones');
    if (savedCustomTones) {
      setCustomTones(JSON.parse(savedCustomTones));
    }
  }, []);

  // Load creativity level from settings when settings change
  useEffect(() => {
    if (settings.defaultCreativityLevel !== undefined) {
      setCreativityLevel(settings.defaultCreativityLevel);
    }
  }, [settings.defaultCreativityLevel]);

  // Load session data on mount
  useEffect(() => {
    // Don't load from session storage on mount - text area should be empty
    // Only handle selectedText from popover/context menu
  }, []); // Empty dependency array - run only on mount

  useEffect(() => {
    if (selectedText) {
      setText(selectedText);
      // Store in session storage for cross-tab persistence
      SessionStorage.setTabText('rephrase', selectedText);
      
      // Auto-trigger rephrase only if autoRephrase is enabled and we have a pending action
      if (!autoTriggered && settings.autoRephrase && pendingAction && selectedText.trim()) {
        setAutoTriggered(true);
        setTextFromExternalSource(true); // Mark that text came from external source
        // Auto-trigger rephrase with current tone
        const toneToUse = selectedTone === 'custom' ? customTone : selectedTone;
        handleRephrase(selectedText.trim(), toneToUse, creativityLevel);
      }
    }
    // Don't clear text when selectedText is empty by default - only when it actually changes
  }, [selectedText, pendingAction, settings.autoRephrase]);

  // Initialize tone selection on mount - use default tone from settings
  useEffect(() => {
    // Always start with the default tone from settings
    setSelectedTone(defaultTone);
    setLastPresetTone(defaultTone);
    
    // Only restore custom tone if it was explicitly selected in this session
    const savedCustomTone = localStorage.getItem('flipscript_custom_tone');
    if (savedCustomTone && savedCustomTone.trim()) {
      setCustomTone(savedCustomTone);
      // Don't automatically set to custom - let user choose
    }
  }, []); // Only run on mount

  // Update selected tone when defaultTone changes (e.g., settings update)
  useEffect(() => {
    // Only update if we're not currently using a custom tone
    if (selectedTone !== 'custom') {
      setSelectedTone(defaultTone);
      setLastPresetTone(defaultTone);
    }
  }, [defaultTone]);

  // Cleanup custom tone when popup closes to prevent persistence across sessions
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear custom tone from localStorage when popup closes
      localStorage.removeItem('flipscript_custom_tone');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);





  // Autofocus textarea when component mounts or when selectedText changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current?.focus();
    }
  }, [selectedText]);

  // Update word count when text changes
  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [text]);

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneDropdownOpen(false);
        setSearchTerm('');
      }
      if (creativityDropdownRef.current && !creativityDropdownRef.current.contains(event.target as Node)) {
        setShowCreativitySlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRephrase = async (textToRephrase: string, tone: string, creativity: number) => {
    try {
      const rephrasedText = await onRephrase(textToRephrase, tone, creativity);
      setResult(rephrasedText);
      setAutoTriggered(false);
      
      // Focus on the result area after successful rephrasing
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.focus();
        }
      }, 100);
    } catch (error) {
      setAutoTriggered(false);
    }
  };

  const handleManualRephrase = async () => {
    if (!text.trim()) return;
    
    const toneToUse = selectedTone === 'custom' ? customTone : selectedTone;
    await handleRephrase(text.trim(), toneToUse, creativityLevel);
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // Silently handle copy errors
    }
  };

  const handleClear = () => {
    // Clear both result and input text
    setResult('');
    setText(''); // Add this line to clear input text
    setAutoTriggered(false);
    setTextFromExternalSource(false); // Reset external source flag
    // Clear from session storage
    SessionStorage.clearTabText('rephrase');
    // Reset tone selection to default when clearing
    setSelectedTone(defaultTone);
    setLastPresetTone(defaultTone);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleManualRephrase();
    }
  };

  // Save creativity level to settings
  const saveCreativityLevel = async (level: number) => {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEYS.DEFAULT_CREATIVITY_LEVEL]: level });
    } catch (error) {
      // Silently handle storage errors
    }
  };

  const getCreativityLabel = (value: number) => {
    if (value <= 33) return 'Factual';
    if (value <= 66) return 'Balanced';
    return 'Creative';
  };

  const getCreativityDescription = (value: number) => {
    if (value <= 33) return 'Minimal changes - grammar & clarity only';
    if (value <= 66) return 'Moderate rephrasing - synonyms & restructuring';
    return 'Maximum freedom - complete rewrites';
  };

  const getCreativityIcon = (value: number) => {
    if (value <= 33) return <BarChart3 size={16} className="text-blue-600" />;
    if (value <= 66) return <Scale size={16} className="text-green-600" />;
    return <Palette size={16} className="text-purple-600" />;
  };

  // Get current tone display name
  const getCurrentToneDisplay = () => {
    if (selectedTone === 'custom') {
      return customTone || 'Custom Tone';
    }
    const tone = tones.find(t => t.id === selectedTone);
    return tone ? tone.name : 'Select Tone';
  };

  // Get current tone icon
  const getCurrentToneIcon = () => {
    return <Speech size={16} className="text-blue-600" />;
  };

  // Handle tone selection
  const handleToneSelect = (toneId: string, toneName?: string) => {
    if (toneId === 'custom') {
      setSelectedTone('custom');
      setCustomTone(toneName || '');
      // Save custom tone to localStorage for persistence
      if (toneName) {
        localStorage.setItem('flipscript_custom_tone', toneName);
      }
      // Custom tones are now handled entirely within the dropdown
    } else {
      setSelectedTone(toneId);
      setLastPresetTone(toneId);
      // Clear custom tone from localStorage when switching to preset tone
      localStorage.removeItem('flipscript_custom_tone');
    }
    setIsToneDropdownOpen(false);
    setSearchTerm('');
  };

  // Handle adding new custom tone
  const handleAddCustomTone = () => {
    if (searchTerm.trim()) {
      const newCustomTones = [...customTones, searchTerm.trim()];
      setCustomTones(newCustomTones);
      localStorage.setItem('flipscript_custom_tones', JSON.stringify(newCustomTones));
      handleToneSelect('custom', searchTerm.trim());
      // Save the custom tone to localStorage for persistence
      localStorage.setItem('flipscript_custom_tone', searchTerm.trim());
      setSearchTerm('');
    }
  };

  // Handle deleting custom tone
  const handleDeleteCustomTone = (toneToDelete: string) => {
    const newCustomTones = customTones.filter(tone => tone !== toneToDelete);
    setCustomTones(newCustomTones);
    localStorage.setItem('flipscript_custom_tones', JSON.stringify(newCustomTones));
    
    // If we're deleting the currently selected custom tone, switch to last preset
    if (selectedTone === 'custom' && customTone === toneToDelete) {
      setSelectedTone(lastPresetTone);
      setCustomTone(''); // Clear the custom tone state
      localStorage.removeItem('flipscript_custom_tone'); // Remove the currently selected custom tone from localStorage
    }
  };

  // Filter tones based on search
  const filteredTones = tones.filter(tone => 
    tone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tone.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomTones = customTones.filter(tone => 
    tone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showAddCustomOption = searchTerm.trim() && 
    !tones.some(tone => tone.name.toLowerCase() === searchTerm.toLowerCase()) &&
    !customTones.some(tone => tone.toLowerCase() === searchTerm.toLowerCase());

  // Add function to calculate dropdown position
  const calculateDropdownPosition = (ref: React.RefObject<HTMLDivElement>, isRightAligned = false) => {
    if (!ref.current) return { top: 0, left: 0 };
    
    const rect = ref.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 240; // Approximate height of dropdown
    
    // Check if dropdown would go below viewport
    const wouldGoBelow = rect.bottom + dropdownHeight > viewportHeight;
    
    let top = wouldGoBelow ? rect.top - dropdownHeight : rect.bottom;
    let left = isRightAligned ? rect.right - 192 : rect.left; // 192px = min-w-48 (48 * 4px = 192px)
    
    // Ensure dropdown stays within viewport horizontally
    if (left + 192 > window.innerWidth) {
      left = window.innerWidth - 192 - 8; // 8px margin
    }
    if (left < 8) {
      left = 8;
    }
    
    return { top, left };
  };

  // Update dropdown positioning when opened
  const handleToneDropdownToggle = () => {
    const newIsOpen = !isToneDropdownOpen;
    setIsToneDropdownOpen(newIsOpen);
    
    if (newIsOpen) {
      const position = calculateDropdownPosition(toneDropdownRef);
      setToneDropdownPosition(position);
    }
  };

  const handleCreativityDropdownToggle = () => {
    const newIsOpen = !showCreativitySlider;
    setShowCreativitySlider(newIsOpen);
    
    if (newIsOpen) {
      const position = calculateDropdownPosition(creativityDropdownRef, true);
      setCreativityDropdownPosition(position);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Input Section */}
      <div className="space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Text to Rephrase
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
        <div className="flex flex-col">
          {/* Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Store in session storage for cross-tab persistence
                SessionStorage.setTabText('rephrase', e.target.value);
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter text to rephrase..."
              className={`w-full p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg transition-all duration-300 text-sm ${
                result 
                  ? 'min-h-32 border border-neutral-300 dark:border-neutral-600' 
                  : 'min-h-48 border-0 bg-neutral-50 dark:bg-neutral-800'
              }`}
            />
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 mt-2 rounded-b-lg">
            {/* Grouped Controls Bubble */}
            <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-full px-3 py-1.5 shadow-sm">
              {/* Tone Selector */}
              <div className="relative" ref={toneDropdownRef}>
                <button
                  onClick={handleToneDropdownToggle}
                  className="flex items-center gap-1.5 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Select tone"
                >
                  <span className="text-sm">{getCurrentToneIcon()}</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 max-w-24 truncate">
                    {getCurrentToneDisplay()}
                  </span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </button>

                {/* Tone Dropdown */}
                {isToneDropdownOpen && (
                  <div 
                    className="fixed bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-48"
                    style={{
                      top: `${toneDropdownPosition.top}px`,
                      left: `${toneDropdownPosition.left}px`
                    }}
                  >
                    {/* Search Input */}
                    <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search or Create tones..."
                        className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                        autoFocus
                      />
                    </div>

                    {/* Preset Tones */}
                    {filteredTones.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Preset Tones</div>
                        {filteredTones.map((tone) => (
                          <button
                            key={tone.id}
                            onClick={() => handleToneSelect(tone.id)}
                            className="w-full flex items-center gap-3 p-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <span className="text-lg">{tone.icon}</span>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{tone.name}</div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">{tone.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom Tones */}
                    {filteredCustomTones.length > 0 && (
                      <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Custom Tones</div>
                        {filteredCustomTones.map((tone) => (
                          <div key={tone} className="flex items-center justify-between p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                            <button
                              onClick={() => handleToneSelect('custom', tone)}
                              className="flex items-center gap-3 flex-1 text-left"
                            >
                              <User size={16} className="text-blue-600" />
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{tone}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCustomTone(tone)}
                              className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Tone Option */}
                    {showAddCustomOption && (
                      <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={handleAddCustomTone}
                          className="w-full flex items-center gap-3 p-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        >
                          <User size={16} className="text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Add "{searchTerm}"</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>

              {/* Style Selector */}
              <div className="relative" ref={creativityDropdownRef}>
                <button
                  onClick={handleCreativityDropdownToggle}
                  className="flex items-center gap-1.5 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Rephrasing style"
                >
                  {getCreativityIcon(creativityLevel)}
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {getCreativityLabel(creativityLevel)}
                  </span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </button>

                {/* Creativity Slider Dropdown */}
                {showCreativitySlider && (
                  <div 
                    className="fixed bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 p-4 w-64"
                    style={{
                      top: `${creativityDropdownPosition.top}px`,
                      left: `${creativityDropdownPosition.left}px`
                    }}
                  >
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Rephrasing Style
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                          <span>Factual</span>
                          <span>Creative</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={creativityLevel}
                          onChange={(e) => {
                            const level = Number(e.target.value);
                            setCreativityLevel(level);
                            saveCreativityLevel(level);
                          }}
                          className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center h-8 flex items-center justify-center">
                          {getCreativityDescription(creativityLevel)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Rephrase Button */}
            <button
              onClick={handleManualRephrase}
              disabled={isLoading || !text.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Rephrasing...' : 'Rephrase'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-triggered indicator */}
      {autoTriggered && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex-shrink-0">
          <div className="text-sm text-green-700 dark:text-green-300">
            ✨ Automatically rephrasing your selected text...
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Rephrased Text
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
            <div className="text-base text-neutral-900 dark:text-neutral-100 leading-relaxed prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RephraseTab; 