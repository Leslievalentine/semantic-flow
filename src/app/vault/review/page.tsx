'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Home } from 'lucide-react'
import { Flashcard } from '@/components/Flashcard'
import { Card } from '@/lib/supabase'
import { EvaluationResult } from '@/lib/ai'
import { User } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { AuthGuard } from '@/components/AuthGuard'

function ReviewPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Query params
    const level = searchParams.get('level')
    const deckId = searchParams.get('deckId')
    const cardId = searchParams.get('cardId')

    const [user, setUser] = useState<User | null>(null)
    const [cards, setCards] = useState<Card[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [practicedCount, setPracticedCount] = useState(0)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [flashcardKey, setFlashcardKey] = useState(0)

    const currentCard = cards[currentIndex] || null

    useEffect(() => {
        getCurrentUser().then(setUser)
    }, [])

    useEffect(() => {
        fetchCards()
    }, [level, deckId, cardId])

    const fetchCards = async () => {
        setLoading(true)
        try {
            if (cardId) {
                // Scenario: Started from a single card.
                // 1. Fetch details of this card to find its deckId.
                const cardResponse = await fetch(`/api/vault/card/${cardId}`)
                const cardData = await cardResponse.json()

                if (cardData.success && cardData.card) {
                    const deckId = cardData.card.deck_id

                    // 2. Fetch all practice cards for this deck
                    const listResponse = await fetch(`/api/vault/cards/practice?deckId=${deckId}`)
                    const listData = await listResponse.json()

                    if (listData.success && listData.cards) {
                        const allCards = listData.cards
                        // 3. Set cards and find index of the current card
                        setCards(allCards)
                        const index = allCards.findIndex((c: Card) => c.id === cardId)
                        if (index !== -1) {
                            setCurrentIndex(index)
                        } else {
                            // Should not happen if data is consistent, but fallback:
                            // If for some reason the card isn't in the list (maybe recently reviewed and filter excluded it?), add it manually
                            // But better to just restart index 0 if not found
                            setCurrentIndex(0)
                        }
                    } else {
                        // Fallback if list fetch fails: just show single card
                        setCards([{
                            id: cardData.card.id,
                            chinese_concept: cardData.card.chinese_concept,
                            context_hint: cardData.card.context_hint,
                            anchor_data: cardData.card.anchor_data,
                            deck_id: cardData.card.deck_id,
                            created_at: cardData.card.created_at
                        }])
                    }
                }
            } else {
                // Standard scenario: Review by Level or Deck
                let url = '/api/vault/cards/practice'
                const params = new URLSearchParams()
                if (level) params.append('level', level)
                if (deckId) params.append('deckId', deckId)
                url = `${url}?${params.toString()}`

                const response = await fetch(url)
                const data = await response.json()

                if (data.success && data.cards) {
                    setCards(data.cards)
                }
            }
        } catch (error) {
            console.error('Failed to load cards:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNextCard = () => {
        setPracticedCount(prev => prev + 1)

        // If only 1 card, just reload it (effective loop)
        if (cards.length === 1) {
            setFlashcardKey(prev => prev + 1)
        }
        // If at the end, loop back to start
        else if (currentIndex >= cards.length - 1) {
            setCurrentIndex(0)
            setFlashcardKey(prev => prev + 1)
        } else {
            setCurrentIndex(prev => prev + 1)
            setFlashcardKey(prev => prev + 1)
        }
    }

    const handlePrevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setFlashcardKey(prev => prev + 1)
        }
    }

    const handleSubmitEvaluation = async (userSentence: string): Promise<EvaluationResult | null> => {
        if (!currentCard) return null

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userSentence,
                    cardId: currentCard.id,
                    anchorData: currentCard.anchor_data,
                    chineseConcept: currentCard.chinese_concept,
                }),
            })

            const data = await response.json()
            if (data.success && data.evaluation) {
                return data.evaluation
            }
            return null
        } catch (error) {
            console.error('Failed to evaluate:', error)
            return null
        }
    }

    // Determine Back button destination
    const handleBack = () => {
        if (cardId) {
            router.back() // Go back to card details
        } else if (level) {
            router.push(`/vault/${level}`)
        } else {
            router.push('/vault')
        }
    }

    const handleRestart = () => {
        setSessionComplete(false)
        setCurrentIndex(0)
        setPracticedCount(0)
        setFlashcardKey(prev => prev + 1)
        // Optionally shuffle or re-fetch
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (sessionComplete) {
        return (
            <div className="min-h-screen bg-[#F9F7F1] flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold font-serif mb-4 text-gray-800">Session Complete</h2>
                    <p className="text-gray-600 mb-8">
                        You have reviewed {practicedCount} cards.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleRestart}
                            className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium"
                        >
                            Review Again
                        </button>
                        <button
                            onClick={handleBack}
                            className="w-full py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Back to Vault
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F9F7F1] flex flex-col">
            {/* Minimal Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                            title="Go Home"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                    </div>

                    <span className="font-serif text-gray-600 font-medium">
                        {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Review'} Session
                    </span>
                </div>
            </header>

            <main className="flex-1 flex flex-col">
                <Flashcard
                    key={`review-${currentIndex}-${flashcardKey}`}
                    card={currentCard}
                    onSubmit={handleSubmitEvaluation}
                    onNextCard={handleNextCard}
                    onPrevCard={handlePrevCard}
                    currentIndex={currentIndex}
                    totalCards={cards.length}
                    isLoading={loading}
                />
            </main>
        </div>
    )
}

export default function ReviewPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen bg-[#F9F7F1]" />}>
                <ReviewPageContent />
            </Suspense>
        </AuthGuard>
    )
}
