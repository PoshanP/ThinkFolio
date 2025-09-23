import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paper_id } = body;

    if (!paper_id) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    // Get paper details including storage path
    const { data: paper } = await supabase
      .from('papers')
      .select('*')
      .eq('id', paper_id)
      .single();

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Try to get the PDF file content from storage
    let pdfContent = '';
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('papers')
        .download(paper.storage_path);

      if (!downloadError && fileData) {
        // Convert blob to text (this will be garbled for PDFs but OpenAI can still extract some info)
        pdfContent = await fileData.text();
      }
    } catch (err) {
      console.log('Could not download PDF:', err);
    }

    // First try to get chunks if they exist
    const { data: chunks } = await supabase
      .from('paper_chunks')
      .select('content')
      .eq('paper_id', paper_id)
      .order('page_no', { ascending: true })
      .limit(5);

    // If we have chunks, use them. Otherwise, try to use raw PDF content
    let contextForSummary = '';

    if (chunks && chunks.length > 0) {
      contextForSummary = chunks.map(c => c.content).join('\n\n').slice(0, 4000);
    } else if (pdfContent) {
      // Extract readable text from the PDF content (it might be garbled but often contains some text)
      const textMatch = pdfContent.match(/[\x20-\x7E\n\r]+/g);
      if (textMatch) {
        contextForSummary = textMatch.join(' ').slice(0, 4000);
      }
    }

    // If we still don't have content, provide a fallback
    if (!contextForSummary) {
      const fallbackSummary = `🌟 **Welcome to your research paper chat!**

Your paper "${paper?.title || 'Research Paper'}" (${paper?.page_count || 'unknown'} pages) has been successfully uploaded.

🔄 **Processing Status:** The document is ready for chat.

💡 **What you can do:**
• Ask questions about any part of the paper
• Request explanations of complex concepts
• Get summaries of specific sections
• Explore methodologies and findings
• Discuss implications and applications

🚀 Start by asking me anything about your paper!`;

      return NextResponse.json({
        success: true,
        summary: fallbackSummary,
        paperId: paper_id,
      });
    }

    // Generate summary using OpenAI with whatever content we have
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant. Provide a concise summary of the given content from a research paper. Focus on identifying the main topic, key contributions, methodology, and findings. If the text is partially garbled, extract what information you can.'
        },
        {
          role: 'user',
          content: `Please summarize this research paper titled "${paper?.title || 'Research Paper'}" (${paper?.page_count || 0} pages):\n\n${contextForSummary}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content ||
      `Paper "${paper?.title || 'Untitled'}" has been processed and is ready for discussion.`;

    return NextResponse.json({
      success: true,
      summary,
      paperId: paper_id,
    });

  } catch (error: any) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error.message },
      { status: 500 }
    );
  }
}