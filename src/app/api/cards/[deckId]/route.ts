import { NextRequest, NextResponse } from 'next/server'
import { supabase, Card } from '@/lib/supabase'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params

        if (!deckId) {
            return NextResponse.json(
                { success: false, error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        // 获取卡组信息
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .single()

        if (deckError || !deck) {
            return NextResponse.json(
                { success: false, error: 'Deck not found' },
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
