import { createServerClientSSR } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClientSSR()

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paperId, messageId, chunkId, highlightedText, pageNo, notes } = body

    if (!paperId || !highlightedText) {
      return NextResponse.json(
        { error: 'Missing required fields: paperId and highlightedText' },
        { status: 400 }
      )
    }

    // Verify paper belongs to user
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id')
      .eq('id', paperId)
      .eq('user_id', user.id)
      .single()

    if (paperError || !paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      )
    }

    // Save highlight
    const { data: highlight, error: highlightError } = await supabase
      .from('saved_highlights')
      .insert({
        user_id: user.id,
        paper_id: paperId,
        message_id: messageId || null,
        chunk_id: chunkId || null,
        highlighted_text: highlightedText,
        page_no: pageNo || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (highlightError) {
      console.error('Error saving highlight:', highlightError)
      return NextResponse.json(
        { error: 'Failed to save highlight', details: highlightError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: highlight })
  } catch (error: any) {
    console.error('Highlight save error:', error)
    return NextResponse.json(
      { error: 'Failed to save highlight', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClientSSR()

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paperId = searchParams.get('paperId')

    let query = supabase
      .from('saved_highlights')
      .select(`
        *,
        papers (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (paperId) {
      query = query.eq('paper_id', paperId)
    }

    const { data: highlights, error } = await query

    if (error) {
      console.error('Error fetching highlights:', error)
      return NextResponse.json(
        { error: 'Failed to fetch highlights', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: highlights || [] })
  } catch (error: any) {
    console.error('Highlight fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch highlights', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClientSSR()

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const highlightId = searchParams.get('id')

    if (!highlightId) {
      return NextResponse.json(
        { error: 'Missing highlight ID' },
        { status: 400 }
      )
    }

    // Verify highlight belongs to user before deleting
    const { error } = await supabase
      .from('saved_highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting highlight:', error)
      return NextResponse.json(
        { error: 'Failed to delete highlight', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { message: 'Highlight deleted successfully' } })
  } catch (error: any) {
    console.error('Highlight delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete highlight', details: error.message },
      { status: 500 }
    )
  }
}
