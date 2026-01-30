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

        // 获取每个卡组的卡片数量
        const decksWithCount = await Promise.all(
            (decks as Deck[]).map(async (deck) => {
                const { count } = await supabase
                    .from('cards')
                    .select('*', { count: 'exact', head: true })
                    .eq('deck_id', deck.id)

                return {
                    ...deck,
                    card_count: count || 0,
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
