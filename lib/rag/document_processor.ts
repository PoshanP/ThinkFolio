import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// Removed unused interface ChunkMetadata
/*interface ChunkMetadata {
  paperId: string;
  pageNumber: number;
  chunkIndex: number;
  chunkType: string;
  source: string;
  title: string;
}*/

interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  semanticChunking?: boolean;
  extractMetadata?: boolean;
}

export class DocumentProcessor {
  private splitter: RecursiveCharacterTextSplitter;
  private embeddings: OpenAIEmbeddings;
  private supabase: any;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string,
    options: ProcessingOptions = {}
  ) {
    const { chunkSize = 1000, chunkOverlap = 100 } = options;

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', ''],
      lengthFunction: (text: string) => text.length,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-3-large',
      dimensions: 1536,
    });

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async loadDocument(filePath: string, fileType: string): Promise<Document[]> {
    let loader;

    switch (fileType.toLowerCase()) {
      case 'pdf':
        loader = new PDFLoader(filePath, {
          splitPages: true,
        });
        break;
      case 'txt':
      case 'md':
        // For text files, we'll create a simple document
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf-8');
        return [new Document({ pageContent: content, metadata: { source: filePath } })];
      case 'docx':
        loader = new DocxLoader(filePath);
        break;
      case 'json':
        // For JSON files, we'll parse and stringify
        const fsJson = await import('fs/promises');
        const jsonContent = await fsJson.readFile(filePath, 'utf-8');
        const parsedJson = JSON.parse(jsonContent);
        return [new Document({ pageContent: JSON.stringify(parsedJson, null, 2), metadata: { source: filePath } })];
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return await loader.load();
  }

  async processDocument(
    paperId: string,
    filePath: string,
    fileType: string,
    _title: string
  ): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      await this.updateProcessingStatus(paperId, 'processing');

      const documents = await this.loadDocument(filePath, fileType);

      const allChunks: Document[] = [];
      for (const doc of documents) {
        const chunks = await this.splitter.splitDocuments([doc]);
        allChunks.push(...chunks);
      }

      // Batch process embeddings for 5-10x performance improvement
      const batchSize = 50; // Process in batches to avoid memory issues
      const chunkData: any[] = [];

      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        const batchTexts = batch.map(chunk => chunk.pageContent);

        // Generate embeddings in batch (much faster than individual calls)
        const batchEmbeddings = await this.embeddings.embedDocuments(batchTexts);

        const batchData = batch.map((chunk, batchIndex) => {
          const globalIndex = i + batchIndex;
          const pageNo = chunk.metadata?.page || Math.floor(globalIndex / 5) + 1;

          return {
            paper_id: paperId,
            page_no: pageNo,
            content: chunk.pageContent,
            embedding: batchEmbeddings[batchIndex],
            metadata: {
              chunk_index: globalIndex,
              chunk_type: this.detectChunkType(chunk.pageContent),
              keyword_count: this.countKeywords(chunk.pageContent),
              has_equations: this.hasEquations(chunk.pageContent),
              has_citations: this.hasCitations(chunk.pageContent),
            },
          };
        });

        chunkData.push(...batchData);

        // Progress logging for large documents
        if (allChunks.length > 100) {
          console.log(`Processed embeddings: ${Math.min(i + batchSize, allChunks.length)}/${allChunks.length}`);
        }
      }

      console.log('DEBUG: Sample chunk to insert:', chunkData[0]);
      console.log('DEBUG: Total chunks to insert:', chunkData.length);

      const { data: insertedChunks, error: chunkError } = await this.supabase
        .from('paper_chunks')
        .insert(
          chunkData.map(({ ...chunk }) => chunk)
        )
        .select();

      console.log('DEBUG: Insert result - data:', insertedChunks?.length, 'error:', chunkError);

      if (chunkError) {
        console.error('CHUNK INSERT ERROR:', chunkError);
        throw new Error(`Failed to insert chunks: ${chunkError.message}`);
      }

      if (insertedChunks && insertedChunks.length > 0) {
        console.log('DEBUG: Successfully inserted chunks:', insertedChunks.length);

        // IMMEDIATE VERIFICATION: Check if data is actually in database
        const { count: verifyCount, error: verifyError } = await this.supabase
          .from('paper_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('paper_id', paperId);

        console.log('DEBUG: IMMEDIATE VERIFICATION - chunks in DB for this paper:', verifyCount, 'error:', verifyError);
      } else {
        console.error('DEBUG: NO CHUNKS WERE INSERTED - this is the problem!');
      }

      if (insertedChunks) {
        const metadataInserts = insertedChunks.map((chunk: any, index: number) => ({
          chunk_id: chunk.id,
          chunk_index: chunkData[index].metadata.chunk_index,
          chunk_type: chunkData[index].metadata.chunk_type,
          keyword_count: chunkData[index].metadata.keyword_count,
          has_equations: chunkData[index].metadata.has_equations,
          has_citations: chunkData[index].metadata.has_citations,
        }));

        await this.supabase.from('paper_chunks_metadata').insert(metadataInserts);
      }

      // Calculate actual page count from PDF documents
      const pageCount = this.calculatePageCount(documents);

      // Update the paper's page count in the database
      await this.supabase
        .from('papers')
        .update({ page_count: pageCount })
        .eq('id', paperId);

      await this.updateProcessingStatus(paperId, 'completed', allChunks.length);

      return {
        success: true,
        chunksCreated: allChunks.length,
      };
    } catch (error: any) {
      await this.updateProcessingStatus(paperId, 'failed', 0, error.message);
      return {
        success: false,
        chunksCreated: 0,
        error: error.message,
      };
    }
  }

  private detectChunkType(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('abstract')) return 'abstract';
    if (lowerText.includes('introduction')) return 'introduction';
    if (lowerText.includes('methodology') || lowerText.includes('methods')) return 'methodology';
    if (lowerText.includes('results')) return 'results';
    if (lowerText.includes('conclusion')) return 'conclusion';
    if (lowerText.includes('references') || lowerText.includes('bibliography')) return 'references';
    if (lowerText.includes('figure') || lowerText.includes('fig.')) return 'figure_caption';
    if (lowerText.includes('table')) return 'table';

    return 'body';
  }

  private countKeywords(text: string): number {
    const keywords = [
      'therefore', 'however', 'moreover', 'furthermore', 'consequently',
      'hypothesis', 'analysis', 'significant', 'correlation', 'evidence',
      'research', 'study', 'experiment', 'observation', 'conclusion',
    ];

    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword)).length;
  }

  private hasEquations(text: string): boolean {
    const equationPatterns = [
      /\$.*?\$/,
      /\\begin\{equation\}/,
      /\\\[.*?\\\]/,  // Matches LaTeX display equations \[...\]
      /[a-z]\s*=\s*[\d\w]/i,
      /∑|∏|∫|√|±|≈|≠|≤|≥/,
    ];

    return equationPatterns.some(pattern => pattern.test(text));
  }

  private hasCitations(text: string): boolean {
    const citationPatterns = [
      /\[\d+\]/,
      /\(\d{4}\)/,
      /et al\./,
      /\([A-Z][a-z]+,?\s+\d{4}\)/,
    ];

    return citationPatterns.some(pattern => pattern.test(text));
  }

  private calculatePageCount(documents: Document[]): number {
    // For PDFs with splitPages: true, each document represents a page
    // We need to find the highest page number from metadata
    let maxPage = 0;

    for (const doc of documents) {
      const pageNumber = doc.metadata?.page;
      if (pageNumber && typeof pageNumber === 'number') {
        maxPage = Math.max(maxPage, pageNumber);
      }
    }

    // If we couldn't find page metadata, use document count as fallback
    // (each document = one page when splitPages is true)
    return maxPage > 0 ? maxPage : documents.length;
  }

  private async updateProcessingStatus(
    paperId: string,
    status: string,
    totalChunks: number = 0,
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'processing') {
      updateData.processing_started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.processing_completed_at = new Date().toISOString();
      updateData.total_chunks = totalChunks;
      updateData.processed_chunks = totalChunks;
    } else if (status === 'failed') {
      updateData.error_message = errorMessage;
    }

    const { data: existingStatus } = await this.supabase
      .from('document_processing_status')
      .select('id')
      .eq('paper_id', paperId)
      .single();

    if (existingStatus) {
      await this.supabase
        .from('document_processing_status')
        .update(updateData)
        .eq('paper_id', paperId);
    } else {
      await this.supabase
        .from('document_processing_status')
        .insert({ paper_id: paperId, ...updateData });
    }
  }

  async reprocessDocument(paperId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.supabase
        .from('paper_chunks')
        .delete()
        .eq('paper_id', paperId);

      const { data: paper, error } = await this.supabase
        .from('papers')
        .select('*')
        .eq('id', paperId)
        .single();

      if (error || !paper) {
        throw new Error('Paper not found');
      }

      const result = await this.processDocument(
        paperId,
        paper.storage_path,
        paper.source.split('.').pop(),
        paper.title
      );

      return {
        success: result.success,
        message: result.success
          ? `Successfully reprocessed document with ${result.chunksCreated} chunks`
          : `Failed to reprocess: ${result.error}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Reprocessing failed: ${error.message}`,
      };
    }
  }

  async getProcessingStatus(paperId: string) {
    const { data, error } = await this.supabase
      .from('document_processing_status')
      .select('*')
      .eq('paper_id', paperId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}