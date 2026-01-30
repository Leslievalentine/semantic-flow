'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, RefreshCw, Quote, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/lib/supabase'
import { EvaluationResult } from '@/lib/ai'
import { DiffView } from './DiffView'

interface FlashcardProps {
    card: Card | null
    onSubmit: (sentence: string) => Promise<EvaluationResult | null>
    onNextCard: () => void
    onPrevCard: () => void
    currentIndex: number
    totalCards: number
    isLoading?: boolean
    onTransferCard?: () => void
}

type FlashcardState = 'idle' | 'input' | 'evaluating' | 'result'

// 卡片练习状态存储键
const CARD_STATE_KEY = 'semantic-flow-card-states'

// 存储的卡片状态接口
interface SavedCardState {
    userInput: string
    evaluation: EvaluationResult
    timestamp: number
}

// 每日金句数据
const dailyQuotes = [
    { quote: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
    { quote: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
    { quote: "To have another language is to possess a second soul.", author: "Charlemagne" },
    { quote: "Language is the road map of a culture.", author: "Rita Mae Brown" },
    { quote: "The more you know, the more you know you don't know.", author: "Aristotle" },
    { quote: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", author: "Flora Lewis" },
    { quote: "A different language is a different vision of life.", author: "Federico Fellini" },
    { quote: "Language is the blood of the soul into which thoughts run and out of which they grow.", author: "Oliver Wendell Holmes" },
    { quote: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
    { quote: "The art of writing is the art of discovering what you believe.", author: "Gustave Flaubert" },
]

// 获取基于日期的金句索引（每天凌晨更新）
function getDailyQuoteIndex(): number {
    const now = new Date()
    const dateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    let hash = 0
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash) % dailyQuotes.length
}

function DailyQuote() {
    const [quote, setQuote] = useState(dailyQuotes[0])

    useEffect(() => {
        const index = getDailyQuoteIndex()
        setQuote(dailyQuotes[index])

        // 设置定时器在凌晨更新
        const now = new Date()
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const msUntilMidnight = tomorrow.getTime() - now.getTime()

        const timer = setTimeout(() => {
            const newIndex = getDailyQuoteIndex()
            setQuote(dailyQuotes[newIndex])
        }, msUntilMidnight)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg mb-6">
            <Quote className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="daily-quote">
                <p className="font-content italic text-foreground/80">&ldquo;{quote.quote}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
            </div>
        </div>
    )
}

// AI 判决区域组件
function AIVerdict({ evaluation }: { evaluation: EvaluationResult }) {
    const getStatusColor = () => {
        switch (evaluation.judgment.status) {
            case 'PASS':
                return 'bg-emerald-50 border-emerald-500 text-emerald-900'
            case 'REVIEW':
                return 'bg-amber-50 border-amber-500 text-amber-900'
            case 'FAIL':
                return 'bg-red-50 border-red-500 text-red-900'
            default:
                return 'bg-gray-100 border-gray-500 text-gray-900'
        }
    }

    const getBadgeColor = () => {
        switch (evaluation.judgment.status) {
            case 'PASS':
                return 'badge-pass'
            case 'REVIEW':
                return 'badge-review'
            case 'FAIL':
                return 'badge-fail'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getIcon = () => {
        switch (evaluation.judgment.status) {
            case 'PASS':
                return <CheckCircle className="w-5 h-5 text-emerald-600" />
            case 'REVIEW':
                return <Lightbulb className="w-5 h-5 text-amber-600" />
            case 'FAIL':
                return <AlertTriangle className="w-5 h-5 text-red-600" />
            default:
                return null
        }
    }

    return (
        <div className={`p-6 rounded-lg border-l-4 ${getStatusColor()} mb-6`}>
            {/* Header: Status Badge + Score */}
            <div className="flex items-center gap-3 mb-4">
                <span className={`badge ${getBadgeColor()}`}>
                    {evaluation.judgment.status}
                </span>
                <span className="badge badge-score">
                    {evaluation.judgment.score.toFixed(1)} / 10
                </span>
                {getIcon()}
            </div>

            {/* Critique - Coach's Feedback */}
            <div className="mb-4">
                <h4 className="text-xs uppercase tracking-widest text-current/60 mb-2 font-medium">
                    Coach&apos;s Feedback
                </h4>
                <p className="text-lg font-content italic text-current leading-relaxed border-l-2 border-current/30 pl-4">
                    &ldquo;{evaluation.feedback.critique}&rdquo;
                </p>
            </div>

            {/* Gap Analysis - Improvement Suggestions - 突出显示 */}
            {evaluation.feedback.gap_analysis && (
                <div className="pt-4 border-t border-current/20">
                    <h4 className="text-xs uppercase tracking-widest text-current/60 mb-3 font-medium flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        How to Improve
                    </h4>
                    {/* 使用更突出的样式：加粗、更大字号、深色背景 */}
                    <div className="bg-white/60 rounded-lg p-4 border border-current/10">
                        <p className="text-base font-medium text-current leading-relaxed font-content">
                            {evaluation.feedback.gap_analysis}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function Flashcard({
    card,
    onSubmit,
    onNextCard,
    onPrevCard,
    currentIndex,
    totalCards,
    isLoading,
    onTransferCard
}: FlashcardProps) {
    const [state, setState] = useState<FlashcardState>('idle')
    const [userInput, setUserInput] = useState('')
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
    const [evaluationError, setEvaluationError] = useState<string | null>(null)

    // 从 localStorage 加载保存的状态
    useEffect(() => {
        if (!card) return

        try {
            const savedStates = localStorage.getItem(CARD_STATE_KEY)
            if (savedStates) {
                const states: Record<string, SavedCardState> = JSON.parse(savedStates)
                const savedState = states[card.id]
                if (savedState) {
                    setUserInput(savedState.userInput)
                    setEvaluation(savedState.evaluation)
                    setState('result')
                    return
                }
            }
        } catch (e) {
            console.error('Failed to load card state:', e)
        }

        // 没有保存的状态，显示初始状态
        setState('idle')
        setUserInput('')
        setEvaluation(null)
        setEvaluationError(null)
    }, [card?.id])

    // 保存状态到 localStorage
    const saveCardState = (cardId: string, input: string, eval_result: EvaluationResult) => {
        try {
            const savedStates = localStorage.getItem(CARD_STATE_KEY)
            const states: Record<string, SavedCardState> = savedStates ? JSON.parse(savedStates) : {}
            states[cardId] = {
                userInput: input,
                evaluation: eval_result,
                timestamp: Date.now()
            }
            localStorage.setItem(CARD_STATE_KEY, JSON.stringify(states))
        } catch (e) {
            console.error('Failed to save card state:', e)
        }
    }

    // 清除单个卡片的保存状态
    const clearCardState = (cardId: string) => {
        try {
            const savedStates = localStorage.getItem(CARD_STATE_KEY)
            if (savedStates) {
                const states: Record<string, SavedCardState> = JSON.parse(savedStates)
                delete states[cardId]
                localStorage.setItem(CARD_STATE_KEY, JSON.stringify(states))
            }
        } catch (e) {
            console.error('Failed to clear card state:', e)
        }
    }

    // 重置卡片状态（用户点击 Refresh）
    const handleRefresh = () => {
        if (card) {
            clearCardState(card.id)
        }
        setState('idle')
        setUserInput('')
        setEvaluation(null)
        setEvaluationError(null)
    }

    // 开始写作
    const handleStartWriting = () => {
        setState('input')
        setUserInput('')
        setEvaluation(null)
        setEvaluationError(null)
    }

    // 提交评估
    const handleSubmit = async () => {
        if (!userInput.trim() || !card) return

        setState('evaluating')
        setEvaluationError(null)

        try {
            const result = await onSubmit(userInput)
            if (result) {
                setEvaluation(result)
                setState('result')
                // 保存状态到 localStorage
                saveCardState(card.id, userInput, result)
            } else {
                setEvaluationError('Failed to get AI evaluation. The AI service may be temporarily unavailable. Please try again.')
                setState('input')
            }
        } catch (error) {
            console.error('Submit error:', error)
            setEvaluationError('An error occurred during evaluation. Please check your network connection.')
            setState('input')
        }
    }

    // 下一张卡片（不重置状态，由 useEffect 根据保存状态决定）
    const handleNext = () => {
        onNextCard()
    }

    // 上一张卡片（不重置状态，由 useEffect 根据保存状态决定）
    const handlePrev = () => {
        onPrevCard()
    }

    // 空状态
    if (!card) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="focus-container p-12 text-center">
                    <DailyQuote />
                    <p className="text-2xl text-muted-foreground font-content italic">
                        Select a deck to begin your practice
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                        Choose from the sidebar to start your training session
                    </p>
                </div>
            </div>
        )
    }

    // 加载状态
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="focus-container p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground mt-4 text-center">Loading cards...</p>
                </div>
            </div>
        )
    }

    // 空闲状态：显示中文概念
    if (state === 'idle') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="focus-container p-8 md:p-12 w-full max-w-3xl">
                    <DailyQuote />

                    <div className="text-center space-y-6">
                        {/* Context Hint */}
                        {card.context_hint && (
                            <p className="text-sm uppercase tracking-widest text-secondary font-medium">
                                {card.context_hint}
                            </p>
                        )}

                        {/* Mastery Status Indicator */}
                        {card.mastery_level && (
                            <div className="flex items-center justify-center gap-2 mb-4">
                                {card.mastery_level === 'new' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                        <Circle className="w-3 h-3" />
                                        新卡片
                                    </span>
                                )}
                                {card.mastery_level === 'red' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                        <AlertTriangle className="w-3 h-3" />
                                        需强化
                                    </span>
                                )}
                                {card.mastery_level === 'yellow' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                        <Lightbulb className="w-3 h-3" />
                                        巩固中
                                    </span>
                                )}
                                {card.mastery_level === 'green' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-3 h-3" />
                                        已掌握
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Chinese Concept */}
                        <h1 className="text-3xl md:text-4xl leading-tight font-content">
                            {card.chinese_concept}
                        </h1>

                        {/* Start Button */}
                        <Button
                            onClick={handleStartWriting}
                            className="mt-8 px-8 py-6 text-lg rounded-lg bg-primary hover:bg-primary/90"
                        >
                            Begin Translation
                        </Button>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="text-muted-foreground"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>

                            {/* 转移按钮 */}
                            {onTransferCard && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onTransferCard}
                                    className="text-muted-foreground"
                                    title="Transfer to another deck"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </Button>
                            )}

                            <span className="text-sm text-muted-foreground">
                                {currentIndex + 1} / {totalCards}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNext}
                                disabled={currentIndex >= totalCards - 1}
                                className="text-muted-foreground"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 输入状态
    if (state === 'input') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="focus-container p-8 md:p-12 w-full max-w-3xl">
                    <div className="space-y-6">
                        {/* Context Hint */}
                        {card.context_hint && (
                            <p className="text-sm uppercase tracking-widest text-secondary font-medium text-center">
                                {card.context_hint}
                            </p>
                        )}

                        {/* Chinese Concept (smaller) */}
                        <h2 className="text-2xl text-center text-foreground/80 font-content">
                            {card.chinese_concept}
                        </h2>

                        {/* Error Message */}
                        {evaluationError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Evaluation Error</p>
                                        <p className="mt-1">{evaluationError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="relative">
                            <Textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Write your English translation..."
                                className="min-h-[160px] text-xl p-6 resize-none bg-background border-2 border-border rounded-lg input-focus-ring font-content"
                                autoFocus
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-between items-center">
                            <Button
                                variant="ghost"
                                onClick={() => setState('idle')}
                                className="text-muted-foreground"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!userInput.trim()}
                                className="px-6 py-4 rounded-lg bg-primary hover:bg-primary/90"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Submit for Evaluation
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 评估中状态
    if (state === 'evaluating') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="focus-container p-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto" />
                    <p className="text-lg text-muted-foreground mt-4 font-content italic">
                        AI is evaluating your translation...
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                        This may take a few seconds
                    </p>
                </div>
            </div>
        )
    }

    // 结果状态
    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="focus-container p-8 md:p-12 mx-auto max-w-3xl">
                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    {card.context_hint && (
                        <p className="text-sm uppercase tracking-widest text-secondary font-medium">
                            {card.context_hint}
                        </p>
                    )}
                    <h2 className="text-2xl font-content">{card.chinese_concept}</h2>
                </div>

                {/* Your Translation */}
                <div className="mb-6">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3">
                        Your Translation
                    </h3>
                    <div className={`p-5 rounded-lg border-l-4 ${evaluation?.judgment.status === 'PASS' ? 'border-l-emerald-500 bg-emerald-50' :
                        evaluation?.judgment.status === 'REVIEW' ? 'border-l-amber-500 bg-amber-50' :
                            'border-l-red-500 bg-red-50'
                        }`}>
                        <p className="text-xl leading-relaxed font-content">{userInput}</p>
                    </div>
                </div>

                {/* AI Verdict - THE KEY SECTION */}
                {evaluation && <AIVerdict evaluation={evaluation} />}

                {/* Native Alternatives */}
                <DiffView
                    userSentence={userInput}
                    anchorData={card.anchor_data}
                    evaluation={evaluation}
                    showUserSentence={false}
                />

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-border mt-8">
                    <div className="flex gap-2">
                        <Button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            variant="outline"
                            className="px-6 py-4 rounded-lg"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous Card
                        </Button>
                        {onTransferCard && (
                            <Button
                                onClick={onTransferCard}
                                variant="outline"
                                className="px-4 py-4 rounded-lg text-muted-foreground"
                                title="Transfer to another deck"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </Button>
                        )}
                        {/* Refresh 按钮 - 重置卡片状态 */}
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="px-4 py-4 rounded-lg text-muted-foreground hover:text-primary"
                            title="Reset this card and practice again"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={handleNext}
                        className="px-8 py-4 rounded-lg"
                        disabled={currentIndex >= totalCards - 1}
                    >
                        Next Card
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
