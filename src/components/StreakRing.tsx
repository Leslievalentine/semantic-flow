'use client'

import { useState } from 'react'

interface StreakRingProps {
    current: number      // 今日完成数
    goal: number         // 每日目标
    streakDays: number   // 连续天数
    onGoalChange?: (newGoal: number) => void
}

export function StreakRing({ current, goal, streakDays, onGoalChange }: StreakRingProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(goal.toString())

    const percentage = Math.min(100, (current / goal) * 100)
    const isComplete = current >= goal

    // 计算圆环参数
    const size = 48
    const strokeWidth = 4
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    // 颜色
    const getColor = () => {
        if (isComplete) return '#22c55e' // 绿色
        if (percentage > 50) return '#eab308' // 黄色
        return '#9ca3af' // 灰色
    }

    const handleSaveGoal = () => {
        const newGoal = parseInt(editValue, 10)
        if (newGoal >= 1 && newGoal <= 100 && onGoalChange) {
            onGoalChange(newGoal)
        }
        setIsEditing(false)
    }

    return (
        <div
            className="relative flex items-center gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 圆环 */}
            <div className="relative">
                <svg
                    width={size}
                    height={size}
                    className={`transform -rotate-90 ${isComplete ? 'animate-pulse' : ''}`}
                >
                    {/* 背景圆环 */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    {/* 进度圆环 */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={getColor()}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                {/* 中心数字 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-xs font-semibold"
                        style={{ color: getColor() }}
                    >
                        {current}
                    </span>
                </div>
            </div>

            {/* 文字信息 */}
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                    Daily Progress
                </span>
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-12 text-xs border rounded px-1 py-0.5"
                            autoFocus
                            onBlur={handleSaveGoal}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                        />
                        <span className="text-xs text-gray-500">/ day</span>
                    </div>
                ) : (
                    <span
                        className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                        onClick={() => setIsEditing(true)}
                    >
                        {current} / {goal}
                    </span>
                )}
            </div>

            {/* Hover 提示 */}
            {isHovered && streakDays > 0 && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                    🔥 已连续打卡 {streakDays} 天
                </div>
            )}
        </div>
    )
}
