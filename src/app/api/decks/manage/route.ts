import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 删除 deck
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const deckId = searchParams.get('id')

        if (!deckId) {
            return NextResponse.json(
                { success: false, error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        // 先删除 deck 中的所有卡片
        const { error: cardsError } = await supabase
            .from('cards')
            .delete()
            .eq('deck_id', deckId)

        if (cardsError) {
            console.error('Failed to delete cards:', cardsError)
            return NextResponse.json(
                { success: false, error: 'Failed to delete cards' },
                { status: 500 }
            )
        }

        // 删除 deck
        const { error: deckError } = await supabase
            .from('decks')
            .delete()
            .eq('id', deckId)

        if (deckError) {
            console.error('Failed to delete deck:', deckError)
            return NextResponse.json(
                { success: false, error: 'Failed to delete deck' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Deck deleted successfully',
        })
    } catch (error) {
        console.error('Delete deck error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete deck' },
            { status: 500 }
        )
    }
}

// 重命名 deck
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { deckId, newTitle } = body as {
            deckId: string
            newTitle: string
        }

        if (!deckId || !newTitle?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Deck ID and new title are required' },
                { status: 400 }
            )
        }

        console.log('PATCH /api/decks/manage - Renaming deck:', { deckId, newTitle: newTitle.trim() })

        const { data: deck, error } = await supabase
            .from('decks')
            .update({ title: newTitle.trim() })
            .eq('id', deckId)
            .select()
            .single()

        console.log('Supabase update result:', { deck, error })

        if (error) {
            console.error('Supabase error details:', JSON.stringify(error, null, 2))
            return NextResponse.json(
                { success: false, error: `Failed to rename deck: ${error.message}` },
                { status: 500 }
            )
        }

        if (!deck) {
            console.error('No deck returned after update')
            return NextResponse.json(
                { success: false, error: 'Deck not found or update failed' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            deck,
        })
    } catch (error) {
        console.error('Rename deck error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to rename deck' },
            { status: 500 }
        )
    }
}

// 手动创建空 deck
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, userId } = body as {
            title: string
            userId?: string
        }

        if (!title?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            )
        }

        const { data: deck, error } = await supabase
            .from('decks')
            .insert({
                title: title.trim(),
                user_id: userId || null,
                is_custom: true,
            })
            .select()
            .single()

        if (error || !deck) {
            console.error('Failed to create deck:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create deck' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            deck,
        })
    } catch (error) {
        console.error('Create deck error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create deck' },
            { status: 500 }
        )
    }
}
