import React, { useState, useEffect } from 'react';
import { History, Trash2, Copy, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HistoryItem } from '@/types';
import { StorageService } from '@/utils/storage';
import { EXPLANATION_PRESETS } from '@/config/constants';

interface HistoryTabProps {
  enableHistory: boolean;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ enableHistory }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customPresets, setCustomPresets] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
    loadCustomPresets();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await StorageService.getHistory();
      setHistory(history);
      setIsLoading(false);
    } catch (error) {
      // Silently handle history loading errors
      setHistory([]);
      setIsLoading(false);
    }
  };

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

  const getPresetInfo = (presetId: string) => {
    const allPresets = [...EXPLANATION_PRESETS, ...customPresets];
    return allPresets.find(p => p.id === presetId);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await StorageService.deleteHistoryItem(itemId);
      await loadHistory();
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  };

  const handleClearHistory = async () => {
    try {
      await StorageService.clearHistory();
      setHistory([]);
    } catch (error) {
      // Re-throw error for user notification
      throw error;
    }
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // Silently handle copy errors
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'rephrase' ? '🔄' : '💡';
  };

  const getTypeLabel = (type: string) => {
    return type === 'rephrase' ? 'Rephrase' : 'Explain';
  };

  if (!enableHistory) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <History size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          History Disabled
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enable history in settings to see your previous rephrases and TL;DR explanations.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <History size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No History Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your rephrases and TL;DR explanations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          History ({history.length})
        </h3>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getTypeLabel(item.type)}
                </span>
                {item.tone && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                    {item.tone}
                  </span>
                )}
                {item.preset && item.type === 'tldr' && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                    {getPresetInfo(item.preset)?.name || 'Custom Preset'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDate(item.timestamp)}
                </span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {item.originalText.length > 100
                    ? `${item.originalText.substring(0, 100)}...`
                    : item.originalText}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Result</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded prose prose-sm dark:prose-invert max-w-none">
                  {item.type === 'tldr' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.resultText.length > 200
                        ? `${item.resultText.substring(0, 200)}...`
                        : item.resultText}
                    </ReactMarkdown>
                  ) : (
                    <div>
                      {item.resultText.length > 100
                        ? `${item.resultText.substring(0, 100)}...`
                        : item.resultText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleCopy(item.originalText)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <Copy size={10} />
                Copy Original
              </button>
              <button
                onClick={() => handleCopy(item.resultText)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <Copy size={10} />
                Copy Result
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTab; 