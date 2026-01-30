'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CardItem {
    id: string
    chinese_concept: string
    context_hint: string
    anchor_data: Array<{ text: string; tag: string }>
    last_score: number
    last_reviewed_at: string
}

interface TopicGroup {
    topic: string
    deck_id: string
    cards: CardItem[]
}

interface TopicAccordionProps {
    topics: TopicGroup[]
    level: 'critical' | 'refining' | 'mastered'
}

export function TopicAccordion({ topics, level }: TopicAccordionProps) {
    const router = useRouter()
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

    const toggleTopic = (deckId: string) => {
        const newExpanded = new Set(expandedTopics)
        if (newExpanded.has(deckId)) {
            newExpanded.delete(deckId)
        } else {
            newExpanded.add(deckId)
        }
        setExpandedTopics(newExpanded)
    }

    // 获取分数颜色
    const getScoreColor = (score: number) => {
        if (score < 5) return 'bg-red-100 text-red-700 border-red-200'
        if (score < 8) return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }

    // 获取第一个锚定数据的英文句子
    const getPreviewText = (card: CardItem) => {
        if (card.anchor_data && card.anchor_data.length > 0) {
            const text = card.anchor_data[0].text
            return text.length > 50 ? text.substring(0, 50) + '...' : text
        }
        return card.chinese_concept.substring(0, 30) + '...'
    }

    // 标题样式
    const levelConfig = {
        critical: {
            headerBg: 'bg-red-50',
            headerBorder: 'border-red-200',
        },
        refining: {
            headerBg: 'bg-amber-50',
            headerBorder: 'border-amber-200',
        },
        mastered: {
            headerBg: 'bg-emerald-50',
            headerBorder: 'border-emerald-200',
        }
    }

    const config = levelConfig[level]

    if (topics.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No cards in this category yet.</p>
                <p className="text-sm mt-2">Start practicing to see your progress here!</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {topics.map((topicGroup) => {
                const isExpanded = expandedTopics.has(topicGroup.deck_id)

                return (
                    <div
                        key={topicGroup.deck_id}
                        className={`border rounded-lg overflow-hidden ${config.headerBorder}`}
                    >
                        {/* 话题标题 */}
                        <button
                            onClick={() => toggleTopic(topicGroup.deck_id)}
                            className={`
                                w-full flex items-center justify-between
                                px-4 py-3 ${config.headerBg}
                                hover:bg-opacity-80 transition-colors
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                                <span className="font-semibold text-gray-800">
                                    {topicGroup.topic}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
                                {topicGroup.cards.length} cards
                            </span>
                        </button>

                        {/* 卡片列表 */}
                        {isExpanded && (
                            <div className="divide-y divide-gray-100 bg-white">
                                {topicGroup.cards.map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => router.push(`/vault/card/${card.id}`)}
                                        className="
                                            w-full flex items-center justify-between
                                            px-6 py-3 text-left
                                            hover:bg-gray-50 transition-colors
                                        "
                                    >
                                        {/* 左侧：句子预览 */}
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm text-gray-700 font-serif italic">
                                                "{getPreviewText(card)}"
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {card.context_hint}
                                            </p>
                                        </div>

                                        {/* 右侧：分数徽章 */}
                                        <span
                                            className={`
                                                px-2 py-1 text-xs font-bold
                                                rounded border
                                                ${getScoreColor(card.last_score)}
                                            `}
                                        >
                                            {card.last_score.toFixed(1)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
