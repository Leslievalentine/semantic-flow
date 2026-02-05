'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, MoreHorizontal, Sparkles, Upload, Merge, PanelLeftClose, PanelLeft, Trash2, Pencil, GripVertical, LogOut, User as UserIcon, Library } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { StreakRing } from '@/components/StreakRing'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Deck {
    id: string
    title: string
    card_count: number
    is_custom: boolean
}

interface DeckProgress {
    [deckId: string]: number
}

interface SidebarProps {
    decks: Deck[]
    selectedDeckId: string | null
    onSelectDeck: (deckId: string) => void
    onCreateDeck: (mode: 'ai' | 'manual') => void
    onAddCardsToDeck: (deckId: string) => void
    onUploadCard: (deckId: string) => void
    onMergeDeck: (deckId: string) => void
    onRenameDeck: (deckId: string) => void
    onDeleteDeck: (deckId: string) => void
    onReorderDecks?: (newOrder: string[]) => void
    deckProgress?: DeckProgress
    dailyProgress?: {
        completed: number
        total: number
    }
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    user?: User | null
    onSignOut?: () => void
}

// 可排序的 Deck 项组件
interface SortableDeckItemProps {
    deck: Deck
    isSelected: boolean
    progress: number
    onSelect: () => void
    onAddCards: () => void
    onUpload: () => void
    onMerge: () => void
    onRename: () => void
    onDelete: () => void
}

function SortableDeckItem({
    deck,
    isSelected,
    progress,
    onSelect,
    onAddCards,
    onUpload,
    onMerge,
    onRename,
    onDelete,
}: SortableDeckItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: deck.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
    }

    const hasProgress = progress > 0

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                w-full text-left px-2.5 py-2 rounded-md transition-colors group relative
                flex items-start justify-between cursor-pointer
                ${isSelected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                }
                ${isDragging ? 'shadow-lg bg-sidebar-accent' : ''}
            `}
        >
            {/* 拖拽手柄 */}
            <div
                {...attributes}
                {...listeners}
                className="flex-shrink-0 mr-1.5 cursor-grab active:cursor-grabbing text-sidebar-foreground/30 hover:text-sidebar-foreground/60 touch-none"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* 点击区域 - 选择 deck */}
            <div className="flex-1 min-w-0 pr-1" onClick={onSelect}>
                <p className="text-sm font-medium leading-tight break-words">
                    {deck.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-sidebar-foreground/50">
                        {deck.card_count} cards
                    </span>
                    {hasProgress && (
                        <span className="text-xs text-secondary font-medium">
                            • {progress + 1}/{deck.card_count}
                        </span>
                    )}
                    {deck.is_custom && (
                        <span className="text-xs text-sidebar-foreground/50">
                            • Custom
                        </span>
                    )}
                </div>
            </div>

            {/* 操作菜单 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 flex-shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={onAddCards}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Generate Cards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onUpload}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Custom Card
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRename}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename Deck
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onMerge}>
                        <Merge className="w-4 h-4 mr-2" />
                        Merge into Another
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Deck
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function Sidebar({
    decks,
    selectedDeckId,
    onSelectDeck,
    onCreateDeck,
    onAddCardsToDeck,
    onUploadCard,
    onMergeDeck,
    onRenameDeck,
    onDeleteDeck,
    onReorderDecks,
    deckProgress = {},
    dailyProgress = { completed: 0, total: 10 },
    isCollapsed = false,
    onToggleCollapse,
    user,
    onSignOut,
}: SidebarProps) {
    const router = useRouter()
    const [streakData, setStreakData] = useState({ today_count: 0, daily_goal: 20, streak_days: 0 })

    // Fetch streak data
    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const response = await fetch('/api/vault/streak')
                const data = await response.json()
                if (data.success) {
                    setStreakData(data.streak)
                }
            } catch (err) {
                console.error('Failed to fetch streak:', err)
            }
        }
        if (user) {
            fetchStreak()
        }
    }, [user])

    const handleGoalChange = async (newGoal: number) => {
        try {
            const response = await fetch('/api/vault/streak', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_goal: newGoal })
            })
            const data = await response.json()
            if (data.success) {
                setStreakData(prev => ({ ...prev, daily_goal: newGoal }))
            }
        } catch (err) {
            console.error('Failed to update goal:', err)
        }
    }

    // 拖拽传感器配置
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 拖拽激活距离（避免与点击冲突）
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // 拖拽结束处理
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = decks.findIndex((d) => d.id === active.id)
            const newIndex = decks.findIndex((d) => d.id === over.id)
            const newOrder = arrayMove(decks, oldIndex, newIndex).map((d) => d.id)

            // 通知父组件更新排序
            if (onReorderDecks) {
                onReorderDecks(newOrder)
            }
        }
    }

    // 收起状态时显示迷你侧边栏
    if (isCollapsed) {
        return (
            <aside className="w-14 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border flex-shrink-0 items-center py-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="mb-4"
                    title="Expand sidebar"
                >
                    <PanelLeft className="w-5 h-5" />
                </Button>
                <BookOpen className="w-5 h-5 text-sidebar-primary mb-4" />
                <div className="flex-1" />
                <Sparkles className="w-4 h-4 text-sidebar-foreground/50" />
            </aside>
        )
    }

    return (
        <aside className="w-72 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border flex-shrink-0">
            {/* Logo/Title with collapse button */}
            <div className="p-5 border-b border-sidebar-border">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-sidebar-primary">
                        <BookOpen className="w-5 h-5" />
                        Semantic Flow
                    </h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className="w-7 h-7 hover:bg-sidebar-accent"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-sidebar-foreground/50 mt-1 italic">
                    Write with Native Precision
                </p>
            </div>

            {/* Daily Progress & Knowledge Vault */}
            <div className="px-5 py-3 border-b border-sidebar-border space-y-3">
                {/* StreakRing */}
                <StreakRing
                    current={streakData.today_count}
                    goal={streakData.daily_goal}
                    streakDays={streakData.streak_days}
                    onGoalChange={handleGoalChange}
                />

                {/* Knowledge Vault Entry */}
                <button
                    onClick={() => router.push('/vault')}
                    className="
                        w-full flex items-center gap-3 px-3 py-2.5
                        bg-gradient-to-r from-amber-50 to-orange-50
                        border border-amber-200 rounded-lg
                        hover:from-amber-100 hover:to-orange-100
                        transition-colors group
                    "
                >
                    <Library className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                        <span className="text-sm font-semibold text-amber-800">Smart Review</span>
                        <p className="text-xs text-amber-600/70">Track your progress</p>
                    </div>
                </button>
            </div>

            {/* Decks Header */}
            <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                    ≡ Decks
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 hover:bg-sidebar-accent"
                            title="Create new deck"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => onCreateDeck('ai')}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Generate New Deck
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onCreateDeck('manual')}>
                            <Upload className="w-4 h-4 mr-2" />
                            Create Empty Deck
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Decks List - 带拖拽排序 */}
            <div className="flex-1 overflow-y-auto px-2">
                <div className="space-y-1 py-2">
                    {decks.length === 0 ? (
                        <p className="text-sm text-sidebar-foreground/50 px-3 py-4 text-center italic">
                            No decks available
                        </p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={decks.map((d) => d.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {decks.map((deck) => (
                                    <SortableDeckItem
                                        key={deck.id}
                                        deck={deck}
                                        isSelected={selectedDeckId === deck.id}
                                        progress={deckProgress[deck.id] || 0}
                                        onSelect={() => onSelectDeck(deck.id)}
                                        onAddCards={() => onAddCardsToDeck(deck.id)}
                                        onUpload={() => onUploadCard(deck.id)}
                                        onMerge={() => onMergeDeck(deck.id)}
                                        onRename={() => onRenameDeck(deck.id)}
                                        onDelete={() => onDeleteDeck(deck.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Footer - 用户信息 */}
            <div className="p-3 border-t border-sidebar-border">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-4 h-4 text-secondary" />
                            </div>
                            <span className="text-xs text-sidebar-foreground truncate">
                                {user.email?.split('@')[0]}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-sidebar-foreground/50 hover:text-red-500"
                            onClick={onSignOut}
                            title="登出"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
                        <Sparkles className="w-3 h-3" />
                        <span>Elite Edition • v2.0</span>
                    </div>
                )}
            </div>
        </aside>
    )
}
