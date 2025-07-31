import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react';
import { ExplanationPreset, CustomPreset } from '@/types';
import { EXPLANATION_PRESETS } from '@/config/constants';

interface ExplanationPresetSelectorProps {
  selectedPreset: ExplanationPreset;
  onPresetChange: (preset: ExplanationPreset) => void;
  customPresets: CustomPreset[];
  onCustomPresetCreate: (preset: Omit<CustomPreset, 'isBuiltIn' | 'createdAt' | 'updatedAt'>) => void;
  onCustomPresetDelete: (presetId: string) => void;
  onCustomPresetUpdate: (presetId: string, updates: Partial<CustomPreset>) => void;
}

const ExplanationPresetSelector: React.FC<ExplanationPresetSelectorProps> = ({
  selectedPreset,
  onPresetChange,
  customPresets,
  onCustomPresetCreate,
  onCustomPresetDelete,
  onCustomPresetUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);
  const [newPreset, setNewPreset] = useState({
    name: '',
    icon: '✏️', // Default to user-pen icon for custom presets
    styleDescription: '',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Combine built-in and custom presets
  const allPresets = [...EXPLANATION_PRESETS, ...customPresets];

  // Filter presets based on search query
  const filteredPresets = allPresets.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (preset.description && preset.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePresetSelect = (preset: ExplanationPreset) => {
    onPresetChange(preset);
    setIsExpanded(false);
    setSearchQuery('');
  };

  const handleCreatePreset = () => {
    if (newPreset.name && newPreset.styleDescription) {
      onCustomPresetCreate({
        id: `custom-${Date.now()}`,
        ...newPreset,
      });
      setNewPreset({ name: '', icon: '✏️', styleDescription: '' });
      setShowCreateModal(false);
    }
  };

  const handleUpdatePreset = () => {
    if (editingPreset && newPreset.name && newPreset.styleDescription) {
      onCustomPresetUpdate(editingPreset.id, {
        name: newPreset.name,
        icon: newPreset.icon,
        styleDescription: newPreset.styleDescription,
        updatedAt: Date.now(),
      });
      setEditingPreset(null);
      setNewPreset({ name: '', icon: '✏️', styleDescription: '' });
      setShowCreateModal(false);
    }
  };

  const handleDeletePreset = (preset: CustomPreset) => {
    onCustomPresetDelete(preset.id);
  };

  const openEditModal = (preset: CustomPreset) => {
    setEditingPreset(preset);
    setNewPreset({
      name: preset.name,
      icon: preset.icon,
      styleDescription: preset.styleDescription,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPreset(null);
    setNewPreset({ name: '', icon: '✏️', styleDescription: '' });
  };

  const calculateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 240; // Approximate height of dropdown
      
      // Check if dropdown would go below viewport
      const wouldGoBelow = rect.bottom + dropdownHeight > viewportHeight;
      
      let top = wouldGoBelow ? rect.top - dropdownHeight : rect.bottom + 5;
      let left = rect.left;
      
      // Ensure dropdown stays within viewport horizontally
      if (left + 192 > window.innerWidth) {
        left = window.innerWidth - 192 - 8; // 8px margin
      }
      if (left < 8) {
        left = 8;
      }
      
      setDropdownPosition({ top, left });
    }
  };

  const handleDropdownToggle = () => {
    if (!isExpanded) {
      calculateDropdownPosition();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Preset Selector Button */}
      <button
        onClick={handleDropdownToggle}
        className="flex items-center gap-1.5 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title="Select explanation style"
      >
        <span className="text-sm">{selectedPreset.icon}</span>
        <span className="font-medium text-neutral-700 dark:text-neutral-300 max-w-24 truncate">
          {selectedPreset.name}
        </span>
        {isExpanded ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
      </button>

      {/* Expanded Preset Selector */}
      {isExpanded && (
        <div 
          className="fixed bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-48"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
            <input
              type="text"
              placeholder="Search or Add presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
              autoFocus
            />
          </div>

          {/* Preset List */}
          <div>
            {filteredPresets.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Explanation Styles</div>
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full flex items-center gap-3 p-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{preset.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{preset.description}</div>
                    </div>
                    {!preset.isBuiltIn && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(preset as CustomPreset);
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset as CustomPreset);
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                No presets found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Create Custom Preset Button */}
          <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Create Custom Preset
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Preset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {editingPreset ? 'Edit Custom Preset' : 'Create Custom Preset'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="w-full p-2 border border-neutral-200 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="My Custom Preset"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Style Description
                </label>
                <textarea
                  value={newPreset.styleDescription}
                  onChange={(e) => setNewPreset({ ...newPreset, styleDescription: e.target.value })}
                  className="w-full p-2 border border-neutral-200 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="Describe how this preset should explain things (e.g., 'using simple analogies and everyday examples')"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2 px-4 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingPreset ? handleUpdatePreset : handleCreatePreset}
                disabled={!newPreset.name || !newPreset.styleDescription}
                className="flex-1 py-2 px-4 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingPreset ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplanationPresetSelector; 