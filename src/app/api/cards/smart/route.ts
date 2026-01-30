import { NextRequest, NextResponse } from 'next/server'
import { Card } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/server-auth'

// 掌握程度类型
type MasteryLevel = 'new' | 'red' | 'yellow' | 'green'

// 带掌握状态的卡片
interface SmartCard extends Card {
    mastery_level: MasteryLevel
    last_score: number | null
    next_review_at: string | null
}

// 根据分数判断掌握程度
function getMasteryLevel(lastScore: number | null): MasteryLevel {
    if (lastScore === null) return 'new'
    if (lastScore < 5) return 'red'
    if (lastScore < 8) return 'yellow'
    return 'green'
}

// Fisher-Yates 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const deckId = searchParams.get('deckId')
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam, 10) : 20

        if (!deckId) {
            return NextResponse.json(
                { success: false, error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        // 验证 deck 属于当前用户
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('id, title')
            .eq('id', deckId)
            .eq('user_id', currentUser.id)
            .single()

        if (deckError || !deck) {
            return NextResponse.json(
                { success: false, error: 'Deck not found or access denied' },
                { status: 404 }
            )
        }

        const now = new Date().toISOString()

        // 1. 获取「到期债」- 今天该复习的卡片（有 review 记录且 next_review_at <= now）
        const { data: dueCards, error: dueError } = await supabase
            .from('reviews')
            .select(`
                card_id,
                last_score,
                next_review_at,
                cards!inner (
                    id,
                    deck_id,
                    chinese_concept,
                    context_hint,
                    anchor_data,
                    created_at
                )
            `)
            .eq('user_id', currentUser.id)
            .eq('cards.deck_id', deckId)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })

        if (dueError) {
            console.error('Error fetching due cards:', dueError)
        }

        // 2. 获取该 deck 所有已有 review 的卡片 ID
        const { data: reviewedCardIds } = await supabase
            .from('reviews')
            .select('card_id')
            .eq('user_id', currentUser.id)

        const reviewedIds = new Set((reviewedCardIds || []).map(r => r.card_id))

        // 3. 获取「新知识」- 没有 review 记录的卡片
        const { data: allCards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('deck_id', deckId)
            .order('created_at', { ascending: true })

        if (cardsError) {
            console.error('Error fetching cards:', cardsError)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch cards' },
                { status: 500 }
            )
        }

        const newCards = (allCards || []).filter(card => !reviewedIds.has(card.id))

        // 4. 构建智能卡片列表
        const smartCards: SmartCard[] = []

        // 添加到期债（带掌握状态）
        if (dueCards) {
            for (const review of dueCards) {
                const cardData = review.cards as unknown as Card
                if (cardData) {
                    smartCards.push({
                        ...cardData,
                        mastery_level: getMasteryLevel(review.last_score),
                        last_score: review.last_score,
                        next_review_at: review.next_review_at,
                    })
                }
            }
        }

        // 添加新卡片
        for (const card of newCards) {
            smartCards.push({
                ...card,
                mastery_level: 'new',
                last_score: null,
                next_review_at: null,
            })
        }

        // 5. 混合排序策略：优先复习卡，但穿插新卡
        // 计算比例：复习卡 70%，新卡 30%
        const dueCount = smartCards.filter(c => c.mastery_level !== 'new').length
        const newCount = smartCards.filter(c => c.mastery_level === 'new').length

        let finalCards: SmartCard[]

        if (dueCount === 0) {
            // 没有到期卡，全是新卡
            finalCards = shuffleArray(smartCards)
        } else if (newCount === 0) {
            // 没有新卡，全是复习卡
            finalCards = shuffleArray(smartCards)
        } else {
            // 混合策略：每 3 张复习卡穿插 1 张新卡
            const dueList = shuffleArray(smartCards.filter(c => c.mastery_level !== 'new'))
            const newList = shuffleArray(smartCards.filter(c => c.mastery_level === 'new'))

            finalCards = []
            let dueIdx = 0
            let newIdx = 0
            let counter = 0

            while (dueIdx < dueList.length || newIdx < newList.length) {
                if (counter % 4 === 3 && newIdx < newList.length) {
                    // 每 4 张插入 1 张新卡
                    finalCards.push(newList[newIdx++])
                } else if (dueIdx < dueList.length) {
                    finalCards.push(dueList[dueIdx++])
                } else if (newIdx < newList.length) {
                    finalCards.push(newList[newIdx++])
                }
                counter++
            }
        }

        // 限制返回数量
        const resultCards = finalCards.slice(0, limit)

        return NextResponse.json({
            success: true,
            deck,
            cards: resultCards,
            stats: {
                total: smartCards.length,
                due: dueCount,
                new: newCount,
                returned: resultCards.length,
            }
        })
    } catch (error) {
        console.error('Smart cards API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
