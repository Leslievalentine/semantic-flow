import { NextRequest, NextResponse } from 'next/server'
import { Card } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/server-auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        // 验证用户认证
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { deckId } = await params

        if (!deckId) {
            return NextResponse.json(
                { success: false, error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        // 获取卡组信息（验证属于当前用户）
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .eq('user_id', currentUser.id)
            .single()

        if (deckError || !deck) {
            return NextResponse.json(
                { success: false, error: 'Deck not found or access denied' },
                { status: 404 }
            )
        }

        // 获取卡组的所有卡片
        const { data: cards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('deck_id', deckId)
            .order('created_at', { ascending: true })

        if (cardsError) {
            console.error('Fetch cards error:', cardsError)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch cards' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            deck,
            cards: cards as Card[],
        })
    } catch (error) {
        console.error('Cards API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
