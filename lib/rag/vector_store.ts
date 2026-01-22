import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  filter?: Record<string, string | number | boolean>;
  scoreThreshold?: number;
  searchType?: 'similarity' | 'mmr' | 'hybrid';
  fetchK?: number;
  lambda?: number;
}

export class VectorStoreManager {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma | SupabaseVectorStore | null = null;
  private config: VectorStoreConfig;
  private supabaseClient: SupabaseClient | null = null;
  private chromaClient: ChromaClient | null = null;
  private isInitialized: boolean = false;

  constructor(config: VectorStoreConfig) {
    this.config = config;

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-3-large',
      dimensions: 3072,
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
    if (this.isInitialized) {
      return;
    }

    if (this.config.type === 'chroma') {
      await this.initializeChroma(paperId);
    } else {
      await this.initializeSupabase(paperId);
    }

    this.isInitialized = true;
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

    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    this.vectorStore = await SupabaseVectorStore.fromExistingIndex(this.embeddings, {
      client: this.supabaseClient,
      tableName: 'paper_chunks',
      queryName: 'match_paper_chunks_optimized',
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
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const { k = 20, filter, scoreThreshold = 0.5 } = options;
    const paperId = filter?.paper_id;

    if (!paperId) {
      throw new Error('Paper ID is required for similarity search');
    }

    // Generate embedding for the query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Use Supabase RPC for vector similarity search
    const { data, error } = await this.supabaseClient.rpc('match_paper_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: scoreThreshold,
      match_count: k,
      filter_paper_id: paperId
    });

    if (error) {
      // Fallback to basic search if RPC function doesn't exist
      const { data: fallbackData, error: fallbackError } = await this.supabaseClient
        .from('paper_chunks')
        .select('id, content, page_no, paper_id')
        .eq('paper_id', paperId)
        .limit(k);

      if (fallbackError) {
        throw new Error(`Database error: ${fallbackError.message}`);
      }

      if (!fallbackData || fallbackData.length === 0) {
        return [];
      }

      return fallbackData.map((chunk: { id: string; content: string; page_no: number; paper_id: string }) => new Document({
        pageContent: chunk.content,
        metadata: {
          id: chunk.id,
          pageNumber: chunk.page_no,
          paper_id: chunk.paper_id
        }
      }));
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert to Document format with similarity scores
    return data.map((chunk: { id: string; content: string; page_no: number; paper_id: string; similarity?: number }) => new Document({
      pageContent: chunk.content,
      metadata: {
        id: chunk.id,
        pageNumber: chunk.page_no,
        paper_id: chunk.paper_id,
        score: chunk.similarity || 0
      }
    }));
  }

  async maxMarginalRelevanceSearch(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const { k = 5, filter, fetchK = 20 } = options;

    // Use similarity search as fallback if maxMarginalRelevanceSearch is not available
    if (this.vectorStore.maxMarginalRelevanceSearch) {
      try {
        // @ts-expect-error - LangChain version compatibility issue
        return await this.vectorStore.maxMarginalRelevanceSearch(query, k, fetchK);
      } catch {
        // MMR search failed, falling back to similarity search
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

    // Run searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.similaritySearch(query, { ...options, k, filter: { paper_id: paperId } }),
      this.keywordSearch(query, paperId, { k: Math.ceil(k / 2) })
    ]);

    // Simple combine - take best from each
    const seen = new Set<string>();
    const combined: Document[] = [];

    // Add semantic results first
    for (const doc of semanticResults) {
      if (!seen.has(doc.pageContent) && combined.length < k) {
        seen.add(doc.pageContent);
        combined.push(doc);
      }
    }

    // Fill remaining with keyword results
    for (const doc of keywordResults) {
      if (!seen.has(doc.pageContent) && combined.length < k) {
        seen.add(doc.pageContent);
        combined.push(doc);
      }
    }

    return combined;
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

    if (searchTerms.length === 0) {
      return [];
    }

    const { data, error } = await this.supabaseClient
      .from('paper_chunks')
      .select('id, content, page_no')
      .eq('paper_id', paperId)
      .textSearch('content', searchTerms.join(' | '))
      .limit(options.k);

    if (error || !data) {
      return [];
    }

    return data.map((chunk: { id: string; content: string; page_no: number }) =>
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

  // This function is now simplified and moved to hybridSearch method
  // No longer needed as a separate method

  async deleteCollection(paperId: string): Promise<void> {
    if (this.config.type === 'chroma' && this.chromaClient) {
      try {
        await this.chromaClient.deleteCollection({ name: `paper_${paperId}` });
      } catch {
        // Collection may not exist, ignore error
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