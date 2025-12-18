import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/utils/auth'
import { createServerClientSSR } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { url, title, paperId } = await request.json()

    if (!url || !title || !paperId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServerClientSSR()
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id, user_id')
      .eq('id', paperId)
      .eq('user_id', user.id)
      .single()

    if (paperError || !paper) {
      return Response.json({ error: 'Paper not found' }, { status: 404 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
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
      if (error.name === 'AbortError') {
        return Response.json({ error: 'Request timeout - URL took too long to respond' }, { status: 408 })
      }
      return Response.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }
    clearTimeout(timeoutId)

    // Check content length
    const contentLength = response.headers.get('content-length')
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (contentLength && parseInt(contentLength) > maxSize) {
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
      if (error.name === 'AbortError') {
        return Response.json({ error: 'Download timeout - PDF took too long to download' }, { status: 408 })
      }
      return Response.json({ error: 'Failed to download PDF' }, { status: 400 })
    }
    clearTimeout(timeoutId2)

    if (!pdfResponse.ok) {
      return Response.json({ error: 'Failed to download PDF from URL' }, { status: 400 })
    }

    const arrayBuffer = await pdfResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check actual size
    if (buffer.length > maxSize) {
      return Response.json({ error: 'PDF file is too large (max 10MB)' }, { status: 400 })
    }

    // Validate it's actually a PDF by checking magic number
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
    if (!isPDF) {
      return Response.json({ error: 'Downloaded file is not a valid PDF' }, { status: 400 })
    }

    // Create a File object from the buffer
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const file = new File([blob], 'url-upload.pdf', { type: 'application/pdf' })

    // Process PDF using the RAG endpoint
    const formData = new FormData()
    formData.append('file', file)
    formData.append('paper_id', paperId)

    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/rag/process`, {
      method: 'POST',
      body: formData,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (!processResponse.ok) {
      const errorData = await processResponse.json()
      return Response.json({ error: `Processing failed: ${errorData.error || 'Unknown error'}` }, { status: 500 })
    }

    const processResult = await processResponse.json()

    return Response.json({ success: true, result: processResult }, { status: 200 })

  } catch (error: any) {
    console.error('Upload URL error:', error)
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
