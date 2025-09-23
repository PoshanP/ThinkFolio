import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  modelName: 'text-embedding-3-small',
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function POST(request: NextRequest) {
  let paperId: string | undefined;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    paperId = formData.get('paper_id') as string;
    const userId = formData.get('user_id') as string;

    if (!file || !paperId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update processing status
    await supabase
      .from('document_processing_status')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('paper_id', paperId);

    // For simple processing, we'll treat the PDF as text
    // In production, you'd use a proper PDF parser
    const fileContent = await file.text();

    // Split the content into chunks
    const chunks = await textSplitter.createDocuments([fileContent]);

    // Generate embeddings and store chunks
    const chunkData = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await embeddings.embedQuery(chunk.pageContent);
        const pageNo = Math.floor(index / 5) + 1; // Estimate page numbers

        return {
          paper_id: paperId,
          page_no: pageNo,
          content: chunk.pageContent.slice(0, 2000), // Limit content length
          embedding,
          metadata: {
            chunk_index: index,
            chunk_type: 'body',
          },
        };
      })
    );

    // Insert chunks into database
    const { data: insertedChunks, error: chunkError } = await supabase
      .from('paper_chunks')
      .insert(
        chunkData.map(({ metadata, ...chunk }) => chunk)
      )
      .select();

    if (chunkError) {
      throw new Error(`Failed to insert chunks: ${chunkError.message}`);
    }

    // Store metadata
    if (insertedChunks) {
      const metadataInserts = insertedChunks.map((chunk: any, index: number) => ({
        chunk_id: chunk.id,
        chunk_index: index,
        chunk_type: 'body',
        keyword_count: 0,
        has_equations: false,
        has_citations: false,
      }));

      await supabase.from('paper_chunks_metadata').insert(metadataInserts);
    }

    // Update processing status to completed
    await supabase
      .from('document_processing_status')
      .update({
        status: 'completed',
        chunks_created: chunks.length,
        completed_at: new Date().toISOString()
      })
      .eq('paper_id', paperId);

    return NextResponse.json({
      success: true,
      paperId: paperId,
      chunksCreated: chunks.length,
      message: `Successfully processed ${chunks.length} chunks`,
    });

  } catch (error: any) {
    console.error('Document processing error:', error);

    // Update status to failed if we have paperId
    if (paperId) {
      await supabase
        .from('document_processing_status')
        .update({
          status: 'failed',
          error: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('paper_id', paperId);
    }

    return NextResponse.json(
      { error: 'Failed to process document', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    const { data: status } = await supabase
      .from('document_processing_status')
      .select('*')
      .eq('paper_id', paperId)
      .single();

    const { count } = await supabase
      .from('paper_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('paper_id', paperId);

    return NextResponse.json({
      success: true,
      stats: {
        status: status?.status || 'pending',
        chunksCreated: count || 0,
        processingTime: status?.completed_at ?
          new Date(status.completed_at).getTime() - new Date(status.started_at).getTime() : 0
      },
    });
  } catch (error: any) {
    console.error('Get document stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get document stats', details: error.message },
      { status: 500 }
    );
  }
}