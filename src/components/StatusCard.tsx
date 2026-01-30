'use client'

import { useRouter } from 'next/navigation'

interface StatusCardProps {
    title: string
    subtitle: string
    count: number
    colorScheme: 'critical' | 'refining' | 'mastered'
    level: string
}

export function StatusCard({ title, subtitle, count, colorScheme, level }: StatusCardProps) {
    const router = useRouter()

    const colorConfig = {
        critical: {
            bg: 'bg-gradient-to-br from-red-50 to-red-100',
            border: 'border-red-200',
            text: 'text-red-700',
            accent: 'text-red-600',
            hover: 'hover:border-red-400 hover:shadow-red-100',
            icon: '🔴'
        },
        refining: {
            bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
            border: 'border-amber-200',
            text: 'text-amber-700',
            accent: 'text-amber-600',
            hover: 'hover:border-amber-400 hover:shadow-amber-100',
            icon: '🟡'
        },
        mastered: {
            bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            accent: 'text-emerald-600',
            hover: 'hover:border-emerald-400 hover:shadow-emerald-100',
            icon: '🟢'
        }
    }

    const colors = colorConfig[colorScheme]

    return (
        <button
            onClick={() => router.push(`/vault/${level}`)}
            className={`
                relative flex flex-col items-center justify-center
                p-8 rounded-xl border-2
                ${colors.bg} ${colors.border} ${colors.hover}
                transition-all duration-300 ease-out
                cursor-pointer
                hover:scale-[1.02] hover:shadow-xl
                group
            `}
        >
            {/* 图标 */}
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {colors.icon}
            </span>

            {/* 标题 */}
            <h3 className={`text-lg font-bold ${colors.text} mb-1`}>
                {title}
            </h3>

            {/* 副标题 */}
            <p className="text-sm text-gray-500 mb-4">
                {subtitle}
            </p>

            {/* 数字 */}
            <div className={`text-5xl font-bold ${colors.accent}`}>
                {count}
            </div>

            {/* 卡片标签 */}
            <span className="text-xs text-gray-400 mt-3">
                cards
            </span>

            {/* Hover 提示 */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-400">Click to view →</span>
            </div>
        </button>
    )
}
