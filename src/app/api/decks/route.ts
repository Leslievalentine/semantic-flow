import { NextResponse } from 'next/server'
import { Deck } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/server-auth'

export async function GET() {
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

        // 检查 Supabase 配置
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { success: false, error: 'Supabase configuration missing' },
                { status: 500 }
            )
        }

        // 获取当前用户的卡组
        const { data: decks, error } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch decks error:', error)
            return NextResponse.json(
                {
                    success: false,
                    error: `Database error: ${error.message}`,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 }
            )
        }

        // 如果没有数据，返回空数组
        if (!decks || decks.length === 0) {
            return NextResponse.json({
                success: true,
                decks: [],
            })
        }

        // 获取每个卡组的卡片数量和已练习数量
        const decksWithCount = await Promise.all(
            (decks as Deck[]).map(async (deck) => {
                // Total cards count
                const { count: totalCount } = await supabase
                    .from('cards')
                    .select('*', { count: 'exact', head: true })
                    .eq('deck_id', deck.id)

                // Practiced cards count (unique cards with reviews)
                // We need to join with reviews, or query reviews for this deck's cards
                // A more efficient way given Supabase constraints:
                // Get all card IDs for this deck, then count reviews matching those IDs
                const { data: deckCards } = await supabase
                    .from('cards')
                    .select('id')
                    .eq('deck_id', deck.id)

                let practicedCount = 0
                if (deckCards && deckCards.length > 0) {
                    const cardIds = deckCards.map(c => c.id)
                    const { count } = await supabase
                        .from('reviews')
                        .select('card_id', { count: 'exact', head: true }) // head:true is efficient
                        .eq('user_id', currentUser.id)
                        .in('card_id', cardIds)
                    // Note: If a user reviews the same card multiple times, it creates multiple review records?
                    // Wait, the schema uses a unique constraint or updates existing?
                    // Let's check api/evaluate/route.ts. It does UPDATE if exists.
                    // So count of reviews == count of practiced cards.
                    // Assuming one review row per card per user.

                    practicedCount = count || 0
                }

                return {
                    ...deck,
                    card_count: totalCount || 0,
                    practiced_count: practicedCount
                }
            })
        )

        return NextResponse.json({
            success: true,
            decks: decksWithCount,
        })
    } catch (error) {
        console.error('Decks API error:', error)
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
            { status: 500 }
        )
    }
}
