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

        // 移除 limit 限制，或者设置一个很大的值，确保"所有"卡片都能被获取
        // 实际上如果有成千上万张卡片，这里可能需要重新考虑分页，但对于 current scale，先获取全部。
        // 原来的 SRS 逻辑有 limit，现在“所有卡片”逻辑可能不需要。
        // 但为了性能安全，我们还是保留 searchParams 的 limit 作为一个上限，只是默认值改大。
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam, 10) : 1000

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

        // 1. 获取该 deck 下的**所有**卡片
        const { data: allCards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('deck_id', deckId)

        if (cardsError) {
            console.error('Error fetching cards:', cardsError)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch cards' },
                { status: 500 }
            )
        }

        const cardsList = allCards || []

        // 2. 获取该用户在该 deck 下的所有 review 记录
        // 注意：我们需要知道哪些卡片被复习过，以及它们的状态
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('card_id, last_score, next_review_at')
            .eq('user_id', currentUser.id)
            .in('card_id', cardsList.map(c => c.id)) // 只获取此 deck 卡片的 review

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
            // 不中断，当作没 review
        }

        // 建立 review 映射 Map<card_id, review>
        const reviewMap = new Map<string, { last_score: number, next_review_at: string }>()
        if (reviews) {
            reviews.forEach(r => {
                reviewMap.set(r.card_id, {
                    last_score: r.last_score,
                    next_review_at: r.next_review_at
                })
            })
        }

        // 3. 构建 SmartCard 列表 (所有卡片)
        const smartCards: SmartCard[] = cardsList.map(card => {
            const review = reviewMap.get(card.id)
            if (review) {
                return {
                    ...card,
                    mastery_level: getMasteryLevel(review.last_score),
                    last_score: review.last_score,
                    next_review_at: review.next_review_at
                }
            } else {
                return {
                    ...card,
                    mastery_level: 'new', // 从未复习过
                    last_score: null,
                    next_review_at: null
                }
            }
        })

        // 4. 洗牌 (Random Shuffle)
        // 每次进入 deck 都会打乱顺序
        const shuffledCards = shuffleArray(smartCards)

        // 5. 截取 limit
        const resultCards = shuffledCards.slice(0, limit)

        return NextResponse.json({
            success: true,
            deck,
            cards: resultCards,
            stats: {
                total: smartCards.length,
                due: smartCards.filter(c => c.mastery_level !== 'new' && c.mastery_level !== 'green').length, // 仅做统计参考
                new: smartCards.filter(c => c.mastery_level === 'new').length,
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
