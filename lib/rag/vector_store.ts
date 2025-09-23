import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ChromaClient } from 'chromadb';

export interface VectorStoreConfig {
  type: 'chroma' | 'supabase';
  chromaUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  openaiApiKey: string;
  collectionName?: string;
}

export interface RetrievalOptions {
  k?: number;
  filter?: Record<string, any>;
  scoreThreshold?: number;
  searchType?: 'similarity' | 'mmr' | 'hybrid';
  fetchK?: number;
  lambda?: number;
}

export class VectorStoreManager {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma | SupabaseVectorStore | null = null;
  private config: VectorStoreConfig;
  private supabaseClient: any;
  private chromaClient: ChromaClient | null = null;

  constructor(config: VectorStoreConfig) {
    this.config = config;

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-3-large',
      dimensions: 1536,
    });

    if (config.type === 'supabase' && config.supabaseUrl && config.supabaseKey) {
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
    }

    if (config.type === 'chroma' && config.chromaUrl) {
      this.chromaClient = new ChromaClient({
        path: config.chromaUrl,
      });
    }
  }

  async initialize(paperId?: string): Promise<void> {
    if (this.config.type === 'chroma') {
      await this.initializeChroma(paperId);
    } else {
      await this.initializeSupabase(paperId);
    }
  }

  private async initializeChroma(paperId?: string): Promise<void> {
    const collectionName = paperId ? `paper_${paperId}` : (this.config.collectionName || 'default');

    this.vectorStore = await Chroma.fromExistingCollection(
      this.embeddings,
      {
        collectionName,
        url: this.config.chromaUrl,
      }
    ).catch(async () => {
      return await Chroma.fromDocuments(
        [],
        this.embeddings,
        {
          collectionName,
          url: this.config.chromaUrl,
        }
      );
    });
  }

  private async initializeSupabase(paperId?: string): Promise<void> {
    let filter: any = {};
    if (paperId) {
      filter = { paper_id: paperId };
    }

    this.vectorStore = await SupabaseVectorStore.fromExistingIndex(this.embeddings, {
      client: this.supabaseClient,
      tableName: 'paper_chunks',
      queryName: 'match_paper_chunks',
      filter,
    });
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    await this.vectorStore.addDocuments(documents);
  }

  async similaritySearch(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const { k = 5, filter, scoreThreshold = 0.7 } = options;

    const results = await this.vectorStore.similaritySearchWithScore(query, k, filter);

    return results
      .filter(([_, score]) => score >= scoreThreshold)
      .map(([doc]) => doc);
  }

  async maxMarginalRelevanceSearch(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const { k = 5, filter, fetchK = 20, lambda = 0.5 } = options;

    // Use similarity search as fallback if maxMarginalRelevanceSearch is not available
    if (this.vectorStore.maxMarginalRelevanceSearch) {
      try {
        // @ts-ignore - LangChain version compatibility issue
        return await this.vectorStore.maxMarginalRelevanceSearch(query, k, fetchK);
      } catch (error) {
        console.warn('MMR search failed, falling back to similarity search:', error);
      }
    }

    return await this.similaritySearch(query, { k, filter });
  }

  async hybridSearch(
    query: string,
    paperId: string,
    options: RetrievalOptions = {}
  ): Promise<Document[]> {
    const { k = 5 } = options;

    const semanticResults = await this.similaritySearch(query, { ...options, k: k * 2 });

    const keywordResults = await this.keywordSearch(query, paperId, { k: k * 2 });

    const combinedResults = this.combineResults(semanticResults, keywordResults, k);

    return combinedResults;
  }

  private async keywordSearch(
    query: string,
    paperId: string,
    options: { k: number }
  ): Promise<Document[]> {
    if (!this.supabaseClient) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ')
      .filter(term => term.length > 2);

    const { data, error } = await this.supabaseClient
      .from('paper_chunks')
      .select('id, content, page_no')
      .eq('paper_id', paperId)
      .textSearch('content', searchTerms.join(' | '))
      .limit(options.k);

    if (error || !data) {
      console.error('Keyword search error:', error);
      return [];
    }

    return data.map((chunk: any) =>
      new Document({
        pageContent: chunk.content,
        metadata: {
          id: chunk.id,
          pageNumber: chunk.page_no,
          searchType: 'keyword',
        },
      })
    );
  }

  private combineResults(
    semanticResults: Document[],
    keywordResults: Document[],
    k: number
  ): Document[] {
    const seen = new Set<string>();
    const combined: Document[] = [];

    const addUnique = (doc: Document) => {
      const content = doc.pageContent;
      if (!seen.has(content)) {
        seen.add(content);
        combined.push(doc);
      }
    };

    const semanticWeight = 0.6;
    const keywordWeight = 0.4;

    const maxSemantic = Math.ceil(k * semanticWeight);
    const maxKeyword = Math.ceil(k * keywordWeight);

    semanticResults.slice(0, maxSemantic).forEach(addUnique);
    keywordResults.slice(0, maxKeyword).forEach(addUnique);

    if (combined.length < k) {
      [...semanticResults, ...keywordResults]
        .slice(maxSemantic + maxKeyword)
        .forEach(doc => {
          if (combined.length < k) {
            addUnique(doc);
          }
        });
    }

    return combined.slice(0, k);
  }

  async deleteCollection(paperId: string): Promise<void> {
    if (this.config.type === 'chroma' && this.chromaClient) {
      try {
        await this.chromaClient.deleteCollection({ name: `paper_${paperId}` });
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    } else if (this.config.type === 'supabase' && this.supabaseClient) {
      await this.supabaseClient
        .from('paper_chunks')
        .delete()
        .eq('paper_id', paperId);
    }
  }

  async getCollectionStats(paperId?: string): Promise<{
    documentCount: number;
    collectionName: string;
  }> {
    if (this.config.type === 'chroma' && this.chromaClient) {
      const collectionName = paperId ? `paper_${paperId}` : 'default';
      try {
        const collection = await this.chromaClient.getCollection({ name: collectionName });
        const count = await collection.count();
        return {
          documentCount: count,
          collectionName,
        };
      } catch {
        return {
          documentCount: 0,
          collectionName,
        };
      }
    } else if (this.config.type === 'supabase' && this.supabaseClient) {
      const query = this.supabaseClient.from('paper_chunks').select('id', { count: 'exact' });

      if (paperId) {
        query.eq('paper_id', paperId);
      }

      const { count } = await query;

      return {
        documentCount: count || 0,
        collectionName: paperId || 'all_papers',
      };
    }

    return {
      documentCount: 0,
      collectionName: 'unknown',
    };
  }
}