// Groq API Types
export interface GroqModel {
  id: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: string;
}

export interface GroqApiRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface GroqApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Explanation Preset Types
export interface ExplanationPreset {
  id: string;
  name: string;
  description?: string; // Optional for custom presets
  icon: string;
  styleDescription: string;
  isBuiltIn: boolean;
}

export interface CustomPreset extends ExplanationPreset {
  isBuiltIn: false;
  createdAt: number;
  updatedAt: number;
}

// Extension Settings
export interface ExtensionSettings {
  apiKey: string;
  selectedModel: string;
  defaultTone: string;
  enableHistory: boolean;
  theme: 'light' | 'dark' | 'auto';
  maxHistoryItems: number;
  toneViewType: 'tiles' | 'list' | 'compact';
  autoRephrase: boolean;
  autoExplain: boolean;
  enablePopover: boolean;
  popoverAutoHideTime: number;
  defaultExplanationMode: string; // ID of the default explanation preset
  defaultCreativityLevel: number; // Default creativity level for rephrasing (0-100)
}

// Tone Types
export interface Tone {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// History Types
export interface HistoryItem {
  id: string;
  type: 'rephrase' | 'tldr';
  originalText: string;
  resultText: string;
  tone?: string;
  preset?: string; // ID of the preset used for explanation
  timestamp: number;
  model: string;
}

// UI Types
export interface RephraseResult {
  originalText: string;
  rephrasedText: string;
  tone: string;
  model: string;
}

export interface GrammarResult {
  originalText: string;
  correctedText: string;
  model: string;
}

// Content Script Types
export interface ContentScriptMessage {
  action: 'getSelectedText' | 'rephraseText' | 'checkGrammar';
  text?: string;
  tone?: string;
}

export interface BackgroundMessage {
  action: 'selectedText' | 'openPopup' | 'rephrase' | 'grammar';
  text?: string;
  tone?: string;
}

// Context Menu Types
export interface ContextMenuAction {
  type: 'rephrase' | 'grammar';
  tone?: string;
}

// Dynamic Model Types
export interface GroqModel {
  id: string;
  owned_by: string;
  context_window: number;
  max_completion_tokens: number;
}

export interface ClassifiedModel extends GroqModel {
  category: ModelCategory;
  displayName: string;
  description: string;
}

export type ModelCategory = 
  | 'chat-completion'
  | 'text-completion' 
  | 'speech-to-text'
  | 'text-to-speech'
  | 'guard-safety'
  | 'other';

export interface ModelCache {
  models: ClassifiedModel[];
  lastUpdated: number;
  version: string;
} 