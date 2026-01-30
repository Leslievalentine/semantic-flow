import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 转移单个卡片到另一个 deck
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cardId, targetDeckId } = body as {
            cardId: string
            targetDeckId: string
        }

        if (!cardId || !targetDeckId) {
            return NextResponse.json(
                { success: false, error: 'Card ID and target deck ID are required' },
                { status: 400 }
            )
        }

        // 验证目标 deck 存在
        const { data: targetDeck, error: deckError } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', targetDeckId)
            .single()

        if (deckError || !targetDeck) {
            return NextResponse.json(
                { success: false, error: 'Target deck not found' },
                { status: 404 }
            )
        }

        // 更新卡片的 deck_id
        const { data: card, error: updateError } = await supabase
            .from('cards')
            .update({ deck_id: targetDeckId })
            .eq('id', cardId)
            .select()
            .single()

        if (updateError || !card) {
            console.error('Failed to transfer card:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to transfer card' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Card transferred to "${targetDeck.title}"`,
            card,
        })
    } catch (error) {
        console.error('Transfer card error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to transfer card' },
            { status: 500 }
        )
    }
}
