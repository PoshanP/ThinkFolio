import { NextRequest, NextResponse } from 'next/server';
import { RAGAgent } from '@/lib/rag/rag_agent';
import { ConfigManager, loadConfigFromEnv } from '@/lib/rag/config';
import { requireAuth } from '@/lib/utils/auth';
import { createServerClientSSR } from '@/lib/supabase/server';

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
    const user = await requireAuth();
    const body = await request.json();
    const {
      question,
      sessionId,
      paperId,
      retrievalOptions = {},
      stream = false,
    } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClientSSR();

    // Validate session ownership when provided
    if (sessionId) {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('id, user_id, paper_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single<{ id: string; user_id: string; paper_id: string | null }>();

      if (error || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      if (paperId && session.paper_id && session.paper_id !== paperId) {
        return NextResponse.json(
          { error: 'Paper does not belong to the requested session' },
          { status: 400 }
        );
      }
    }

    // Validate paper ownership when provided
    if (paperId) {
      const { data: paper, error } = await supabase
        .from('papers')
        .select('id, user_id')
        .eq('id', paperId)
        .eq('user_id', user.id)
        .single();

      if (error || !paper) {
        return NextResponse.json(
          { error: 'Paper not found' },
          { status: 404 }
        );
      }
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
        user.id,
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
        user.id,
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
