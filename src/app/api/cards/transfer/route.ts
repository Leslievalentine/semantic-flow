import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 转移单个卡片到另一个 deck
export async function POST(request: NextRequest) {
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

        // 验证卡片属于当前用户
        const { data: existingCard, error: cardCheckError } = await supabase
            .from('cards')
            .select('id')
            .eq('id', cardId)
            .eq('user_id', currentUser.id)
            .single()

        if (cardCheckError || !existingCard) {
            return NextResponse.json(
                { success: false, error: 'Card not found or access denied' },
                { status: 404 }
            )
        }

        // 验证目标 deck 存在且属于当前用户
        const { data: targetDeck, error: deckError } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', targetDeckId)
            .eq('user_id', currentUser.id)
            .single()

        if (deckError || !targetDeck) {
            return NextResponse.json(
                { success: false, error: 'Target deck not found or access denied' },
                { status: 404 }
            )
        }

        // 更新卡片的 deck_id
        const { data: card, error: updateError } = await supabase
            .from('cards')
            .update({ deck_id: targetDeckId })
            .eq('id', cardId)
            .eq('user_id', currentUser.id)
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
