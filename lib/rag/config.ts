export interface RAGConfig {
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
    temperature: number;
    maxTokens: number;
    streamingEnabled: boolean;
  };
  vectorStore: {
    type: 'chroma' | 'supabase';
    chromaUrl?: string;
    collectionName: string;
  };
  chunking: {
    chunkSize: number;
    chunkOverlap: number;
    semanticChunking: boolean;
    minChunkSize: number;
    maxChunkSize: number;
  };
  retrieval: {
    defaultK: number;
    maxK: number;
    scoreThreshold: number;
    searchType: 'similarity' | 'mmr' | 'hybrid';
    hybridAlpha: number;
    rerankingEnabled: boolean;
  };
  processing: {
    maxFileSize: number;
    supportedFileTypes: string[];
    extractMetadata: boolean;
    ocrEnabled: boolean;
    languageDetection: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxCacheSize: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsEnabled: boolean;
  };
}

export const defaultConfig: RAGConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    embeddingModel: 'text-embedding-3-large',
    temperature: 0.7,
    maxTokens: 2000,
    streamingEnabled: true,
  },
  vectorStore: {
    type: 'supabase',
    chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
    collectionName: 'papers',
  },
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 100,
    semanticChunking: false,
    minChunkSize: 200,
    maxChunkSize: 2000,
  },
  retrieval: {
    defaultK: 5,
    maxK: 20,
    scoreThreshold: 0.7,
    searchType: 'hybrid',
    hybridAlpha: 0.5,
    rerankingEnabled: true,
  },
  processing: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedFileTypes: ['pdf', 'txt', 'md', 'docx', 'json'],
    extractMetadata: true,
    ocrEnabled: false,
    languageDetection: true,
  },
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxCacheSize: 100,
  },
  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsEnabled: true,
  },
};

export class ConfigManager {
  private config: RAGConfig;

  constructor(customConfig?: Partial<RAGConfig>) {
    this.config = this.mergeConfig(defaultConfig, customConfig || {});
    this.validateConfig();
  }

  private mergeConfig(
    base: RAGConfig,
    custom: Partial<RAGConfig>
  ): RAGConfig {
    return {
      openai: { ...base.openai, ...custom.openai },
      vectorStore: { ...base.vectorStore, ...custom.vectorStore },
      chunking: { ...base.chunking, ...custom.chunking },
      retrieval: { ...base.retrieval, ...custom.retrieval },
      processing: { ...base.processing, ...custom.processing },
      caching: { ...base.caching, ...custom.caching },
      monitoring: { ...base.monitoring, ...custom.monitoring },
    };
  }

  private validateConfig(): void {
    if (!this.config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (this.config.chunking.chunkSize < this.config.chunking.minChunkSize) {
      throw new Error('Chunk size cannot be less than minimum chunk size');
    }

    if (this.config.chunking.chunkSize > this.config.chunking.maxChunkSize) {
      throw new Error('Chunk size cannot exceed maximum chunk size');
    }

    if (this.config.chunking.chunkOverlap >= this.config.chunking.chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }

    if (this.config.retrieval.defaultK > this.config.retrieval.maxK) {
      throw new Error('Default K cannot exceed max K');
    }

    if (
      this.config.retrieval.scoreThreshold < 0 ||
      this.config.retrieval.scoreThreshold > 1
    ) {
      throw new Error('Score threshold must be between 0 and 1');
    }

    if (
      this.config.retrieval.hybridAlpha < 0 ||
      this.config.retrieval.hybridAlpha > 1
    ) {
      throw new Error('Hybrid alpha must be between 0 and 1');
    }
  }

  get(path?: string): any {
    if (!path) {
      return this.config;
    }

    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        return undefined;
      }
    }

    return value;
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    let obj: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    this.validateConfig();
  }

  update(updates: Partial<RAGConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.validateConfig();
  }

  reset(): void {
    this.config = { ...defaultConfig };
  }

  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  import(configString: string): void {
    try {
      const imported = JSON.parse(configString);
      this.config = this.mergeConfig(defaultConfig, imported);
      this.validateConfig();
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }
}

export function loadConfigFromEnv(): Partial<RAGConfig> {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      streamingEnabled: process.env.OPENAI_STREAMING !== 'false',
    },
    vectorStore: {
      type: (process.env.VECTOR_STORE_TYPE as 'chroma' | 'supabase') || 'supabase',
      chromaUrl: process.env.CHROMA_URL,
      collectionName: process.env.VECTOR_COLLECTION_NAME || 'papers',
    },
    chunking: {
      chunkSize: parseInt(process.env.CHUNK_SIZE || '1000'),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100'),
      semanticChunking: process.env.SEMANTIC_CHUNKING === 'true',
      minChunkSize: parseInt(process.env.MIN_CHUNK_SIZE || '200'),
      maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE || '2000'),
    },
    retrieval: {
      defaultK: parseInt(process.env.RETRIEVAL_K || '5'),
      maxK: parseInt(process.env.RETRIEVAL_MAX_K || '20'),
      scoreThreshold: parseFloat(process.env.RETRIEVAL_SCORE_THRESHOLD || '0.7'),
      searchType: (process.env.RETRIEVAL_SEARCH_TYPE as 'similarity' | 'mmr' | 'hybrid') || 'hybrid',
      hybridAlpha: parseFloat(process.env.RETRIEVAL_HYBRID_ALPHA || '0.5'),
      rerankingEnabled: process.env.RETRIEVAL_RERANKING !== 'false',
    },
    caching: {
      enabled: process.env.CACHING_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
      maxCacheSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      metricsEnabled: process.env.METRICS_ENABLED !== 'false',
    },
  };
}