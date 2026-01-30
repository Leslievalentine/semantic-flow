import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 按掌握程度获取卡片列表，按话题(deck)分组
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const level = searchParams.get('level') // critical | refining | mastered

        if (!level || !['critical', 'refining', 'mastered'].includes(level)) {
            return NextResponse.json(
                { success: false, error: 'Invalid level parameter. Use: critical, refining, or mastered' },
                { status: 400 }
            )
        }

        // 确定分数范围
        let minScore: number
        let maxScore: number

        switch (level) {
            case 'critical':
                minScore = 0
                maxScore = 4.99
                break
            case 'refining':
                minScore = 5
                maxScore = 7.99
                break
            case 'mastered':
                minScore = 8
                maxScore = 10
                break
            default:
                minScore = 0
                maxScore = 10
        }

        // 获取符合分数范围的复习记录，联表查询卡片和卡组信息
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                card_id,
                last_score,
                last_reviewed_at,
                last_user_input,
                last_feedback,
                cards!inner (
                    id,
                    chinese_concept,
                    context_hint,
                    anchor_data,
                    deck_id,
                    decks!inner (
                        id,
                        title
                    )
                )
            `)
            .eq('user_id', user.id)
            .gte('last_score', minScore)
            .lte('last_score', maxScore)
            .order('last_reviewed_at', { ascending: false })

        if (error) {
            console.error('Error fetching cards:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch cards' },
                { status: 500 }
            )
        }

        // 按 deck (话题) 分组
        const topicsMap = new Map<string, {
            topic: string
            deck_id: string
            cards: Array<{
                id: string
                chinese_concept: string
                context_hint: string
                anchor_data: unknown[]
                last_score: number
                last_reviewed_at: string
            }>
        }>()

        for (const review of reviews || []) {
            const card = review.cards as unknown as {
                id: string
                chinese_concept: string
                context_hint: string
                anchor_data: unknown[]
                deck_id: string
                decks: { id: string; title: string }
            }

            if (!card || !card.decks) continue

            const deckId = card.deck_id
            const deckTitle = card.decks.title

            if (!topicsMap.has(deckId)) {
                topicsMap.set(deckId, {
                    topic: deckTitle,
                    deck_id: deckId,
                    cards: []
                })
            }

            topicsMap.get(deckId)!.cards.push({
                id: card.id,
                chinese_concept: card.chinese_concept,
                context_hint: card.context_hint,
                anchor_data: card.anchor_data as unknown[],
                last_score: review.last_score,
                last_reviewed_at: review.last_reviewed_at
            })
        }

        const topics = Array.from(topicsMap.values())

        return NextResponse.json({
            success: true,
            level,
            topics,
            total: reviews?.length || 0
        })
    } catch (error) {
        console.error('Vault cards error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
