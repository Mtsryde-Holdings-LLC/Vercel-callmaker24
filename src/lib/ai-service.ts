// AI Service - Abstraction layer for AI providers
// Supports OpenAI, Anthropic, or any provider via env config

interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'azure-openai';
  apiKey: string;
  model: string;
  endpoint?: string;
}

interface GenerateContentParams {
  brandContext: {
    name: string;
    voice: any;
    targetAudience: string;
    description?: string;
  };
  platform: string;
  goal: string;
  contentPillar?: string;
  productInfo?: string;
  campaignTheme?: string;
  numberOfVariations?: number;
}

interface RepurposeContentParams {
  sourceText: string;
  targetPlatform: string;
  targetFormat: string;
  brandVoice?: any;
}

class AIService {
  private config: AIProviderConfig;

  constructor() {
    this.config = {
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4',
      endpoint: process.env.AI_ENDPOINT,
    };
  }

  async generatePosts(params: GenerateContentParams): Promise<any[]> {
    const prompt = this.buildPostGenerationPrompt(params);

    try {
      const response = await this.callAIProvider(prompt, {
        temperature: 0.8,
        maxTokens: 2000,
      });

      return this.parsePostsFromResponse(response, params.platform);
    } catch (error) {
      console.error('[AI Service] Generation error:', error);
      throw new Error('Failed to generate posts');
    }
  }

  async repurposeContent(params: RepurposeContentParams): Promise<string> {
    const prompt = this.buildRepurposePrompt(params);

    try {
      const response = await this.callAIProvider(prompt, {
        temperature: 0.7,
        maxTokens: 1500,
      });

      return response.trim();
    } catch (error) {
      console.error('[AI Service] Repurpose error:', error);
      throw new Error('Failed to repurpose content');
    }
  }

  async generateIdeas(params: {
    brandContext: any;
    numberOfIdeas: number;
    timeframe: string;
    contentPillars?: string[];
  }): Promise<any[]> {
    const prompt = this.buildIdeaGenerationPrompt(params);

    try {
      const response = await this.callAIProvider(prompt, {
        temperature: 0.9,
        maxTokens: 2500,
      });

      return this.parseIdeasFromResponse(response);
    } catch (error) {
      console.error('[AI Service] Idea generation error:', error);
      throw new Error('Failed to generate ideas');
    }
  }

  private buildPostGenerationPrompt(params: GenerateContentParams): string {
    const { brandContext, platform, goal, contentPillar, numberOfVariations = 3 } = params;

    return `You are a professional social media content creator. Generate ${numberOfVariations} social media post variations for the following brand:

Brand: ${brandContext.name}
Description: ${brandContext.description || 'N/A'}
Target Audience: ${brandContext.targetAudience}
Brand Voice: ${JSON.stringify(brandContext.voice, null, 2)}

Platform: ${platform}
Goal: ${goal}
Content Pillar: ${contentPillar || 'General'}
${params.productInfo ? `Product/Service: ${params.productInfo}` : ''}
${params.campaignTheme ? `Campaign Theme: ${params.campaignTheme}` : ''}

For each variation, provide:
1. A compelling caption (appropriate length for ${platform})
2. Relevant hashtags (5-10 hashtags)
3. Content type suggestion (single post, carousel, video, etc.)
4. Brief media description (what image/video should accompany this post)

Format your response as a JSON array with this structure:
[
  {
    "caption": "...",
    "hashtags": ["tag1", "tag2", ...],
    "contentType": "SINGLE_POST|CAROUSEL|VIDEO|STORY",
    "mediaDescription": "..."
  }
]`;
  }

  private buildRepurposePrompt(params: RepurposeContentParams): string {
    return `Repurpose the following content for ${params.targetPlatform} as a ${params.targetFormat}:

Original Content:
${params.sourceText}

${params.brandVoice ? `Brand Voice Guidelines: ${JSON.stringify(params.brandVoice)}` : ''}

Requirements:
- Adapt the tone and length for ${params.targetPlatform}
- Format: ${params.targetFormat}
- Keep the core message but optimize for the platform
- Include appropriate hashtags if applicable

Provide ONLY the repurposed content, no explanations.`;
  }

  private buildIdeaGenerationPrompt(params: any): string {
    return `Generate ${params.numberOfIdeas} content ideas for the following brand over the next ${params.timeframe}:

Brand Information:
${JSON.stringify(params.brandContext, null, 2)}

${params.contentPillars?.length ? `Content Pillars: ${params.contentPillars.join(', ')}` : ''}

For each idea, provide:
1. Title (catchy and specific)
2. Brief description (2-3 sentences)
3. Content pillar category
4. Suggested platforms (array)
5. Best posting time/context

Format as JSON array:
[
  {
    "title": "...",
    "description": "...",
    "pillar": "...",
    "platforms": ["INSTAGRAM", "FACEBOOK"],
    "bestTime": "..."
  }
]`;
  }

  private async callAIProvider(prompt: string, options: any): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt, options);
      case 'anthropic':
        return this.callAnthropic(prompt, options);
      case 'azure-openai':
        return this.callAzureOpenAI(prompt, options);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(prompt: string, options: any): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string, options: any): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callAzureOpenAI(prompt: string, options: any): Promise<string> {
    if (!this.config.endpoint) {
      throw new Error('Azure OpenAI endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Azure OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parsePostsFromResponse(response: string, platform: string): any[] {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      
      const posts = JSON.parse(jsonString);
      
      return Array.isArray(posts) ? posts : [posts];
    } catch (error) {
      console.error('[AI Service] Failed to parse posts:', error);
      // Fallback: return empty array
      return [];
    }
  }

  private parseIdeasFromResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      
      const ideas = JSON.parse(jsonString);
      
      return Array.isArray(ideas) ? ideas : [ideas];
    } catch (error) {
      console.error('[AI Service] Failed to parse ideas:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
