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

    const { k = 20, filter } = options;
    const paperId = filter?.paper_id;

    // FOR DEBUGGING: Return ALL chunks for this paper instead of similarity search
    console.log('DEBUG: Getting ALL chunks for paper:', paperId);

    // First, let's see what papers exist in the database
    const { data: allPapers, error: paperError } = await this.supabaseClient
      .from('paper_chunks')
      .select('paper_id')
      .limit(10);

    console.log('DEBUG: Available paper IDs in database:', allPapers?.map((p: any) => p.paper_id));
    console.log('DEBUG: Paper query error:', paperError);
    console.log('DEBUG: Using supabase URL:', this.supabaseClient.supabaseUrl);

    // Also try getting the total count
    const { count, error: countError } = await this.supabaseClient
      .from('paper_chunks')
      .select('*', { count: 'exact', head: true });

    console.log('DEBUG: Total chunks in database:', count, 'count error:', countError);

    const { data, error } = await this.supabaseClient
      .from('paper_chunks')
      .select('id, content, page_no, paper_id')
      .eq('paper_id', paperId)
      .limit(k);

    if (error) {
      console.error('Error fetching chunks:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('DEBUG: Found chunks:', data?.length || 0);

    if (!data || data.length === 0) {
      console.log('DEBUG: No chunks found for paper ID:', paperId);
      return [];
    }

    // Convert to Document format
    const documents = data.map((chunk: any) => new Document({
      pageContent: chunk.content,
      metadata: {
        id: chunk.id,
        page_no: chunk.page_no,
        paper_id: chunk.paper_id
      }
    }));

    console.log('DEBUG: Returning documents:', documents.length);
    return documents;
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

  // This function is now simplified and moved to hybridSearch method
  // No longer needed as a separate method

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