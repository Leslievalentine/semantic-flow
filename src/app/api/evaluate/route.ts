import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { deepseek, MODEL_NAME, SEMANTIC_JUDGE_PROMPT, EvaluationResult } from '@/lib/ai'
import { supabase, AnchorItem } from '@/lib/supabase'

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

// SIP 算法：根据评分更新复习参数
function calculateSIPUpdate(
    currentEaseFactor: number,
    currentInterval: number,
    score: number
): { newEaseFactor: number; newInterval: number } {
    if (score >= 8) {
        // PASS: 增加 EF，延长间隔
        const newEaseFactor = currentEaseFactor + 0.1
        const newInterval = currentInterval === 0 ? 1 : Math.round(currentInterval * newEaseFactor)
        return { newEaseFactor, newInterval }
    } else if (score >= 5) {
        // REVIEW: 减少 EF，间隔设为 1 天
        const newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2)
        return { newEaseFactor, newInterval: 1 }
    } else {
        // FAIL: 减少 EF，间隔清零
        const newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2)
        return { newEaseFactor, newInterval: 0 }
    }
}

export async function POST(request: NextRequest) {
    try {
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

        // 如果提供了卡片 ID，更新复习记录（需要用户认证）
        if (cardId) {
            try {
                // 获取现有复习记录
                const { data: existingReview } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('card_id', cardId)
                    .single()

                if (existingReview) {
                    // 计算新的 SRS 参数
                    const { newEaseFactor, newInterval } = calculateSIPUpdate(
                        existingReview.ease_factor,
                        existingReview.interval,
                        evaluation.judgment.score
                    )

                    // 计算下次复习时间
                    const nextReviewAt = new Date()
                    if (newInterval > 0) {
                        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)
                    }

                    // 更新复习记录
                    await supabase
                        .from('reviews')
                        .update({
                            ease_factor: newEaseFactor,
                            interval: newInterval,
                            next_review_at: nextReviewAt.toISOString(),
                            state: newInterval === 0 ? 'learning' : 'review',
                            last_reviewed_at: new Date().toISOString(),
                        })
                        .eq('id', existingReview.id)
                }
            } catch (dbError) {
                console.error('Database update error:', dbError)
                // 即使数据库更新失败，也返回评估结果
            }
        }

        return NextResponse.json({
            success: true,
            evaluation: evaluation,
        })
    } catch (error) {
        console.error('Evaluation error:', error)
        return NextResponse.json(
            { success: false, error: `Failed to evaluate: ${error instanceof Error ? error.message : 'Unknown'}` },
            { status: 500 }
        )
    }
}
