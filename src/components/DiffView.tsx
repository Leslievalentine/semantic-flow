'use client'

import { AnchorItem } from '@/lib/supabase'
import { EvaluationResult } from '@/lib/ai'

interface DiffViewProps {
    userSentence: string
    anchorData: AnchorItem[]
    evaluation: EvaluationResult | null
    showUserSentence?: boolean
}

export function DiffView({ userSentence, anchorData, evaluation, showUserSentence = true }: DiffViewProps) {
    // 根据评估状态确定用户句子的样式
    const getUserSentenceStyle = () => {
        if (!evaluation) return 'border-l-4 border-l-border'
        switch (evaluation.judgment.status) {
            case 'PASS':
                return 'border-l-4 border-l-emerald-500 bg-emerald-50'
            case 'REVIEW':
                return 'border-l-4 border-l-amber-500 bg-amber-50'
            case 'FAIL':
                return 'border-l-4 border-l-red-500 bg-red-50'
            default:
                return 'border-l-4 border-l-border'
        }
    }

    return (
        <div className="space-y-6">
            {/* User's Sentence - Only show if showUserSentence is true */}
            {showUserSentence && (
                <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                        Your Translation
                    </h3>
                    <div className={`p-5 rounded-lg ${getUserSentenceStyle()}`}>
                        <p className="text-xl leading-relaxed font-content">{userSentence}</p>
                    </div>
                </div>
            )}

            {/* Native Alternatives */}
            <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                    Native Alternatives
                </h3>
                <div className="space-y-3">
                    {anchorData.map((anchor, index) => (
                        <div
                            key={index}
                            className="p-5 rounded-lg bg-accent/50 border border-border"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-lg leading-relaxed flex-1 font-content">{anchor.text}</p>
                                <span className="badge bg-muted text-muted-foreground flex-shrink-0">
                                    {anchor.tag}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
