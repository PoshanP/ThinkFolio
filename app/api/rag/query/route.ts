import { NextRequest, NextResponse } from 'next/server';
import { RAGAgent } from '@/lib/rag/rag_agent';
import { ConfigManager, loadConfigFromEnv } from '@/lib/rag/config';

const configManager = new ConfigManager(loadConfigFromEnv());
const config = configManager.get();

const ragAgent = new RAGAgent({
  openaiApiKey: config.openai.apiKey,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  chromaUrl: config.vectorStore.chromaUrl,
  vectorStoreType: config.vectorStore.type,
  modelName: config.openai.model,
  chunkSize: config.chunking.chunkSize,
  chunkOverlap: config.chunking.chunkOverlap,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      userId,
      sessionId,
      paperId,
      retrievalOptions = {},
      stream = false,
    } = body;

    if (!question || !userId) {
      return NextResponse.json(
        { error: 'Question and userId are required' },
        { status: 400 }
      );
    }

    const options = {
      k: retrievalOptions.k || config.retrieval.defaultK,
      searchType: retrievalOptions.searchType || config.retrieval.searchType,
      scoreThreshold: retrievalOptions.scoreThreshold || config.retrieval.scoreThreshold,
    };

    if (stream && config.openai.streamingEnabled) {
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      ragAgent.streamQuery(
        question,
        userId,
        async (chunk: string) => {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        },
        sessionId,
        paperId,
        options
      ).then(async (result) => {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              sources: result.sources,
              citations: result.citations,
              queryTime: result.queryTime,
            })}\n\n`
          )
        );
        await writer.close();
      }).catch(async (error) => {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
        await writer.close();
      });

      return new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const result = await ragAgent.query(
        question,
        userId,
        sessionId,
        paperId,
        options
      );

      return NextResponse.json({
        success: true,
        answer: result.answer,
        sources: result.sources,
        citations: result.citations,
        queryTime: result.queryTime,
        sessionId: result.sessionId,
      });
    }
  } catch (error: any) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error.message },
      { status: 500 }
    );
  }
}