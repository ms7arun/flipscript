import { GROQ_API_CONFIG, ERROR_MESSAGES } from '@/config/constants';
import { ExplanationPreset } from '@/types';

export class GroqApiService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  rephraseText(text: string, tone: string, creativity: number = 50): Promise<string> {
    const prompt = this.buildRephrasePrompt(text, tone, creativity);
    // Use assistant prefill to skip introductions and get direct rephrased text
    return this.makeApiCall(prompt, '');
  }

  explainText(text: string, preset?: ExplanationPreset): Promise<string> {
    const prompt = this.buildExplainPrompt(text, preset);
    // Don't use assistant prefill - let the API generate the full response
    return this.makeApiCall(prompt).then(response => this.cleanExplainResponse(response));
  }

  private buildRephrasePrompt(text: string, tone: string, creativity: number): string {
    const creativityInstructions = this.getCreativityInstructions(creativity);
    
    return `Rephrase this text in a ${tone} tone with ${creativityInstructions}. Keep the core meaning but adjust style, word choice, and sentence structure. Return ONLY the rephrased text without any explanations or prefixes:

Text: ${text}
Tone: ${tone}
Creativity Level: ${creativityInstructions}`;
  }

  private getCreativityInstructions(creativity: number): string {
    if (creativity <= 33) {
      return "minimal changes - only fix grammar, typos, and basic clarity improvements while keeping the original structure and most words intact";
    } else if (creativity <= 66) {
      return "moderate rephrasing - replace synonyms, restructure sentences for better flow, and improve readability while maintaining the original meaning";
    } else {
      return "maximum rephrasing freedom - completely rewrite the text with fresh language, varied sentence structures, and creative expression while preserving the exact same meaning";
    }
  }

  private buildExplainPrompt(text: string, preset?: ExplanationPreset): string {
    // Use the unified prompt template
    const styleDescription = preset?.styleDescription || 'briefly and to-the-point, focusing only on essential information';
    
    return `Explain "${text}" using the ${styleDescription} approach. Keep the explanation clear, helpful, and appropriate for the chosen style.

Provide your response in this exact format:

**Explanation:**
[Write the main explanation using the specified style]

**Key Points:**
* [Important point 1]
* [Important point 2]
* [Add more points if needed]

Keep explanations clear, engaging, and tailored to the chosen explanation style.`;
  }

  private cleanExplainResponse(content: string): string {
    // Remove any common prefixes that AI might add
    content = content.replace(/^(Here's|This is|The explanation|Explanation):?\s*/i, '');
    
    // Clean up any extra whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.trim();
    
    // If the response doesn't have the expected structure, format it
    if (!content.includes('**Explanation') && !content.includes('**Key Points')) {
      // Split into sentences and create a simple structure
      const sentences = content.split(/[.!?]+/).filter(s => s.trim());
      
      if (sentences.length >= 2) {
        const explanation = sentences.slice(0, 2).join('. ').trim() + '.';
        const keyPoints = sentences.slice(2).join('. ').trim();
        
        return `**Explanation:**\n${explanation}\n\n**Key Points:**\n* ${keyPoints}`;
      } else {
        return `**Explanation:**\n${content}`;
      }
    }
    
    // Ensure the response starts with Explanation if it doesn't already
    if (!content.startsWith('**Explanation:**')) {
      return `**Explanation:**\n${content}`;
    }
    
    return content;
  }

  private async makeApiCall(prompt: string, assistantPrefill?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }

    try {
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Add assistant prefill if provided to skip introductions
      if (assistantPrefill) {
        messages.push({
          role: 'assistant',
          content: assistantPrefill
        });
      }

      const requestBody = {
        model: this.model,
        messages,
        max_tokens: GROQ_API_CONFIG.MAX_TOKENS,
        temperature: GROQ_API_CONFIG.TEMPERATURE,
      };



      const response = await fetch(GROQ_API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(GROQ_API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        // Try to get the error details
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (e) {
          // Silently handle parsing errors
        }
        
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
        } else if (response.status === 429) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        } else {
          throw new Error(`API Error (${response.status}): ${errorDetails || response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
      }

      let content = data.choices[0].message.content.trim();
      
      return content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }


}

export function validateTextLength(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Please enter some text.' };
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length > 10000) {
    return { isValid: false, error: ERROR_MESSAGES.TEXT_TOO_LONG };
  }

  return { isValid: true };
}

export function validateTLDRText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Please enter some text.' };
  }

  return { isValid: true };
} 