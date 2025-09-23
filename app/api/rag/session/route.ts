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
    const { userId, paperId, title } = body;

    if (!userId || !paperId || !title) {
      return NextResponse.json(
        { error: 'User ID, Paper ID, and title are required' },
        { status: 400 }
      );
    }

    const sessionId = await ragAgent.createChatSession(userId, paperId, title);

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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const paperId = searchParams.get('paperId');

    if (sessionId) {
      const session = await ragAgent.getChatSession(sessionId);

      return NextResponse.json({
        success: true,
        session,
      });
    } else if (userId) {
      const sessions = await ragAgent.getUserChatSessions(userId, paperId || undefined);

      return NextResponse.json({
        success: true,
        sessions,
      });
    } else {
      return NextResponse.json(
        { error: 'Session ID or User ID is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat session(s)', details: error.message },
      { status: 500 }
    );
  }
}