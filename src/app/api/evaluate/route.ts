import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { deepseek, MODEL_NAME, SEMANTIC_JUDGE_PROMPT, EvaluationResult } from '@/lib/ai'
import { AnchorItem } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 评估结果 Schema
const EvaluationSchema = z.object({
    judgment: z.object({
        status: z.enum(['PASS', 'REVIEW', 'FAIL']),
        score: z.number().min(0).max(10),
    }),
    feedback: z.object({
        critique: z.string(),
        gap_analysis: z.string(),
    }),
})

// SIP 算法：根据评分更新复习参数（改进版）
function calculateSIPUpdate(
    currentEaseFactor: number,
    currentInterval: number,
    score: number
): { newEaseFactor: number; newInterval: number; state: 'new' | 'learning' | 'review' } {
    // 限制 ease factor 范围
    const clampEF = (ef: number) => Math.min(3.0, Math.max(1.3, ef))

    if (score < 5) {
        // 🔴 不及格：间隔清零，明天强制复习
        const newEaseFactor = clampEF(currentEaseFactor - 0.3)
        return {
            newEaseFactor,
            newInterval: 0,  // 0 表示明天复习
            state: 'learning'
        }
    } else if (score < 8) {
        // 🟡 及格但需巩固：短期复习（1-3天）
        const newEaseFactor = clampEF(currentEaseFactor - 0.1)
        // 间隔缩短或保持在 1-3 天
        const newInterval = Math.max(1, Math.min(3, Math.round(currentInterval * 0.5)))
        return {
            newEaseFactor,
            newInterval,
            state: 'learning'
        }
    } else {
        // 🟢 精通：延长间隔，推向未来
        const newEaseFactor = clampEF(currentEaseFactor + 0.1)
        // 首次或从 0 开始的话设为 1 天，否则按 EF 递增
        const newInterval = currentInterval === 0 ? 1 : Math.round(currentInterval * newEaseFactor)
        return {
            newEaseFactor,
            newInterval: Math.min(365, newInterval),  // 最长 1 年
            state: 'review'
        }
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { userSentence, cardId, anchorData, chineseConcept } = body as {
            userSentence: string
            cardId: string
            anchorData: AnchorItem[]
            chineseConcept: string
        }

        // 验证必要字段
        if (!userSentence || !chineseConcept || !anchorData) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        console.log('Evaluating sentence:', userSentence.substring(0, 50))

        // 构建评估提示词
        const userPrompt = `
中文概念：${chineseConcept}

锚定数据（母语者参考）：
${anchorData.map((a, i) => `${i + 1}. [${a.tag}] ${a.text}`).join('\n')}

用户输入：
${userSentence}

请评估用户的英文输入是否准确自然地传达了中文概念。注意：如果用户输入明显敷衍或不相关，请给出极低分并严厉批评。
`

        // 调用 DeepSeek 进行评估
        let evaluation: EvaluationResult
        try {
            const { object } = await generateObject({
                model: deepseek(MODEL_NAME),
                schema: EvaluationSchema,
                system: SEMANTIC_JUDGE_PROMPT,
                prompt: userPrompt,
            })
            evaluation = object as EvaluationResult
        } catch (aiError) {
            console.error('AI evaluation error:', aiError)
            return NextResponse.json(
                {
                    success: false,
                    error: `AI evaluation failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                },
                { status: 500 }
            )
        }

        console.log('Evaluation result:', evaluation)

        // 更新或创建复习记录
        if (cardId) {
            try {
                // 获取现有复习记录
                const { data: existingReview } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('card_id', cardId)
                    .eq('user_id', currentUser.id)
                    .single()

                const score = evaluation.judgment.score

                if (existingReview) {
                    // 计算新的 SRS 参数
                    const { newEaseFactor, newInterval, state } = calculateSIPUpdate(
                        existingReview.ease_factor,
                        existingReview.interval,
                        score
                    )

                    // 计算下次复习时间
                    const nextReviewAt = new Date()
                    if (newInterval > 0) {
                        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)
                    } else {
                        // interval = 0 意味着明天复习
                        nextReviewAt.setDate(nextReviewAt.getDate() + 1)
                    }

                    // 更新复习记录
                    const { error: updateError } = await supabase
                        .from('reviews')
                        .update({
                            ease_factor: newEaseFactor,
                            interval: newInterval,
                            next_review_at: nextReviewAt.toISOString(),
                            state: state,
                            last_reviewed_at: new Date().toISOString(),
                            last_score: score,
                            last_user_input: userSentence,
                            last_feedback: evaluation.feedback,
                        })
                        .eq('id', existingReview.id)

                    if (updateError) {
                        console.error('Failed to update review:', updateError)
                        return NextResponse.json({
                            success: true,
                            evaluation: evaluation,
                            dbStatus: 'update_failed',
                            dbError: updateError.message,
                        })
                    } else {
                        console.log(`Review updated: interval=${newInterval}, next=${nextReviewAt.toDateString()}`)
                        return NextResponse.json({
                            success: true,
                            evaluation: evaluation,
                            dbStatus: 'updated',
                        })
                    }
                } else {
                    // 创建新的复习记录
                    const { newEaseFactor, newInterval, state } = calculateSIPUpdate(
                        2.5,  // 初始 ease factor
                        0,    // 初始 interval
                        score
                    )

                    const nextReviewAt = new Date()
                    if (newInterval > 0) {
                        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)
                    } else {
                        nextReviewAt.setDate(nextReviewAt.getDate() + 1)
                    }

                    const { error: insertError } = await supabase
                        .from('reviews')
                        .insert({
                            user_id: currentUser.id,
                            card_id: cardId,
                            ease_factor: newEaseFactor,
                            interval: newInterval,
                            next_review_at: nextReviewAt.toISOString(),
                            state: state,
                            last_reviewed_at: new Date().toISOString(),
                            last_score: score,
                            last_user_input: userSentence,
                            last_feedback: evaluation.feedback,
                        })

                    if (insertError) {
                        console.error('Failed to insert review:', insertError)
                        // 临时调试：记录错误
                        return NextResponse.json({
                            success: true,
                            evaluation: evaluation,
                            dbStatus: 'insert_failed',
                            dbError: insertError.message,
                        })
                    } else {
                        console.log(`Review created: interval=${newInterval}, next=${nextReviewAt.toDateString()}`)
                        return NextResponse.json({
                            success: true,
                            evaluation: evaluation,
                            dbStatus: 'created',
                        })
                    }
                }
            } catch (dbError) {
                console.error('Database update error:', dbError)
                // 临时调试：记录错误
                return NextResponse.json({
                    success: true,
                    evaluation: evaluation,
                    dbStatus: 'exception',
                    dbError: dbError instanceof Error ? dbError.message : 'Unknown',
                })
            }
        }

        return NextResponse.json({
            success: true,
            evaluation: evaluation,
            dbStatus: 'skipped_no_cardId',
        })
    } catch (error) {
        console.error('Evaluation error:', error)
        return NextResponse.json(
            { success: false, error: `Failed to evaluate: ${error instanceof Error ? error.message : 'Unknown'}` },
            { status: 500 }
        )
    }
}
