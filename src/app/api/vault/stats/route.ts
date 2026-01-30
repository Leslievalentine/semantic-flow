import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 获取用户卡片掌握程度统计
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 获取所有有评分的复习记录
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('last_score')
            .eq('user_id', user.id)
            .not('last_score', 'is', null)

        if (error) {
            console.error('Error fetching reviews:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch stats' },
                { status: 500 }
            )
        }

        // 按分数分类统计
        let critical = 0  // < 5
        let refining = 0  // 5-7.9
        let mastered = 0  // >= 8

        for (const review of reviews || []) {
            const score = review.last_score
            if (score === null) continue

            if (score < 5) {
                critical++
            } else if (score < 8) {
                refining++
            } else {
                mastered++
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                critical,
                refining,
                mastered,
                total: critical + refining + mastered
            }
        })
    } catch (error) {
        console.error('Vault stats error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
