import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

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
        const level = searchParams.get('level')
        const deckId = searchParams.get('deckId')

        let query = supabase
            .from('reviews')
            .select(`
                card_id,
                last_score,
                last_reviewed_at,
                cards!inner (
                    id,
                    chinese_concept,
                    context_hint,
                    anchor_data,
                    deck_id,
                    created_at
                )
            `)
            .eq('user_id', user.id)

        // Filter by level
        if (level) {
            let minScore = 0
            let maxScore = 10
            if (level === 'critical') { maxScore = 4.99 }
            else if (level === 'refining') { minScore = 5; maxScore = 7.99 }
            else if (level === 'mastered') { minScore = 8 }

            query = query.gte('last_score', minScore).lte('last_score', maxScore)
        }

        // Filter by deck
        if (deckId) {
            query = query.eq('cards.deck_id', deckId)
        }

        // Order by oldest reviewed first (spaced repetition style) or just shuffle?
        // Let's sort by last_reviewed_at ASC so we review oldest items first.
        query = query.order('last_reviewed_at', { ascending: true })

        const { data, error } = await query

        if (error) {
            console.error('Error fetching practice cards:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch cards' },
                { status: 500 }
            )
        }

        // Transform to flat Card objects
        const cards = data.map((review: any) => {
            let mastery_level = 'new'
            const score = review.last_score
            if (score !== null && score !== undefined) {
                if (score < 5) mastery_level = 'red'
                else if (score < 8) mastery_level = 'yellow'
                else mastery_level = 'green'
            } else {
                // logic for new if no score, though reviews table implies at least one review?
                // Actually reviews table contains *reviewed* items.
                // If it's in reviews table, it's not strictly 'new' unless score is null (unlikely).
                // However, we can default to 'red' if score is 0?
                // Let's stick to score logic.
            }

            return {
                id: review.cards.id,
                chinese_concept: review.cards.chinese_concept,
                context_hint: review.cards.context_hint,
                anchor_data: review.cards.anchor_data,
                deck_id: review.cards.deck_id,
                created_at: review.cards.created_at,
                // review metadata
                last_score: review.last_score,
                mastery_level
            }
        })

        return NextResponse.json({
            success: true,
            cards
        })

    } catch (error) {
        console.error('Practice API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
