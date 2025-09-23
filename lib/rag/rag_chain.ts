import { ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from 'langchain/document';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { VectorStoreManager, RetrievalOptions } from './vector_store';

export interface RAGChainConfig {
  openaiApiKey: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    pageNumber?: number;
    score?: number;
  }>;
  queryTime: number;
}

export interface ConversationContext {
  sessionId: string;
  messages: BaseMessage[];
  paperId?: string;
}

export class RAGChain {
  private llm: ChatOpenAI;
  private vectorStore: VectorStoreManager;
  private systemPrompt: string;
  private conversationHistory: Map<string, BaseMessage[]> = new Map();

  constructor(
    config: RAGChainConfig,
    vectorStore: VectorStoreManager
  ) {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openaiApiKey,
      modelName: config.modelName || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
    });

    this.vectorStore = vectorStore;

    this.systemPrompt = config.systemPrompt || `You are a helpful AI assistant specializing in analyzing academic papers and research documents.
    Your role is to provide accurate, insightful answers based on the provided context from the documents.

    Guidelines:
    1. Base your answers primarily on the provided context
    2. If the context doesn't contain enough information, acknowledge this limitation
    3. Cite specific sections or page numbers when referencing the source material
    4. Maintain academic rigor and precision in your responses
    5. If asked about something not in the context, clearly state that the information is not available in the provided documents`;
  }

  async query(
    question: string,
    context?: ConversationContext,
    retrievalOptions?: RetrievalOptions
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    const retrievedDocs = await this.retrieveDocuments(
      question,
      context?.paperId,
      retrievalOptions
    );

    const formattedContext = this.formatDocuments(retrievedDocs);

    // Simple conversation history - keep last 6 messages only
    const conversationHistory = context?.sessionId
      ? this.getConversationHistory(context.sessionId).slice(-6)
      : [];

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.systemPrompt),
      new MessagesPlaceholder('history'),
      SystemMessagePromptTemplate.fromTemplate(
        'Context from documents:\n{context}\n\nAnswer the question based on the above context.'
      ),
      HumanMessagePromptTemplate.fromTemplate('{question}'),
    ]);

    const chain = RunnableSequence.from([
      RunnableMap.from({
        context: () => formattedContext,
        question: new RunnablePassthrough(),
        history: () => conversationHistory,
      }),
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    const answer = await chain.invoke(question);

    if (context?.sessionId) {
      this.updateConversationHistory(
        context.sessionId,
        new HumanMessage(question),
        new AIMessage(answer)
      );
    }

    const queryTime = Date.now() - startTime;

    return {
      answer,
      sources: retrievedDocs.map(doc => ({
        content: doc.pageContent,
        pageNumber: doc.metadata?.pageNumber,
        score: doc.metadata?.score,
      })),
      queryTime,
    };
  }

  async streamQuery(
    question: string,
    context?: ConversationContext,
    retrievalOptions?: RetrievalOptions,
    onChunk?: (chunk: string) => void
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    const retrievedDocs = await this.retrieveDocuments(
      question,
      context?.paperId,
      retrievalOptions
    );

    const formattedContext = this.formatDocuments(retrievedDocs);

    const conversationHistory = context?.sessionId
      ? this.getConversationHistory(context.sessionId)
      : [];

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.systemPrompt),
      new MessagesPlaceholder('history'),
      SystemMessagePromptTemplate.fromTemplate(
        'Context from documents:\n{context}\n\nAnswer the question based on the above context.'
      ),
      HumanMessagePromptTemplate.fromTemplate('{question}'),
    ]);

    const chain = RunnableSequence.from([
      RunnableMap.from({
        context: () => formattedContext,
        question: new RunnablePassthrough(),
        history: () => conversationHistory,
      }),
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    const stream = await chain.stream(question);
    let fullAnswer = '';

    for await (const chunk of stream) {
      fullAnswer += chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }

    if (context?.sessionId) {
      this.updateConversationHistory(
        context.sessionId,
        new HumanMessage(question),
        new AIMessage(fullAnswer)
      );
    }

    const queryTime = Date.now() - startTime;

    return {
      answer: fullAnswer,
      sources: retrievedDocs.map(doc => ({
        content: doc.pageContent,
        pageNumber: doc.metadata?.pageNumber,
        score: doc.metadata?.score,
      })),
      queryTime,
    };
  }

  private async retrieveDocuments(
    query: string,
    paperId?: string,
    options?: RetrievalOptions
  ): Promise<Document[]> {
    const defaultOptions: RetrievalOptions = {
      k: 5,
      searchType: 'hybrid',
      scoreThreshold: 0.7,
      ...options,
    };

    if (defaultOptions.searchType === 'hybrid' && paperId) {
      return await this.vectorStore.hybridSearch(query, paperId, defaultOptions);
    } else if (defaultOptions.searchType === 'mmr') {
      return await this.vectorStore.maxMarginalRelevanceSearch(query, defaultOptions);
    } else {
      return await this.vectorStore.similaritySearch(query, defaultOptions);
    }
  }

  private formatDocuments(documents: Document[]): string {
    if (documents.length === 0) {
      return 'No relevant documents found.';
    }

    return documents
      .map((doc, index) => {
        const pageInfo = doc.metadata?.pageNumber
          ? ` (Page ${doc.metadata.pageNumber})`
          : '';
        return `[Document ${index + 1}${pageInfo}]:\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');
  }

  private getConversationHistory(sessionId: string): BaseMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  private updateConversationHistory(
    sessionId: string,
    userMessage: HumanMessage,
    assistantMessage: AIMessage
  ): void {
    const history = this.getConversationHistory(sessionId);
    history.push(userMessage, assistantMessage);

    const maxHistoryLength = 20;
    if (history.length > maxHistoryLength) {
      history.splice(0, history.length - maxHistoryLength);
    }

    this.conversationHistory.set(sessionId, history);
  }

  clearConversationHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  async generateSummary(paperId: string): Promise<string> {
    const summaryPrompt = `Please provide a comprehensive summary of this academic paper, including:
    1. Main research question or hypothesis
    2. Methodology used
    3. Key findings and results
    4. Conclusions and implications
    5. Limitations and future research directions`;

    const docs = await this.vectorStore.similaritySearch(summaryPrompt, {
      k: 10,
      filter: { paper_id: paperId },
    });

    if (docs.length === 0) {
      return 'Unable to generate summary: No document content found.';
    }

    const context = this.formatDocuments(docs);

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are an expert at summarizing academic papers. Create a clear, structured summary based on the provided context.'
      ),
      SystemMessagePromptTemplate.fromTemplate('Context:\n{context}'),
      HumanMessagePromptTemplate.fromTemplate('{request}'),
    ]);

    const chain = RunnableSequence.from([
      {
        context: () => context,
        request: () => summaryPrompt,
      },
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    return await chain.invoke({});
  }

  async extractKeyInsights(paperId: string): Promise<string[]> {
    const insightsPrompt = `Extract the 5-7 most important insights, findings, or contributions from this paper.
    Format each as a concise bullet point.`;

    const docs = await this.vectorStore.similaritySearch(insightsPrompt, {
      k: 8,
      filter: { paper_id: paperId },
    });

    if (docs.length === 0) {
      return [];
    }

    const context = this.formatDocuments(docs);

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'Extract key insights from the academic paper based on the context provided.'
      ),
      SystemMessagePromptTemplate.fromTemplate('Context:\n{context}'),
      HumanMessagePromptTemplate.fromTemplate('{request}'),
    ]);

    const chain = RunnableSequence.from([
      {
        context: () => context,
        request: () => insightsPrompt,
      },
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    return response
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•\-]\s*/, '').trim());
  }
}