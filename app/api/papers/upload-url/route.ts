import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateProcessingStatus(paperId: string, status: 'processing' | 'failed', error?: string) {
  await supabase
    .from('papers')
    .update({
      processing_status: status,
      processing_error: error || null
    })
    .eq('id', paperId)
}

export async function POST(request: NextRequest) {
  let paperId: string | undefined

  try {
    const body = await request.json()
    const { url, title, userId } = body
    paperId = body.paperId

    if (!url || !title || !userId || !paperId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update status to processing
    await updateProcessingStatus(paperId, 'processing')

    // Validate URL format
    try {
      new URL(url)
    } catch {
      await updateProcessingStatus(paperId, 'failed', 'Invalid URL format')
      return Response.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch PDF from URL with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: Response
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })
    } catch (error: any) {
      clearTimeout(timeoutId)
      const errorMsg = error.name === 'AbortError'
        ? 'Request timeout - URL took too long to respond'
        : 'Failed to fetch URL'
      await updateProcessingStatus(paperId, 'failed', errorMsg)
      return Response.json({ error: errorMsg }, { status: error.name === 'AbortError' ? 408 : 400 })
    }
    clearTimeout(timeoutId)

    // Check content length
    const contentLength = response.headers.get('content-length')
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (contentLength && parseInt(contentLength) > maxSize) {
      await updateProcessingStatus(paperId, 'failed', 'PDF file is too large (max 10MB)')
      return Response.json({ error: 'PDF file is too large (max 10MB)' }, { status: 400 })
    }

    // Fetch actual PDF content
    const controller2 = new AbortController()
    const timeoutId2 = setTimeout(() => controller2.abort(), 30000)

    let pdfResponse: Response
    try {
      pdfResponse = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
      })
    } catch (error: any) {
      clearTimeout(timeoutId2)
      const errorMsg = error.name === 'AbortError'
        ? 'Download timeout - PDF took too long to download'
        : 'Failed to download PDF'
      await updateProcessingStatus(paperId, 'failed', errorMsg)
      return Response.json({ error: errorMsg }, { status: error.name === 'AbortError' ? 408 : 400 })
    }
    clearTimeout(timeoutId2)

    if (!pdfResponse.ok) {
      await updateProcessingStatus(paperId, 'failed', 'Failed to download PDF from URL')
      return Response.json({ error: 'Failed to download PDF from URL' }, { status: 400 })
    }

    const arrayBuffer = await pdfResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check actual size
    if (buffer.length > maxSize) {
      await updateProcessingStatus(paperId, 'failed', 'PDF file is too large (max 10MB)')
      return Response.json({ error: 'PDF file is too large (max 10MB)' }, { status: 400 })
    }

    // Validate it's actually a PDF by checking magic number
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
    if (!isPDF) {
      await updateProcessingStatus(paperId, 'failed', 'Downloaded file is not a valid PDF')
      return Response.json({ error: 'Downloaded file is not a valid PDF' }, { status: 400 })
    }

    // Create a File object from the buffer
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const file = new File([blob], 'url-upload.pdf', { type: 'application/pdf' })

    // Upload PDF to storage for preview
    const storagePath = `${userId}/${paperId}.pdf`
    console.log('Uploading PDF to storage:', storagePath)

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('papers')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload FAILED:', uploadError)
    } else {
      console.log('Storage upload SUCCESS:', uploadData)
      const { error: updateError } = await supabase
        .from('papers')
        .update({ storage_path: storagePath })
        .eq('id', paperId)

      if (updateError) {
        console.error('Failed to update storage_path:', updateError)
      } else {
        console.log('storage_path updated successfully')
      }
    }

    // Process PDF using the RAG endpoint
    const formData = new FormData()
    formData.append('file', file)
    formData.append('paper_id', paperId)
    formData.append('user_id', userId)

    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rag/process`, {
      method: 'POST',
      body: formData,
    })

    if (!processResponse.ok) {
      const errorData = await processResponse.json()
      // RAG process endpoint already updates the status to failed
      return Response.json({ error: `Processing failed: ${errorData.error || 'Unknown error'}` }, { status: 500 })
    }

    const processResult = await processResponse.json()

    return Response.json({ success: true, result: processResult }, { status: 200 })

  } catch (error: any) {
    console.error('Upload URL error:', error)
    // Update status to failed if we have paperId
    if (paperId) {
      await updateProcessingStatus(paperId, 'failed', error.message || 'Internal server error')
    }
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
