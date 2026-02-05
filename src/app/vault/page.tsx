'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Library, Home } from 'lucide-react'
import { StatusCard } from '@/components/StatusCard'

interface VaultStats {
    critical: number
    refining: number
    mastered: number
    total: number
}

export default function VaultPage() {
    const router = useRouter()
    const [stats, setStats] = useState<VaultStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/vault/stats')
            const data = await response.json()

            if (data.success) {
                setStats(data.stats)
            } else {
                setError(data.error || 'Failed to load stats')
            }
        } catch (err) {
            setError('Network error')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F9F7F1]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Go Home"
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
                    <div className="flex items-center gap-3">
                        <Library className="w-6 h-6 text-gray-700" />
                        <h1 className="text-xl font-bold text-gray-800 font-serif">
                            Smart Review
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-6">
                {/* Title Section */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 font-serif mb-2">
                        Your Language Assets
                    </h2>
                    <p className="text-gray-500">
                        Review your mastery levels and identify areas for improvement
                    </p>
                </div>

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
                            onClick={fetchStats}
                            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <StatusCard
                                title="Critical Gaps"
                                subtitle="需攻克"
                                count={stats.critical}
                                colorScheme="critical"
                                level="critical"
                            />
                            <StatusCard
                                title="Refining"
                                subtitle="进阶中"
                                count={stats.refining}
                                colorScheme="refining"
                                level="refining"
                            />
                            <StatusCard
                                title="Mastered"
                                subtitle="已掌握"
                                count={stats.mastered}
                                colorScheme="mastered"
                                level="mastered"
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                            <p className="text-gray-600 font-serif">
                                You have practiced{' '}
                                <span className="font-bold text-gray-800">{stats.total}</span>{' '}
                                unique cards in total.
                            </p>
                            {stats.critical > 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                    ⚠️ {stats.critical} cards need immediate attention
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {stats && stats.total === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                        <Library className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600 mb-2">
                            Your vault is empty
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Start practicing cards to build your knowledge base
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Start Learning
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
