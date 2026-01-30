import { NextRequest, NextResponse } from 'next/server'
import { supabase, AnchorItem } from '@/lib/supabase'

// 手动上传卡片 API
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { deckId, card } = body as {
            deckId: string
            card: {
                chinese_concept: string
                context_hint: string
                anchor_data: { text: string; tag: string }[]
            }
        }

        // 验证必要字段
        if (!deckId || !card?.chinese_concept || !card?.anchor_data?.length) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 验证卡组存在
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('id')
            .eq('id', deckId)
            .single()

        if (deckError || !deck) {
            return NextResponse.json(
                { success: false, error: 'Deck not found' },
                { status: 404 }
            )
        }

        // 插入卡片
        const { data: newCard, error: insertError } = await supabase
            .from('cards')
            .insert({
                deck_id: deckId,
                chinese_concept: card.chinese_concept,
                context_hint: card.context_hint || '',
                anchor_data: card.anchor_data as AnchorItem[],
            })
            .select()
            .single()

        if (insertError) {
            console.error('Insert card error:', insertError)
            return NextResponse.json(
                { success: false, error: 'Failed to insert card' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            card: newCard,
        })
    } catch (error) {
        console.error('Upload card error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to upload card' },
            { status: 500 }
        )
    }
}
