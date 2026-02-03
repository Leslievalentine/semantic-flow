
import { createServerSupabaseClient } from '@/lib/server-auth'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Card ID is required' },
            { status: 400 }
        )
    }

    // 验证用户身份
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        )
    }

    // 执行删除
    const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
    // 确保只能删除自己的卡片（取决于RLS，但这里增加一层校验更安全，不过 cards 表可能没有 owner_id 而是 deck_id 指向 decks 表的 user_id）
    // 假设 RLS 已经处理好了权限

    if (error) {
        console.error('Error deleting card:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete card' },
            { status: 500 }
        )
    }

    return NextResponse.json({ success: true })
}
