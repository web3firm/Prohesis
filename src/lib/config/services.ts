// AI Prediction Service Configuration
// Supports: OpenAI, Anthropic, Hugging Face, Local Models

export const AI_CONFIG = {
  // Primary provider
  provider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'huggingface' | 'local' | 'mock',
  
  // OpenAI Settings
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '500'),
    enabled: !!process.env.OPENAI_API_KEY,
  },
  
  // Anthropic Claude
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-opus-20240229',
    enabled: !!process.env.ANTHROPIC_API_KEY,
  },
  
  // Hugging Face
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    model: 'meta-llama/Llama-3.1-70B-Instruct',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
  },
  
  // Feature flags
  features: {
    predictions: process.env.NEXT_PUBLIC_ENABLE_AI_PREDICTIONS !== 'false',
    sentiment: true,
    chatAssistant: true,
    dataAnalysis: true,
  },
  
  // Fallback to mock when no API keys
  useMock: !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY,
};

export const ORACLE_CONFIG = {
  chainlink: {
    enabled: !!process.env.CHAINLINK_NODE_URL,
    nodeUrl: process.env.CHAINLINK_NODE_URL || '',
    jobId: process.env.CHAINLINK_JOB_ID || '',
  },
  
  pyth: {
    enabled: !!process.env.PYTH_API_KEY,
    apiKey: process.env.PYTH_API_KEY || '',
  },
  
  uma: {
    enabled: !!process.env.UMA_PROPOSER_KEY,
    proposerKey: process.env.UMA_PROPOSER_KEY || '',
  },
  
  coingecko: {
    enabled: !!process.env.COINGECKO_API_KEY,
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
  
  twitter: {
    enabled: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_BEARER_TOKEN),
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  
  news: {
    enabled: !!process.env.NEWS_API_KEY,
    apiKey: process.env.NEWS_API_KEY || '',
  },
};

export const SOCIAL_CONFIG = {
  xmtp: {
    enabled: process.env.XMTP_ENV === 'production',
    env: process.env.XMTP_ENV || 'dev',
  },
  
  push: {
    enabled: !!process.env.PUSH_CHANNEL_ADDRESS,
    channelAddress: process.env.PUSH_CHANNEL_ADDRESS || '',
  },
  
  lens: {
    enabled: true,
    apiUrl: process.env.LENS_API_URL || 'https://api-v2.lens.dev',
  },
  
  farcaster: {
    enabled: !!process.env.FARCASTER_API_KEY,
    apiKey: process.env.FARCASTER_API_KEY || '',
  },
};

export const REPUTATION_CONFIG = {
  // Scoring weights
  weights: {
    accuracy: 0.5,      // 50% - most important
    volume: 0.2,        // 20% - total amount bet
    longevity: 0.15,    // 15% - account age & consistency
    marketCreation: 0.1, // 10% - quality markets created
    socialImpact: 0.05, // 5% - guild leadership, followers
  },
  
  // Badge thresholds
  badges: {
    novice: 0,
    apprentice: 100,
    expert: 500,
    master: 1000,
    grandmaster: 5000,
    legend: 10000,
  },
  
  // SBT contract
  sbtAddress: process.env.NEXT_PUBLIC_REPUTATION_SBT_ADDRESS || '',
  enabled: process.env.NEXT_PUBLIC_ENABLE_REPUTATION_SYSTEM !== 'false',
};

export const FEATURES = {
  aiPredictions: process.env.NEXT_PUBLIC_ENABLE_AI_PREDICTIONS !== 'false',
  guilds: process.env.NEXT_PUBLIC_ENABLE_GUILDS !== 'false',
  zkPrivacy: process.env.NEXT_PUBLIC_ENABLE_ZK_PRIVACY === 'true',
  metaMarkets: process.env.NEXT_PUBLIC_ENABLE_META_MARKETS !== 'false',
  socialFeatures: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES !== 'false',
  reputationSystem: process.env.NEXT_PUBLIC_ENABLE_REPUTATION_SYSTEM !== 'false',
  copyTrading: true,
  achievements: true,
  leaderboards: true,
};
