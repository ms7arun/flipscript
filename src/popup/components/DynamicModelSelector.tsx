import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { ClassifiedModel } from '@/types';
import { ModelService } from '@/services/ModelService';

interface DynamicModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  apiKey: string;
  disabled?: boolean;
}

const DynamicModelSelector: React.FC<DynamicModelSelectorProps> = ({
  selectedModelId,
  onModelSelect,
  apiKey,
  disabled = false
}) => {
  const [models, setModels] = useState<ClassifiedModel[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const modelService = ModelService.getInstance();

  useEffect(() => {
    if (apiKey) {
      loadModels();
    }
  }, [apiKey]);

  const loadModels = async (forceRefresh: boolean = false) => {
    if (!apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const allModels = await modelService.getModels(apiKey, forceRefresh);
      const chatModels = modelService.getChatCompletionModels(allModels);
      setModels(chatModels);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadModels(true);
  };

  const selectedModel = models.find(model => model.id === selectedModelId);

  const getModelCategory = (model: ClassifiedModel) => {
    if (model.context_window > 100000) return 'High Capacity';
    if (model.context_window > 50000) return 'Balanced';
    return 'Standard';
  };

  const getModelCategoryColor = (model: ClassifiedModel) => {
    if (model.context_window > 100000) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    if (model.context_window > 50000) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    return 'text-neutral-600 bg-neutral-50 dark:bg-neutral-700';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (!apiKey) {
    return (
      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
        <AlertCircle size={20} className="mx-auto mb-2" />
        <p className="text-sm">Enter your API key to load available models</p>
        <p className="text-xs mt-1">
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
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          AI Model
        </label>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || disabled}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {isExpanded ? 'Hide' : 'Change'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Selected Model Summary */}
      {selectedModel && (
        <div className="p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{selectedModel.displayName}</span>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Selected
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span className={`px-2 py-0.5 rounded ${getModelCategoryColor(selectedModel)}`}>
              {getModelCategory(selectedModel)}
            </span>
            <span>{selectedModel.owned_by}</span>
            <span>{formatNumber(selectedModel.context_window)} context</span>
            <span>{formatNumber(selectedModel.max_completion_tokens)} max tokens</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading models...</p>
        </div>
      )}

      {/* Model List */}
      {isExpanded && !isLoading && models.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto border border-neutral-200 dark:border-neutral-600 rounded-lg p-2">
          {models.map((model) => {
            const isSelected = model.id === selectedModelId;
            const category = getModelCategory(model);
            const categoryColor = getModelCategoryColor(model);
            
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onModelSelect(model.id)}
                disabled={disabled}
                className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{model.displayName}</span>
                      {isSelected && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                      <span className={`px-2 py-0.5 rounded ${categoryColor}`}>
                        {category}
                      </span>
                      <span>{model.owned_by}</span>
                      <span>{formatNumber(model.context_window)} context</span>
                      <span>{formatNumber(model.max_completion_tokens)} max tokens</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && !isLoading && models.length === 0 && !error && (
        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
          <AlertCircle size={20} className="mx-auto mb-2" />
          <p className="text-sm">No chat completion models found</p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Choose a model based on your needs. Higher context windows allow longer conversations, while speed indicators show processing speed.
      </p>
    </div>
  );
};

export default DynamicModelSelector; 