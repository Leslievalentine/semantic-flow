import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { deepseek, MODEL_NAME, DECK_GENERATOR_PROMPT, GeneratedDeck } from '@/lib/ai'
import { createServerSupabaseClient } from '@/lib/server-auth'
import { SupabaseClient } from '@supabase/supabase-js'

// 生成的卡组 Schema
const GeneratedDeckSchema = z.object({
    deck_title: z.string(),
    cards: z.array(
        z.object({
            chinese_concept: z.string(),
            context_hint: z.string(),
            anchor_data: z.array(
                z.object({
                    text: z.string(),
                    tag: z.string(),
                })
            ),
        })
    ),
})

// 计算两个字符串的相似度（Jaccard 相似系数）
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // 提取关键词（移除常见词）
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', '-', '&']
    const words1 = s1.split(/[\s-]+/).filter(w => w.length > 1 && !stopWords.includes(w))
    const words2 = s2.split(/[\s-]+/).filter(w => w.length > 1 && !stopWords.includes(w))

    const set1 = new Set(words1)
    const set2 = new Set(words2)

    // 计算交集和并集
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    if (union.size === 0) return 0

    // 检查数字是否匹配（如 task 1 vs task 2）
    const nums1: string[] = s1.match(/\d+/g) || []
    const nums2: string[] = s2.match(/\d+/g) || []
    if (nums1.length > 0 && nums2.length > 0) {
        // 如果两边都有数字但数字不同，不应合并
        const hasMatchingNumber = nums1.some((n: string) => nums2.includes(n))
        if (!hasMatchingNumber) {
            return 0 // 数字不匹配，不合并
        }
    }

    return intersection.size / union.size
}

// 查找相似的现有卡组（仅查找当前用户的卡组）
async function findSimilarDeck(supabase: SupabaseClient, topic: string, generatedTitle: string, userId: string): Promise<{ id: string; title: string } | null> {
    const { data: decks, error } = await supabase
        .from('decks')
        .select('id, title')
        .eq('user_id', userId)

    if (error || !decks) return null

    let bestMatch: { id: string; title: string; similarity: number } | null = null

    for (const deck of decks) {
        const topicSimilarity = calculateSimilarity(deck.title, topic)
        const titleSimilarity = calculateSimilarity(deck.title, generatedTitle)
        const maxSimilarity = Math.max(topicSimilarity, titleSimilarity)

        // 提高相似度阈值到 0.8 (80% 的关键词重叠)
        if (maxSimilarity >= 0.8) {
            if (!bestMatch || maxSimilarity > bestMatch.similarity) {
                bestMatch = { id: deck.id, title: deck.title, similarity: maxSimilarity }
            }
        }
    }

    return bestMatch ? { id: bestMatch.id, title: bestMatch.title } : null
}


export async function POST(request: NextRequest) {
    try {
        // 创建服务端 Supabase 客户端（包含 Auth Context）
        const supabase = await createServerSupabaseClient()

        // 验证用户认证
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !currentUser) {
            console.error('Auth error:', authError)
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { topic, deckId, autoMerge = true } = body as {
            topic: string
            deckId?: string // 如果提供，则追加到现有卡组
            autoMerge?: boolean // 是否自动合并到相似话题
        }

        if (!topic || topic.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Topic is required' },
                { status: 400 }
            )
        }

        console.log('Generating cards for topic:', topic, 'deckId:', deckId)

        // 调用 AI 生成卡组内容
        const { object: generatedDeck } = await generateObject({
            model: deepseek(MODEL_NAME),
            schema: GeneratedDeckSchema,
            system: DECK_GENERATOR_PROMPT,
            prompt: `User Topic: "${topic}"\n\nPlease generate a deck strictly focused on this topic.`,
        })

        // 数据库操作
        let targetDeckId = deckId
        let deckTitle = generatedDeck.deck_title
        let mergedInto: string | undefined

        // 如果提供了 deckId，验证其存在性
        if (deckId) {
            const { data: existingDeck, error: fetchError } = await supabase
                .from('decks')
                .select('id, title')
                .eq('id', deckId)
                .single()

            if (fetchError || !existingDeck) {
                return NextResponse.json(
                    { success: false, error: 'Deck not found' },
                    { status: 404 }
                )
            }

            targetDeckId = existingDeck.id
            deckTitle = existingDeck.title
        } else if (autoMerge) {
            // 自动检测相似话题并合并
            const similarDeck = await findSimilarDeck(supabase, topic, generatedDeck.deck_title, currentUser.id)
            if (similarDeck) {
                console.log('Found similar deck:', similarDeck.title)
                targetDeckId = similarDeck.id
                deckTitle = similarDeck.title
                mergedInto = similarDeck.title
            }
        }

        // 如果没有找到相似卡组，创建新卡组
        if (!targetDeckId) {
            const { data: newDeck, error: deckError } = await supabase
                .from('decks')
                .insert({
                    title: generatedDeck.deck_title,
                    user_id: currentUser.id,
                    is_custom: false,
                })
                .select()
                .single()

            if (deckError || !newDeck) {
                console.error('Deck creation error object:', JSON.stringify(deckError))
                console.error('Deck creation error message:', deckError?.message)
                return NextResponse.json(
                    { success: false, error: `Failed to create deck: ${deckError?.message || 'Unknown'}` },
                    { status: 500 }
                )
            }

            targetDeckId = newDeck.id
            deckTitle = newDeck.title
        }

        // 批量插入卡片
        const cardsToInsert = generatedDeck.cards.map((card) => ({
            deck_id: targetDeckId,
            user_id: currentUser.id,
            chinese_concept: card.chinese_concept,
            context_hint: card.context_hint,
            anchor_data: card.anchor_data,
        }))

        const { error: cardsError } = await supabase.from('cards').insert(cardsToInsert)

        if (cardsError) {
            console.error('Cards creation error:', cardsError)
            return NextResponse.json(
                { success: false, error: 'Failed to create cards' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            deckId: targetDeckId,
            deckTitle: deckTitle,
            cardCount: generatedDeck.cards.length,
            mergedInto
        })

    } catch (error) {
        console.error('Generate deck error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate deck' },
            { status: 500 }
        )
    }
}
