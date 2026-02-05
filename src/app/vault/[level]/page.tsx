'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play } from 'lucide-react'
import { TopicAccordion } from '@/components/TopicAccordion'

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

const levelConfig = {
    critical: {
        title: 'Critical Gaps',
        subtitle: '需攻克',
        description: 'Cards that need immediate attention (score < 5)',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
    },
    refining: {
        title: 'Refining',
        subtitle: '进阶中',
        description: 'Cards you\'re making progress on (score 5-7.9)',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700'
    },
    mastered: {
        title: 'Mastered',
        subtitle: '已掌握',
        description: 'Cards you\'ve mastered (score ≥ 8)',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700'
    }
}

export default function LevelPage({ params }: { params: Promise<{ level: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [topics, setTopics] = useState<TopicGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const level = resolvedParams.level as 'critical' | 'refining' | 'mastered'
    const config = levelConfig[level] || levelConfig.critical

    useEffect(() => {
        if (level && ['critical', 'refining', 'mastered'].includes(level)) {
            fetchCards()
        }
    }, [level])

    const fetchCards = async () => {
        try {
            const response = await fetch(`/api/vault/cards?level=${level}`)
            const data = await response.json()

            if (data.success) {
                setTopics(data.topics)
            } else {
                setError(data.error || 'Failed to load cards')
            }
        } catch (err) {
            setError('Network error')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!['critical', 'refining', 'mastered'].includes(level)) {
        return (
            <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Invalid level</p>
                    <button
                        onClick={() => router.push('/vault')}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                    >
                        Back to Vault
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F9F7F1]">
            {/* Header */}
            <header className={`${config.bgColor} border-b border-gray-200 px-6 py-4`}>
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/vault')}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className={`text-xl font-bold ${config.textColor} font-serif`}>
                            {config.title}
                        </h1>
                        <p className="text-sm text-gray-500">{config.subtitle}</p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={() => router.push(`/vault/review?level=${level}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Start Review Session</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto p-6">
                {/* Description */}
                <p className="text-gray-600 mb-6 text-center">
                    {config.description}
                </p>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-20">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchCards}
                            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Topic Accordion */}
                {!loading && !error && (
                    <TopicAccordion topics={topics} level={level} />
                )}
            </main>
        </div>
    )
}
