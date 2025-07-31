import { GroqModel, ClassifiedModel, ModelCategory, ModelCache } from '@/types';

const CACHE_KEY = 'groq_models_cache';
const CACHE_VERSION = '1.0.0';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class ModelService {
  private static instance: ModelService;
  private pendingRequests: Map<string, Promise<ClassifiedModel[]>> = new Map();

  private constructor() {}

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async getModels(apiKey: string, forceRefresh: boolean = false): Promise<ClassifiedModel[]> {
    // Create a unique key for this request
    const requestKey = `${apiKey}_${forceRefresh}`;
    
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    // Create a new promise for this request
    const requestPromise = this.executeGetModels(apiKey, forceRefresh);
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeGetModels(apiKey: string, forceRefresh: boolean = false): Promise<ClassifiedModel[]> {
    // Return cached data immediately if available and not forcing refresh
    if (!forceRefresh) {
      const cached = await this.loadFromCache();
      if (cached && this.isCacheValid(cached)) {
        return cached.models;
      }
    }

    // Fetch fresh data
    try {
      const models = await this.fetchModelsFromAPI(apiKey);
      const classifiedModels = this.classifyModels(models);
      
      // Cache the results
      await this.saveToCache(classifiedModels);
      
      return classifiedModels;
    } catch (error) {
      // If API fails, try to return cached data even if expired
      const cached = await this.loadFromCache();
      if (cached) {
        return cached.models;
      }
      throw error;
    }
  }

  private async fetchModelsFromAPI(apiKey: string): Promise<GroqModel[]> {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawModels = data.data || [];
    
    // Remove duplicates based on model ID
    const uniqueModels = this.removeDuplicateModels(rawModels);
    
    return uniqueModels;
  }

  private removeDuplicateModels(models: GroqModel[]): GroqModel[] {
    const seen = new Set<string>();
    const uniqueModels: GroqModel[] = [];
    
    for (const model of models) {
      if (!seen.has(model.id)) {
        seen.add(model.id);
        uniqueModels.push(model);
      }
    }
    
    // Sort models by ID for consistent ordering
    return uniqueModels.sort((a, b) => a.id.localeCompare(b.id));
  }

  private classifyModels(models: GroqModel[]): ClassifiedModel[] {
    return models.map(model => ({
      ...model,
      category: this.classifyModel(model),
      displayName: this.getDisplayName(model),
      description: this.getDescription(model),
    }));
  }

  private classifyModel(model: GroqModel): ModelCategory {
    const id = model.id.toLowerCase();
    
    // Identify specialized models
    if (id.includes('tts') || id.includes('text-to-speech')) {
      return 'text-to-speech';
    }
    
    if (id.includes('stt') || id.includes('speech-to-text')) {
      return 'speech-to-text';
    }
    
    if (id.includes('guard') || id.includes('safety')) {
      return 'guard-safety';
    }
    
    if (id.includes('prompt-guard')) {
      return 'guard-safety';
    }
    
    // Simple classification based on context window size
    // Chat models typically have larger context windows (>4K tokens)
    if (model.context_window >= 4000) {
      return 'chat-completion';
    }
    
    // Smaller context windows are likely legacy or specialized models
    return 'text-completion';
  }

  private getDisplayName(model: GroqModel): string {
    const id = model.id;
    
    // Extract readable names from IDs
    if (id.includes('meta-llama/')) {
      return id.replace('meta-llama/', '').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('llama3')) {
      return id.replace('llama3', 'Llama 3').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('llama-3')) {
      return id.replace('llama-3', 'Llama 3').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('gemma2')) {
      return id.replace('gemma2', 'Gemma 2').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('mixtral')) {
      return id.replace('mixtral', 'Mixtral').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('qwen/')) {
      return id.replace('qwen/', 'Qwen ').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('deepseek')) {
      return id.replace('deepseek', 'DeepSeek').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('mistral')) {
      return id.replace('mistral', 'Mistral').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    if (id.includes('moonshotai/')) {
      return id.replace('moonshotai/', '').replace(/-/g, ' ').replace(/\d+b/g, ' $&');
    }
    
    // Default: capitalize and replace dashes
    return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getDescription(model: GroqModel): string {
    const ownedBy = model.owned_by;
    const contextSize = model.context_window.toLocaleString();
    
    if (model.context_window >= 100000) {
      return `${ownedBy}'s high-capacity model with ${contextSize} context window`;
    }
    
    if (model.context_window >= 50000) {
      return `${ownedBy}'s large model with ${contextSize} context window`;
    }
    
    if (model.context_window >= 4000) {
      return `${ownedBy}'s model with ${contextSize} context window`;
    }
    
    return `${ownedBy}'s compact model with ${contextSize} context window`;
  }

  getChatCompletionModels(models: ClassifiedModel[]): ClassifiedModel[] {
    // Filter out specialized models and return only chat completion models with context window >= 4K tokens
    return models.filter(model => 
      model.context_window >= 4000 && 
      !this.isSpecializedModel(model)
    );
  }

  private isSpecializedModel(model: ClassifiedModel): boolean {
    const specializedCategories: ModelCategory[] = [
      'speech-to-text',
      'text-to-speech', 
      'guard-safety'
    ];
    
    return specializedCategories.includes(model.category);
  }

  // Helper method to get unique models by category
  getModelsByCategory(models: ClassifiedModel[], category: ModelCategory): ClassifiedModel[] {
    const categoryModels = models.filter(model => model.category === category);
    return this.removeDuplicateClassifiedModels(categoryModels);
  }

  private removeDuplicateClassifiedModels(models: ClassifiedModel[]): ClassifiedModel[] {
    const seen = new Set<string>();
    const uniqueModels: ClassifiedModel[] = [];
    
    for (const model of models) {
      if (!seen.has(model.id)) {
        seen.add(model.id);
        uniqueModels.push(model);
      }
    }
    
    // Sort by display name for better UX
    return uniqueModels.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  private async loadFromCache(): Promise<ModelCache | null> {
    try {
      const cached = await chrome.storage.local.get(CACHE_KEY);
      return cached[CACHE_KEY] || null;
    } catch (error) {
      return null;
    }
  }

  private async saveToCache(models: ClassifiedModel[]): Promise<void> {
    try {
      const cache: ModelCache = {
        models,
        lastUpdated: Date.now(),
        version: CACHE_VERSION,
      };
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
    } catch (error) {
      // Silently fail cache saving
    }
  }

  private isCacheValid(cache: ModelCache): boolean {
    const now = Date.now();
    const age = now - cache.lastUpdated;
    return age < CACHE_DURATION && cache.version === CACHE_VERSION;
  }

  async clearCache(): Promise<void> {
    try {
      await chrome.storage.local.remove(CACHE_KEY);
    } catch (error) {
      // Silently fail cache clearing
    }
  }
} 