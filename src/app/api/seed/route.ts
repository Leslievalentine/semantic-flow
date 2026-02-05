import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'
import { SEED_DATA } from '@/lib/seed-data'

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        let addedDecksCount = 0
        let addedCardsCount = 0

        // Iterate through seed decks
        for (const deckData of SEED_DATA) {
            // Check if user already has this deck (by title) to avoid duplicates
            // We use a loose check, maybe user renamed it. 
            // Better to check if we can query strictly.

            // 1. Create Deck
            const { data: deck, error: deckError } = await supabase
                .from('decks')
                .insert({
                    user_id: user.id,
                    title: deckData.deck_title,
                    is_custom: false // Mark as system-provided but user-owned
                })
                .select()
                .single()

            if (deckError) {
                console.error(`Error creating deck ${deckData.deck_title}:`, deckError)
                continue
            }

            addedDecksCount++

            // 2. Create Cards for this deck
            const cardsToInsert = deckData.cards.map(card => ({
                deck_id: deck.id,
                chinese_concept: card.chinese_concept,
                context_hint: card.context_hint,
                anchor_data: card.anchor_data, // JSONB array
                mastery_level: 'new',
                last_score: null
            }))

            const { data: cards, error: cardsError } = await supabase
                .from('cards')
                .insert(cardsToInsert)
                .select()

            if (cardsError) {
                console.error(`Error adding cards to deck ${deckData.deck_title}:`, cardsError)
            } else {
                addedCardsCount += cards?.length || 0
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${addedDecksCount} decks and ${addedCardsCount} cards.`,
            stats: { decks: addedDecksCount, cards: addedCardsCount }
        })

    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
