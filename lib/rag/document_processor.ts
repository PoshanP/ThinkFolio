import { RecursiveCharacterTextSplitter } from 'langchain/text_splitters';
import { Document } from 'langchain/document';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import crypto from 'crypto';

interface ChunkMetadata {
  paperId: string;
  pageNumber: number;
  chunkIndex: number;
  chunkType: string;
  source: string;
  title: string;
}

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
        loader = new TextLoader(filePath);
        break;
      case 'docx':
        loader = new DocxLoader(filePath);
        break;
      case 'json':
        loader = new JSONLoader(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return await loader.load();
  }

  async processDocument(
    paperId: string,
    filePath: string,
    fileType: string,
    title: string
  ): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      await this.updateProcessingStatus(paperId, 'processing');

      const documents = await this.loadDocument(filePath, fileType);

      const allChunks: Document[] = [];
      for (const doc of documents) {
        const chunks = await this.splitter.splitDocuments([doc]);
        allChunks.push(...chunks);
      }

      const chunkData = await Promise.all(
        allChunks.map(async (chunk, index) => {
          const embedding = await this.embeddings.embedQuery(chunk.pageContent);
          const pageNo = chunk.metadata?.page || Math.floor(index / 5) + 1;

          return {
            paper_id: paperId,
            page_no: pageNo,
            content: chunk.pageContent,
            embedding,
            metadata: {
              chunk_index: index,
              chunk_type: this.detectChunkType(chunk.pageContent),
              keyword_count: this.countKeywords(chunk.pageContent),
              has_equations: this.hasEquations(chunk.pageContent),
              has_citations: this.hasCitations(chunk.pageContent),
            },
          };
        })
      );

      const { data: insertedChunks, error: chunkError } = await this.supabase
        .from('paper_chunks')
        .insert(
          chunkData.map(({ metadata, ...chunk }) => chunk)
        )
        .select();

      if (chunkError) {
        throw new Error(`Failed to insert chunks: ${chunkError.message}`);
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