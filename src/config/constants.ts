// Groq API Configuration
export const GROQ_API_CONFIG = {
  BASE_URL: 'https://api.groq.com/openai/v1/chat/completions',
  DEFAULT_MODEL: 'llama3-70b-8192',
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000, // 30 seconds
} as const;

// Explanation Presets
export const EXPLANATION_PRESETS = [
  {
    id: 'explain-like-5',
    name: 'Explain Like I\'m 5',
    description: 'Simple, childlike explanations using basic words',
    icon: '👶',
    styleDescription: 'like you\'re talking to a 5-year-old child with simple words and fun examples',
    isBuiltIn: true,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Comprehensive, in-depth explanations covering all aspects',
    icon: '📚',
    styleDescription: 'in comprehensive detail covering all important aspects and nuances',
    isBuiltIn: true,
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Brief, to-the-point explanations with essential points only',
    icon: '⚡',
    styleDescription: 'briefly and to-the-point, focusing only on essential information',
    isBuiltIn: true,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Expert-level explanations with proper terminology',
    icon: '🔬',
    styleDescription: 'using technical terminology and expert-level detail',
    isBuiltIn: true,
  },
  {
    id: 'example-based',
    name: 'Example-Based',
    description: 'Explanations using multiple concrete examples',
    icon: '💡',
    styleDescription: 'through multiple concrete examples and real-world scenarios',
    isBuiltIn: true,
  },
  {
    id: 'step-by-step',
    name: 'Step-by-Step',
    description: 'Sequential, process-oriented breakdowns',
    icon: '📋',
    styleDescription: 'by breaking it down into clear, sequential steps',
    isBuiltIn: true,
  },
  {
    id: 'laymans-terms',
    name: 'Layman\'s Terms',
    description: 'Simple everyday language, no jargon',
    icon: '🗣️',
    styleDescription: 'using simple, everyday language avoiding jargon',
    isBuiltIn: true,
  },
  {
    id: 'summary',
    name: 'Summary',
    description: 'Key points and main takeaways format',
    icon: '📝',
    styleDescription: 'as a summary highlighting key points and main takeaways',
    isBuiltIn: true,
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast',
    description: 'Comparative analysis with similar concepts',
    icon: '⚖️',
    styleDescription: 'by comparing and contrasting with similar concepts',
    isBuiltIn: true,
  },
  {
    id: 'visual-explanation',
    name: 'Visual Explanation',
    description: 'Descriptive, imagery-focused explanations',
    icon: '🎨',
    styleDescription: 'using visual descriptions and imagery to help visualize',
    isBuiltIn: true,
  },
  {
    id: 'practical-use-case',
    name: 'Practical Use Case',
    description: 'Real-world applications and everyday uses',
    icon: '🛠️',
    styleDescription: 'focusing on real-world applications and practical uses',
    isBuiltIn: true,
  },
  {
    id: 'history-origin',
    name: 'History / Origin',
    description: 'Historical context and development timeline',
    icon: '📜',
    styleDescription: 'by covering the historical context and development over time',
    isBuiltIn: true,
  },
  {
    id: 'common-misconceptions',
    name: 'Common Misconceptions',
    description: 'Addresses myths and misunderstandings',
    icon: '❌',
    styleDescription: 'while addressing common myths and misconceptions',
    isBuiltIn: true,
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Narrative-style explanations with story structure',
    icon: '📖',
    styleDescription: 'through a narrative story structure with engaging elements',
    isBuiltIn: true,
  },
  {
    id: 'analogy-based',
    name: 'Analogy-Based',
    description: 'Explanations using metaphors and familiar comparisons',
    icon: '🔗',
    styleDescription: 'using analogies and metaphors to familiar concepts',
    isBuiltIn: true,
  },
] as const;

// Tone Definitions
export const TONES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, business-appropriate',
    icon: '💼'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed, conversational',
    icon: '😊'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable',
    icon: '🤝'
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Academic, official',
    icon: '📚'
  },
  {
    id: 'funny',
    name: 'Funny',
    description: 'Humorous, light-hearted',
    icon: '😄'
  },
  {
    id: 'confident',
    name: 'Confident',
    description: 'Assertive, strong',
    icon: '💪'
  },
  {
    id: 'polite',
    name: 'Polite',
    description: 'Courteous, respectful',
    icon: '🙏'
  },
  {
    id: 'direct',
    name: 'Direct',
    description: 'Straightforward, concise',
    icon: '🎯'
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    description: 'Energetic, excited',
    icon: '🚀'
  },
  {
    id: 'diplomatic',
    name: 'Diplomatic',
    description: 'Tactful, balanced',
    icon: '⚖️'
  },
  {
    id: 'persuasive',
    name: 'Persuasive',
    description: 'Convincing, compelling',
    icon: '💡'
  },
  {
    id: 'apologetic',
    name: 'Apologetic',
    description: 'Regretful, sorry tone',
    icon: '😔'
  }
] as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  apiKey: '',
  selectedModel: GROQ_API_CONFIG.DEFAULT_MODEL,
  defaultTone: 'professional',
  enableHistory: true,
  theme: 'light' as const,
  maxHistoryItems: 10,
  maxTextLength: 10000,
  toneViewType: 'tiles' as const,
  autoRephrase: true,
  autoExplain: true,
  enablePopover: true, // Start enabled by default
  popoverAutoHideTime: 5000, // 5 seconds default
  defaultExplanationMode: 'concise', // Default to "Concise"
  defaultCreativityLevel: 50, // Default to "Balanced" (50)
};

// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: 'groq_api_key',
  SELECTED_MODEL: 'selected_model',
  DEFAULT_TONE: 'default_tone',
  ENABLE_HISTORY: 'enable_history',
  THEME: 'theme',
  TONE_VIEW_TYPE: 'tone_view_type',
  ENABLE_POPOVER: 'enablePopover',
  POPOVER_AUTO_HIDE_TIME: 'popoverAutoHideTime',
  DEFAULT_EXPLANATION_MODE: 'defaultExplanationMode',
  DEFAULT_CREATIVITY_LEVEL: 'defaultCreativityLevel',
  HISTORY: 'history',
  SETTINGS: 'settings',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_API_KEY: 'Please enter your Groq API key in settings',
  INVALID_API_KEY: 'Invalid API key. Please check your key and try again',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  RATE_LIMIT: 'Rate limit exceeded. Please wait a moment and try again',
  TEXT_TOO_LONG: 'Text is too long. Please keep it under 10,000 characters',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
  API_ERROR: 'API error. Please check your API key and try again'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  COPIED: 'Text copied to clipboard!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  HISTORY_CLEARED: 'History cleared successfully!'
} as const;

// UI Constants
export const UI_CONSTANTS = {
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
  ANIMATION_DURATION: 300
} as const; 