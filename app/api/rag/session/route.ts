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
    const supabase = await createServerClientSSR();

    const body = await request.json();
    const { paperId, title } = body;

    if (!paperId || !title) {
      return NextResponse.json(
        { error: 'Paper ID and title are required' },
        { status: 400 }
      );
    }

    // Ensure the paper belongs to the authenticated user
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id, user_id')
      .eq('id', paperId)
      .eq('user_id', user.id)
      .single();

    if (paperError || !paper) {
      return NextResponse.json(
        { error: 'Paper not found or access denied' },
        { status: 404 }
      );
    }

    const sessionId = await ragAgent.createChatSession(user.id, paperId, title);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Chat session created successfully',
    });
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const paperId = searchParams.get('paperId');

    if (sessionId) {
      const supabase = await createServerClientSSR();

      // Ensure session belongs to the authenticated user
      const { data: sessionOwner, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !sessionOwner) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      const session = await ragAgent.getChatSession(sessionId);

      if (!session || session.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session,
      });
    } else {
      const sessions = await ragAgent.getUserChatSessions(user.id, paperId || undefined);

      return NextResponse.json({
        success: true,
        sessions,
      });
    }
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat session(s)', details: error.message },
      { status: 500 }
    );
  }
}
