import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFService } from '@/lib/services/pdf.service';
import { requireAuth } from '@/lib/utils/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  modelName: 'text-embedding-3-small',
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();
  let paperId: string | undefined;

  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    paperId = formData.get('paper_id') as string;

    if (!file || !paperId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure the paper belongs to the authenticated user
    const { data: paper, error: paperError } = await adminClient
      .from('papers')
      .select('id, user_id')
      .eq('id', paperId)
      .single();

    if (paperError || !paper || paper.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Paper not found or access denied' },
        { status: 404 }
      );
    }

    // Update processing status
    await adminClient
      .from('document_processing_status')
      .update({ status: 'processing', processing_started_at: new Date().toISOString() })
      .eq('paper_id', paperId);

    // Process PDF content for embedding
    console.log('Processing PDF file...');
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate and extract PDF content
    const pdfMetadata = await PDFService.extractMetadata(buffer);
    console.log(`Extracted text from PDF: ${pdfMetadata.textContent.length} characters`);

    // Clean content to avoid Unicode issues
    const fileContent = pdfMetadata.textContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/"/g, '\\"'); // Escape quotes

    // Split the content into chunks
    const chunks = await textSplitter.createDocuments([fileContent]);

    // Generate embeddings and store chunks instantly
    console.log(`Processing ${chunks.length} chunks...`);
    const chunkData = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await embeddings.embedQuery(chunk.pageContent);
        const pageNo = Math.floor(index / 5) + 1; // Estimate page numbers

        // Clean the chunk content for database insertion
        const cleanContent = chunk.pageContent
          .slice(0, 2000)
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/\\/g, '\\\\') // Escape backslashes
          .replace(/'/g, "''") // Escape single quotes for SQL
          .replace(/"/g, '\\"'); // Escape double quotes

        return {
          paper_id: paperId,
          page_no: pageNo,
          content: cleanContent,
          embedding,
          metadata: {
            chunk_index: index,
            chunk_type: 'body',
          },
        };
      })
    );

    // Insert chunks into database
    console.log(`Inserting ${chunkData.length} chunks into database...`);
    const chunksToInsert = chunkData.map(({ metadata: _metadata, ...chunk }) => chunk);

    console.log('DEBUG: Sample chunk to insert:', chunksToInsert[0]);
    console.log('DEBUG: Total chunks to insert:', chunksToInsert.length);

    const { data: insertedChunks, error: chunkError } = await adminClient
      .from('paper_chunks')
      .insert(chunksToInsert)
      .select();

    console.log('DEBUG: Insert result - data:', insertedChunks?.length || 0, 'error:', chunkError);

    if (chunkError) {
      console.error('DEBUG: Chunk insertion error details:', chunkError);
      throw new Error(`Failed to insert chunks: ${chunkError.message}`);
    }

    console.log('DEBUG: Successfully inserted chunks:', insertedChunks?.length || 0);

    // Store metadata
    if (insertedChunks && insertedChunks.length > 0) {
      const metadataInserts = insertedChunks.map((chunk: any, index: number) => ({
        chunk_id: chunk.id,
        chunk_index: index,
        chunk_type: 'body',
        keyword_count: 0,
        has_equations: false,
        has_citations: false,
      }));

      await adminClient.from('paper_chunks_metadata').insert(metadataInserts);
    }

    // Update processing status to completed
    await adminClient
      .from('document_processing_status')
      .update({
        status: 'completed',
        total_chunks: chunks.length,
        processing_completed_at: new Date().toISOString()
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
      const adminClient = createAdminClient();
      await adminClient
        .from('document_processing_status')
        .update({
          status: 'failed',
          error_message: error.message,
          processing_completed_at: new Date().toISOString()
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
    const user = await requireAuth();
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    // Ensure the paper belongs to the authenticated user
    const { data: paper, error: paperError } = await adminClient
      .from('papers')
      .select('id, user_id')
      .eq('id', paperId)
      .single();

    if (paperError || !paper || paper.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Paper not found or access denied' },
        { status: 404 }
      );
    }

    const { data: status } = await adminClient
      .from('document_processing_status')
      .select('*')
      .eq('paper_id', paperId)
      .single();

    const { count } = await adminClient
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
