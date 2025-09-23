import { DocumentProcessor } from './document_processor';
import { VectorStoreManager, VectorStoreConfig, RetrievalOptions } from './vector_store';
import { RAGChain, RAGResponse, ConversationContext } from './rag_chain';
import { createClient } from '@supabase/supabase-js';
import { BaseMessage } from '@langchain/core/messages';

export interface RAGAgentConfig {
  openaiApiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  chromaUrl?: string;
  vectorStoreType?: 'chroma' | 'supabase';
  modelName?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface ProcessingResult {
  success: boolean;
  paperId: string;
  chunksCreated?: number;
  error?: string;
  processingTime?: number;
}

export interface QueryResult extends RAGResponse {
  sessionId?: string;
  citations?: Array<{
    chunkId: string;
    pageNumber: number;
    relevanceScore: number;
  }>;
}

export class RAGAgent {
  private documentProcessor: DocumentProcessor;
  private vectorStoreManager: VectorStoreManager;
  private ragChain: RAGChain;
  private supabaseClient: any;
  private config: RAGAgentConfig;

  constructor(config: RAGAgentConfig) {
    this.config = config;

    this.supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);

    this.documentProcessor = new DocumentProcessor(
      config.supabaseUrl,
      config.supabaseKey,
      config.openaiApiKey,
      {
        chunkSize: config.chunkSize || 1000,
        chunkOverlap: config.chunkOverlap || 100,
      }
    );

    const vectorStoreConfig: VectorStoreConfig = {
      type: config.vectorStoreType || 'supabase',
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      chromaUrl: config.chromaUrl,
      openaiApiKey: config.openaiApiKey,
    };

    this.vectorStoreManager = new VectorStoreManager(vectorStoreConfig);

    this.ragChain = new RAGChain(
      {
        openaiApiKey: config.openaiApiKey,
        modelName: config.modelName || 'gpt-4-turbo-preview',
      },
      this.vectorStoreManager
    );
  }

  async processDocument(
    paperId: string,
    filePath: string,
    fileType: string,
    title: string,
    userId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      const existingStatus = await this.documentProcessor.getProcessingStatus(paperId);
      if (existingStatus?.status === 'processing') {
        return {
          success: false,
          paperId,
          error: 'Document is already being processed',
        };
      }

      const result = await this.documentProcessor.processDocument(
        paperId,
        filePath,
        fileType,
        title
      );

      if (result.success) {
        await this.vectorStoreManager.initialize(paperId);

        await this.logProcessing(userId, paperId, 'success', result.chunksCreated);

        return {
          success: true,
          paperId,
          chunksCreated: result.chunksCreated,
          processingTime: Date.now() - startTime,
        };
      } else {
        await this.logProcessing(userId, paperId, 'failed', 0, result.error);

        return {
          success: false,
          paperId,
          error: result.error,
          processingTime: Date.now() - startTime,
        };
      }
    } catch (error: any) {
      await this.logProcessing(userId, paperId, 'failed', 0, error.message);

      return {
        success: false,
        paperId,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async query(
    question: string,
    userId: string,
    sessionId?: string,
    paperId?: string,
    options?: RetrievalOptions
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      if (paperId) {
        await this.vectorStoreManager.initialize(paperId);
      }

      const context: ConversationContext | undefined = sessionId
        ? {
            sessionId,
            messages: await this.loadConversationHistory(sessionId),
            paperId,
          }
        : undefined;

      const response = await this.ragChain.query(question, context, options);

      await this.logQuery(
        userId,
        sessionId || '',
        question,
        response.queryTime,
        options?.searchType || 'hybrid',
        response.sources.length
      );

      if (sessionId) {
        await this.saveMessage(sessionId, 'user', question);
        await this.saveMessage(sessionId, 'assistant', response.answer);

        if (response.sources.length > 0) {
          await this.saveCitations(sessionId, response.sources);
        }
      }

      return {
        ...response,
        sessionId,
        citations: response.sources.map((source, idx) => ({
          chunkId: `chunk_${idx}`,
          pageNumber: source.pageNumber || 0,
          relevanceScore: source.score || 0,
        })),
      };
    } catch (error: any) {
      console.error('Query error:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  async streamQuery(
    question: string,
    userId: string,
    onChunk: (chunk: string) => void,
    sessionId?: string,
    paperId?: string,
    options?: RetrievalOptions
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      if (paperId) {
        await this.vectorStoreManager.initialize(paperId);
      }

      const context: ConversationContext | undefined = sessionId
        ? {
            sessionId,
            messages: await this.loadConversationHistory(sessionId),
            paperId,
          }
        : undefined;

      const response = await this.ragChain.streamQuery(
        question,
        context,
        options,
        onChunk
      );

      await this.logQuery(
        userId,
        sessionId || '',
        question,
        response.queryTime,
        options?.searchType || 'hybrid',
        response.sources.length
      );

      if (sessionId) {
        await this.saveMessage(sessionId, 'user', question);
        await this.saveMessage(sessionId, 'assistant', response.answer);

        if (response.sources.length > 0) {
          await this.saveCitations(sessionId, response.sources);
        }
      }

      return {
        ...response,
        sessionId,
        citations: response.sources.map((source, idx) => ({
          chunkId: `chunk_${idx}`,
          pageNumber: source.pageNumber || 0,
          relevanceScore: source.score || 0,
        })),
      };
    } catch (error: any) {
      console.error('Stream query error:', error);
      throw new Error(`Failed to process stream query: ${error.message}`);
    }
  }

  async generateSummary(paperId: string, userId: string): Promise<string> {
    try {
      await this.vectorStoreManager.initialize(paperId);
      const summary = await this.ragChain.generateSummary(paperId);

      await this.logQuery(
        userId,
        '',
        'Generate summary',
        0,
        'summary',
        0
      );

      return summary;
    } catch (error: any) {
      console.error('Summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  async extractKeyInsights(paperId: string, userId: string): Promise<string[]> {
    try {
      await this.vectorStoreManager.initialize(paperId);
      const insights = await this.ragChain.extractKeyInsights(paperId);

      await this.logQuery(
        userId,
        '',
        'Extract insights',
        0,
        'insights',
        insights.length
      );

      return insights;
    } catch (error: any) {
      console.error('Insights extraction error:', error);
      throw new Error(`Failed to extract insights: ${error.message}`);
    }
  }

  async createChatSession(
    userId: string,
    paperId: string,
    title: string
  ): Promise<string> {
    const { data, error } = await this.supabaseClient
      .from('chat_sessions')
      .insert({
        user_id: userId,
        paper_id: paperId,
        title,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return data.id;
  }

  async getChatSession(sessionId: string): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from('chat_sessions')
      .select(`
        *,
        chat_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new Error(`Failed to get chat session: ${error.message}`);
    }

    return data;
  }

  async getUserChatSessions(userId: string, paperId?: string): Promise<any[]> {
    let query = this.supabaseClient
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (paperId) {
      query = query.eq('paper_id', paperId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }

    return data || [];
  }

  private async loadConversationHistory(sessionId: string): Promise<BaseMessage[]> {
    const { data, error } = await this.supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error || !data) {
      return [];
    }

    const { HumanMessage, AIMessage } = await import('@langchain/core/messages');

    return data.map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });
  }

  private async saveMessage(
    sessionId: string,
    role: string,
    content: string
  ): Promise<void> {
    await this.supabaseClient.from('chat_messages').insert({
      session_id: sessionId,
      role,
      content,
    });

    await this.supabaseClient
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  private async saveCitations(
    sessionId: string,
    sources: any[]
  ): Promise<void> {
    const { data: lastMessage } = await this.supabaseClient
      .from('chat_messages')
      .select('id')
      .eq('session_id', sessionId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMessage) {
      const citations = sources.map((source, idx) => ({
        message_id: lastMessage.id,
        chunk_id: `chunk_${idx}`,
        score: source.score || 0,
        page_no: source.pageNumber || 0,
      }));

      await this.supabaseClient.from('message_citations').insert(citations);
    }
  }

  private async logProcessing(
    userId: string,
    paperId: string,
    status: string,
    chunksCreated: number,
    error?: string
  ): Promise<void> {
    console.log(`Document processing - User: ${userId}, Paper: ${paperId}, Status: ${status}, Chunks: ${chunksCreated}`);
    if (error) {
      console.error(`Processing error: ${error}`);
    }
  }

  private async logQuery(
    userId: string,
    sessionId: string,
    query: string,
    queryTime: number,
    retrievalMethod: string,
    chunksRetrieved: number
  ): Promise<void> {
    await this.supabaseClient.from('rag_query_logs').insert({
      user_id: userId,
      session_id: sessionId || null,
      query,
      retrieval_method: retrievalMethod,
      num_chunks_retrieved: chunksRetrieved,
      retrieval_time_ms: queryTime,
      total_time_ms: queryTime,
    });
  }

  async getDocumentStats(paperId: string): Promise<any> {
    const stats = await this.vectorStoreManager.getCollectionStats(paperId);

    const { data: processingStatus } = await this.supabaseClient
      .from('document_processing_status')
      .select('*')
      .eq('paper_id', paperId)
      .single();

    return {
      ...stats,
      processingStatus,
    };
  }

  async deleteDocument(paperId: string): Promise<void> {
    await this.vectorStoreManager.deleteCollection(paperId);

    await this.supabaseClient
      .from('paper_chunks')
      .delete()
      .eq('paper_id', paperId);

    await this.supabaseClient
      .from('papers')
      .delete()
      .eq('id', paperId);
  }
}