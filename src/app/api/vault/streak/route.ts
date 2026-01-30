import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 获取用户打卡数据
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

        // 获取用户设置（每日目标）
        const { data: settings } = await supabase
            .from('user_settings')
            .select('daily_goal')
            .eq('user_id', user.id)
            .single()

        const dailyGoal = settings?.daily_goal || 20

        // 计算今天的开始和结束时间 (UTC)
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

        // 统计今天的练习次数
        const { count: todayCount, error: countError } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('last_reviewed_at', todayStart.toISOString())
            .lt('last_reviewed_at', todayEnd.toISOString())

        if (countError) {
            console.error('Error counting today reviews:', countError)
        }

        // 计算连续打卡天数
        let streakDays = 0
        const checkDate = new Date(todayStart)

        // 从今天开始往前检查
        for (let i = 0; i < 365; i++) {
            const dayStart = new Date(checkDate)
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

            const { count } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('last_reviewed_at', dayStart.toISOString())
                .lt('last_reviewed_at', dayEnd.toISOString())

            if (count && count > 0) {
                streakDays++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                // 如果是今天且还没练习，继续检查昨天
                if (i === 0 && (!todayCount || todayCount === 0)) {
                    checkDate.setDate(checkDate.getDate() - 1)
                    continue
                }
                break
            }
        }

        return NextResponse.json({
            success: true,
            streak: {
                today_count: todayCount || 0,
                daily_goal: dailyGoal,
                streak_days: streakDays,
                is_complete: (todayCount || 0) >= dailyGoal
            }
        })
    } catch (error) {
        console.error('Vault streak error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// 更新每日目标
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { daily_goal } = body as { daily_goal: number }

        if (!daily_goal || daily_goal < 1 || daily_goal > 100) {
            return NextResponse.json(
                { success: false, error: 'Invalid daily_goal. Must be between 1 and 100.' },
                { status: 400 }
            )
        }

        // Upsert 用户设置
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                daily_goal,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })

        if (error) {
            console.error('Error updating settings:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to update settings' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            daily_goal
        })
    } catch (error) {
        console.error('Update goal error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
