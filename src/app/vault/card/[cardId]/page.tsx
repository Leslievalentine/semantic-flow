'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, BookOpen, Home } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface AnchorItem {
    text: string
    tag: string
}

interface CardDetail {
    id: string
    chinese_concept: string
    context_hint: string
    anchor_data: AnchorItem[]
    deck_id: string
    deck_title: string
    created_at: string
}

interface ReviewDetail {
    last_score: number
    last_reviewed_at: string
    last_user_input: string | null
    last_feedback: {
        critique: string
        gap_analysis: string
    } | null
    state: string
    interval: number
}

export default function CardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [card, setCard] = useState<CardDetail | null>(null)
    const [review, setReview] = useState<ReviewDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const cardId = resolvedParams.cardId

    useEffect(() => {
        if (cardId) {
            fetchCardDetail()
        }
    }, [cardId])

    const fetchCardDetail = async () => {
        try {
            const response = await fetch(`/api/vault/card/${cardId}`)
            const data = await response.json()

            if (data.success) {
                setCard(data.card)
                setReview(data.review)
            } else {
                setError(data.error || 'Failed to load card')
            }
        } catch (err) {
            setError('Network error')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score < 5) return 'text-red-600 bg-red-50 border-red-200'
        if (score < 8) return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }

    const handlePractice = () => {
        router.push(`/vault/review?cardId=${cardId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
            </div>
        )
    }

    if (error || !card) {
        return (
            <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Card not found'}</p>
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
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Go Home"
                    >
                        <Home className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-800 font-serif">
                            Card Review
                        </h1>
                        <p className="text-sm text-gray-500">{card.deck_title}</p>
                    </div>
                    {review && (
                        <span className={`px-3 py-1 rounded-lg border font-bold ${getScoreColor(review.last_score)}`}>
                            {review.last_score.toFixed(1)}
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto p-6 space-y-6">
                {/* Chinese Concept */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {card.context_hint}
                        </span>
                    </div>
                    <p className="text-2xl text-gray-800 font-serif leading-relaxed">
                        {card.chinese_concept}
                    </p>
                </section>

                {/* Anchor Data (Native Alternatives) */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                        <BookOpen className="w-4 h-4" />
                        Native Alternatives
                    </h3>
                    <div className="space-y-3">
                        {card.anchor_data.map((anchor, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                    {anchor.tag}
                                </span>
                                <p className="text-gray-700 font-serif italic flex-1">
                                    "{anchor.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Last Attempt */}
                {review && review.last_user_input && (
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                            Your Last Attempt
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                            <p className="text-gray-700 font-serif">
                                "{review.last_user_input}"
                            </p>
                        </div>
                    </section>
                )}

                {/* AI Feedback */}
                {review && review.last_feedback && (
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                            Coach's Feedback
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                                <p className="text-sm font-semibold text-amber-700 mb-1">Critique</p>
                                <div className="text-gray-700 font-serif italic text-sm space-y-2">
                                    <ReactMarkdown components={{
                                        strong: ({ node, ...props }) => <span className="font-bold text-amber-900" {...props} />
                                    }}>
                                        {review.last_feedback.critique}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <p className="text-sm font-semibold text-blue-700 mb-1">How to Improve</p>
                                <div className="text-gray-700 text-sm space-y-1">
                                    <ReactMarkdown components={{
                                        strong: ({ node, ...props }) => <span className="font-bold text-blue-900" {...props} />
                                    }}>
                                        {review.last_feedback.gap_analysis}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Practice Button */}
                <div className="pt-6">
                    <button
                        onClick={handlePractice}
                        className="
                            w-full flex items-center justify-center gap-3
                            px-6 py-4 bg-gray-800 text-white
                            rounded-xl font-bold text-lg
                            hover:bg-gray-700 transition-colors
                            shadow-lg hover:shadow-xl
                        "
                    >
                        <Play className="w-5 h-5" />
                        Practice This Card
                    </button>
                </div>

                {/* Metadata */}
                {review && (
                    <div className="text-center text-xs text-gray-400 pt-4">
                        Last reviewed: {new Date(review.last_reviewed_at).toLocaleDateString()}
                        {' · '}
                        Next review in {review.interval} days
                    </div>
                )}
            </main>
        </div>
    )
}
