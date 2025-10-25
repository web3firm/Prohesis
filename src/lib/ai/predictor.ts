// AI Prediction Service
// Generates probabilistic forecasts for prediction markets

import OpenAI from 'openai';
import { AI_CONFIG } from '../config/services';

interface PredictionRequest {
  marketId: number;
  title: string;
  description?: string;
  endTime: Date;
  category?: string;
  outcomes: string[];
  currentPools?: number[];
}

interface AIPrediction {
  marketId: number;
  predictions: {
    outcome: string;
    probability: number;
    confidence: number;
    reasoning: string;
  }[];
  analysis: string;
  dataPoints: string[];
  timestamp: Date;
  model: string;
}

class AIPredictionService {
  private openai: OpenAI | null = null;
  
  constructor() {
    if (AI_CONFIG.openai.enabled) {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.openai.apiKey,
      });
    }
  }
  
  async getPrediction(request: PredictionRequest): Promise<AIPrediction> {
    // Use mock if no API key
    if (AI_CONFIG.useMock || !this.openai) {
      return this.getMockPrediction(request);
    }
    
    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert prediction analyst. Analyze the given market and provide probabilistic forecasts with detailed reasoning. Return your response as JSON with this structure:
{
  "predictions": [
    {
      "outcome": "outcome name",
      "probability": 0.0-1.0,
      "confidence": 0.0-1.0,
      "reasoning": "explanation"
    }
  ],
  "analysis": "overall market analysis",
  "dataPoints": ["key factor 1", "key factor 2"]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.openai.temperature,
        max_tokens: AI_CONFIG.openai.maxTokens,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');
      
      const parsed = JSON.parse(content);
      
      return {
        marketId: request.marketId,
        predictions: parsed.predictions,
        analysis: parsed.analysis,
        dataPoints: parsed.dataPoints || [],
        timestamp: new Date(),
        model: AI_CONFIG.openai.model,
      };
      
    } catch (error) {
      console.error('AI Prediction Error:', error);
      // Fallback to mock on error
      return this.getMockPrediction(request);
    }
  }
  
  private buildPrompt(request: PredictionRequest): string {
    const timeRemaining = request.endTime.getTime() - Date.now();
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    
    let prompt = `Analyze this prediction market:\n\n`;
    prompt += `Title: ${request.title}\n`;
    if (request.description) prompt += `Description: ${request.description}\n`;
    if (request.category) prompt += `Category: ${request.category}\n`;
    prompt += `Time Remaining: ${daysRemaining} days\n`;
    prompt += `Outcomes: ${request.outcomes.join(', ')}\n`;
    
    if (request.currentPools && request.currentPools.length > 0) {
      const totalPool = request.currentPools.reduce((a, b) => a + b, 0);
      prompt += `\nCurrent Market Odds:\n`;
      request.outcomes.forEach((outcome, i) => {
        const pool = request.currentPools![i] || 0;
        const percentage = totalPool > 0 ? ((pool / totalPool) * 100).toFixed(1) : '0.0';
        prompt += `  - ${outcome}: ${percentage}%\n`;
      });
    }
    
    prompt += `\nProvide your expert analysis and probability estimates for each outcome.`;
    
    return prompt;
  }
  
  private getMockPrediction(request: PredictionRequest): AIPrediction {
    // Generate realistic mock predictions based on current pools or random
    const predictions = request.outcomes.map((outcome, index) => {
      // If we have current pools, bias towards them with some variation
      let baseProbability = 1 / request.outcomes.length;
      
      if (request.currentPools && request.currentPools.length > 0) {
        const totalPool = request.currentPools.reduce((a, b) => a + b, 0);
        if (totalPool > 0) {
          baseProbability = request.currentPools[index] / totalPool;
        }
      }
      
      // Add some AI "insight" variation (-10% to +10%)
      const variation = (Math.random() - 0.5) * 0.2;
      const probability = Math.max(0.05, Math.min(0.95, baseProbability + variation));
      
      // Normalize probabilities
      const confidence = 0.6 + Math.random() * 0.3; // 60-90% confidence
      
      return {
        outcome,
        probability,
        confidence,
        reasoning: this.getMockReasoning(outcome, probability, request.category),
      };
    });
    
    // Normalize probabilities to sum to 1
    const totalProb = predictions.reduce((sum, p) => sum + p.probability, 0);
    predictions.forEach(p => {
      p.probability = p.probability / totalProb;
    });
    
    return {
      marketId: request.marketId,
      predictions,
      analysis: this.getMockAnalysis(request),
      dataPoints: this.getMockDataPoints(request.category),
      timestamp: new Date(),
      model: 'mock-predictor-v1',
    };
  }
  
  // category is available for future use in mock reasoning refinement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getMockReasoning(outcome: string, probability: number, category?: string): string {
    const reasons = [
      `Historical patterns suggest ${(probability * 100).toFixed(0)}% likelihood`,
      `Market sentiment and recent trends support this outcome`,
      `Statistical analysis of similar markets indicates this probability`,
      `Current data and expert consensus align with this estimate`,
      `Fundamental analysis points to this probability range`,
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
  
  private getMockAnalysis(request: PredictionRequest): string {
    const timePhrase = this.getTimePhrase(request.endTime);
    const categoryPhrase = request.category ? ` in the ${request.category} category` : '';
    
    return `This prediction market${categoryPhrase} ${timePhrase} presents interesting dynamics. ` +
           `The current distribution suggests moderate uncertainty, with multiple viable outcomes. ` +
           `Key factors to monitor include market sentiment shifts, external events, and crowd wisdom patterns. ` +
           `Historical accuracy on similar markets has been approximately 70-75%.`;
  }
  
  private getTimePhrase(endTime: Date): string {
    const days = Math.floor((endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 1) return 'closing within 24 hours';
    if (days < 7) return `closing in ${days} days`;
    if (days < 30) return `closing in ${Math.floor(days / 7)} weeks`;
    return `closing in ${Math.floor(days / 30)} months`;
  }
  
  private getMockDataPoints(category?: string): string[] {
    const general = [
      'Market liquidity analysis',
      'Historical outcome patterns',
      'Crowd wisdom indicators',
      'Volatility assessment',
      'Risk-reward ratio',
    ];
    
    const categorySpecific: Record<string, string[]> = {
      crypto: ['On-chain metrics', 'Trading volume', 'Market cap trends'],
      sports: ['Team statistics', 'Recent performance', 'Expert predictions'],
      politics: ['Poll aggregations', 'Historical precedents', 'Current events'],
      entertainment: ['Social media sentiment', 'Industry trends', 'Expert opinions'],
    };
    
    const specific = category && categorySpecific[category.toLowerCase()] 
      ? categorySpecific[category.toLowerCase()]
      : [];
    
    return [...specific, ...general.slice(0, 3)];
  }
  
  // Store prediction in database
  async storePrediction(prediction: AIPrediction): Promise<void> {
    try {
      await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prediction),
      });
    } catch (error) {
      console.error('Failed to store AI prediction:', error);
    }
  }
  
  // Get AI accuracy statistics
  async getAIAccuracy(marketId?: number): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    averageConfidence: number;
  }> {
    try {
      const url = marketId 
        ? `/api/ai/accuracy?marketId=${marketId}`
        : '/api/ai/accuracy';
      
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('Failed to get AI accuracy:', err);
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        averageConfidence: 0,
      };
    }
  }
}

// Singleton instance
export const aiPredictor = new AIPredictionService();

// Sentiment Analysis Service
export class SentimentAnalyzer {
  async analyzeSentiment(text: string): Promise<{
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
    keywords: string[];
  }> {
    if (AI_CONFIG.useMock || !AI_CONFIG.openai.enabled) {
      return this.getMockSentiment(text);
    }
    
    // Real implementation would use OpenAI or specialized sentiment API
    return this.getMockSentiment(text);
  }
  
  private getMockSentiment(text: string): {
    score: number;
    magnitude: number;
    keywords: string[];
  } {
    // Simple keyword-based mock sentiment
    const positiveWords = ['good', 'great', 'win', 'success', 'likely', 'confident'];
    const negativeWords = ['bad', 'fail', 'unlikely', 'doubt', 'risky', 'uncertain'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positive = words.filter(w => positiveWords.some(pw => w.includes(pw))).length;
    const negative = words.filter(w => negativeWords.some(nw => w.includes(nw))).length;
    
    const score = (positive - negative) / Math.max(words.length, 1);
    const magnitude = (positive + negative) / Math.max(words.length, 1);
    
    const keywords = [...positiveWords, ...negativeWords]
      .filter(kw => text.toLowerCase().includes(kw))
      .slice(0, 5);
    
    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude: Math.min(1, magnitude * 10),
      keywords,
    };
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
