import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 合并两个 deck
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sourceDeckId, targetDeckId } = body as {
            sourceDeckId: string
            targetDeckId: string
        }

        if (!sourceDeckId || !targetDeckId) {
            return NextResponse.json(
                { success: false, error: 'Both sourceDeckId and targetDeckId are required' },
                { status: 400 }
            )
        }

        if (sourceDeckId === targetDeckId) {
            return NextResponse.json(
                { success: false, error: 'Cannot merge a deck into itself' },
                { status: 400 }
            )
        }

        // 验证两个 deck 都存在
        const { data: sourceDeck, error: sourceError } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', sourceDeckId)
            .single()

        if (sourceError || !sourceDeck) {
            return NextResponse.json(
                { success: false, error: 'Source deck not found' },
                { status: 404 }
            )
        }

        const { data: targetDeck, error: targetError } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', targetDeckId)
            .single()

        if (targetError || !targetDeck) {
            return NextResponse.json(
                { success: false, error: 'Target deck not found' },
                { status: 404 }
            )
        }

        // 将源 deck 的所有卡片移动到目标 deck
        const { error: updateError, count } = await supabase
            .from('cards')
            .update({ deck_id: targetDeckId })
            .eq('deck_id', sourceDeckId)

        if (updateError) {
            console.error('Failed to move cards:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to move cards' },
                { status: 500 }
            )
        }

        // 删除源 deck
        const { error: deleteError } = await supabase
            .from('decks')
            .delete()
            .eq('id', sourceDeckId)

        if (deleteError) {
            console.error('Failed to delete source deck:', deleteError)
            return NextResponse.json(
                { success: false, error: 'Cards moved but failed to delete source deck' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Merged "${sourceDeck.title}" into "${targetDeck.title}"`,
            movedCards: count || 0,
            targetDeck: {
                id: targetDeck.id,
                title: targetDeck.title,
            },
        })
    } catch (error) {
        console.error('Merge deck error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to merge decks' },
            { status: 500 }
        )
    }
}
