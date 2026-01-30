import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 获取单张卡片的详细信息（含复习记录）
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cardId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { cardId } = await params

        if (!cardId) {
            return NextResponse.json(
                { success: false, error: 'Card ID is required' },
                { status: 400 }
            )
        }

        // 获取卡片信息
        const { data: card, error: cardError } = await supabase
            .from('cards')
            .select(`
                id,
                chinese_concept,
                context_hint,
                anchor_data,
                deck_id,
                created_at,
                decks!inner (
                    id,
                    title,
                    user_id
                )
            `)
            .eq('id', cardId)
            .single()

        if (cardError || !card) {
            return NextResponse.json(
                { success: false, error: 'Card not found' },
                { status: 404 }
            )
        }

        // 验证用户权限
        const deck = card.decks as unknown as { id: string; title: string; user_id: string }
        if (deck.user_id !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // 获取复习记录
        const { data: review } = await supabase
            .from('reviews')
            .select('last_score, last_reviewed_at, last_user_input, last_feedback, state, interval')
            .eq('card_id', cardId)
            .eq('user_id', user.id)
            .single()

        return NextResponse.json({
            success: true,
            card: {
                id: card.id,
                chinese_concept: card.chinese_concept,
                context_hint: card.context_hint,
                anchor_data: card.anchor_data,
                deck_id: card.deck_id,
                deck_title: deck.title,
                created_at: card.created_at
            },
            review: review ? {
                last_score: review.last_score,
                last_reviewed_at: review.last_reviewed_at,
                last_user_input: review.last_user_input,
                last_feedback: review.last_feedback,
                state: review.state,
                interval: review.interval
            } : null
        })
    } catch (error) {
        console.error('Vault card detail error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
