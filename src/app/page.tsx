'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Flashcard } from '@/components/Flashcard'
import {
  GenerateDeckDialog,
  AddCardsDialog,
  UploadCardDialog,
  MergeDeckDialog,
  RenameDeckDialog,
  DeleteDeckDialog,
  CreateEmptyDeckDialog,
  TransferCardDialog
} from '@/components/GenerateDeckDialog'
import { Card } from '@/lib/supabase'
import { EvaluationResult } from '@/lib/ai'

interface Deck {
  id: string
  title: string
  card_count: number
  is_custom: boolean
}

const PROGRESS_STORAGE_KEY = 'semantic-flow-deck-progress'
const DAILY_PROGRESS_KEY = 'semantic-flow-daily-progress'
const SIDEBAR_COLLAPSED_KEY = 'semantic-flow-sidebar-collapsed'
const DECK_ORDER_KEY = 'semantic-flow-deck-order'

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

interface DailyProgressData {
  date: string
  completed: number
  completedCards: string[]
}

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Dialog 状态
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isAddCardsDialogOpen, setIsAddCardsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateEmptyDialogOpen, setIsCreateEmptyDialogOpen] = useState(false)
  const [isTransferCardDialogOpen, setIsTransferCardDialogOpen] = useState(false)

  const [targetDeckId, setTargetDeckId] = useState<string | null>(null)
  const [transferCardId, setTransferCardId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [deckProgress, setDeckProgress] = useState<Record<string, number>>({})
  const [dailyProgress, setDailyProgress] = useState<DailyProgressData>({
    date: getTodayString(),
    completed: 0,
    completedCards: [],
  })

  const [flashcardKey, setFlashcardKey] = useState(0)

  const targetDeck = decks.find(d => d.id === targetDeckId)
  const currentCard = cards[currentCardIndex] || null

  // 加载持久化数据
  useEffect(() => {
    const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (savedProgress) {
      try { setDeckProgress(JSON.parse(savedProgress)) } catch (e) { console.error(e) }
    }

    const savedDailyProgress = localStorage.getItem(DAILY_PROGRESS_KEY)
    if (savedDailyProgress) {
      try {
        const parsed = JSON.parse(savedDailyProgress) as DailyProgressData
        if (parsed.date === getTodayString()) {
          setDailyProgress(parsed)
        }
      } catch (e) { console.error(e) }
    }

    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (savedCollapsed) {
      setIsSidebarCollapsed(savedCollapsed === 'true')
    }
  }, [])

  const saveDeckProgress = useCallback((newProgress: Record<string, number>) => {
    setDeckProgress(newProgress)
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress))
  }, [])

  const saveDailyProgress = useCallback((newProgress: DailyProgressData) => {
    setDailyProgress(newProgress)
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(newProgress))
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
      return newValue
    })
  }, [])

  const fetchDecks = useCallback(async () => {
    console.log('fetchDecks called - fetching from API...')
    try {
      const response = await fetch('/api/decks')
      const data = await response.json()
      console.log('fetchDecks - API returned:', data.decks?.length, 'decks')
      if (data.success) {
        // 应用保存的排序顺序
        const savedOrder = localStorage.getItem(DECK_ORDER_KEY)
        if (savedOrder) {
          try {
            const orderArray: string[] = JSON.parse(savedOrder)
            const sortedDecks = [...data.decks].sort((a: Deck, b: Deck) => {
              const indexA = orderArray.indexOf(a.id)
              const indexB = orderArray.indexOf(b.id)
              // 未在保存顺序中的 deck 放到最后
              if (indexA === -1 && indexB === -1) return 0
              if (indexA === -1) return 1
              if (indexB === -1) return -1
              return indexA - indexB
            })
            setDecks(sortedDecks)
            console.log('fetchDecks - applied saved order')
          } catch {
            setDecks(data.decks)
          }
        } else {
          setDecks(data.decks)
        }
        console.log('fetchDecks - setDecks called with', data.decks.length, 'decks')
      }
    } catch (error) {
      console.error('Failed to fetch decks:', error)
    }
  }, [])

  useEffect(() => { fetchDecks() }, [fetchDecks])

  const handleSelectDeck = async (deckId: string) => {
    if (selectedDeckId && cards.length > 0) {
      saveDeckProgress({ ...deckProgress, [selectedDeckId]: currentCardIndex })
    }

    setSelectedDeckId(deckId)
    setIsLoading(true)

    const savedIndex = deckProgress[deckId] || 0
    setCurrentCardIndex(savedIndex)
    setFlashcardKey(prev => prev + 1)

    try {
      const response = await fetch(`/api/cards/${deckId}`)
      const data = await response.json()
      if (data.success) {
        setCards(data.cards)
        if (savedIndex >= data.cards.length) setCurrentCardIndex(0)
      } else {
        setCards([])
        setCurrentCardIndex(0)
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error)
      setCards([])
      setCurrentCardIndex(0)
    } finally {
      setIsLoading(false)
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
        if (!dailyProgress.completedCards.includes(currentCard.id)) {
          saveDailyProgress({
            ...dailyProgress,
            completed: dailyProgress.completed + 1,
            completedCards: [...dailyProgress.completedCards, currentCard.id],
          })
        }
        return data.evaluation
      }
      return null
    } catch (error) {
      console.error('Failed to evaluate:', error)
      return null
    }
  }

  const handleCardChange = (newIndex: number) => {
    setCurrentCardIndex(newIndex)
    setFlashcardKey(prev => prev + 1)
    if (selectedDeckId) {
      saveDeckProgress({ ...deckProgress, [selectedDeckId]: newIndex })
    }
  }

  const handleNextCard = () => {
    handleCardChange(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)
  }

  const handlePrevCard = () => {
    if (currentCardIndex > 0) handleCardChange(currentCardIndex - 1)
  }

  // Deck 操作
  const handleGenerateDeck = async (topic: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        if (data.deck?.id) handleSelectDeck(data.deck.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to generate deck:', error)
      return false
    }
  }

  const handleAddCardsToDeck = async (deckId: string, topic: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, deckId }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        if (selectedDeckId === deckId) handleSelectDeck(deckId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add cards:', error)
      return false
    }
  }

  const handleUploadCard = async (deckId: string, card: { chinese_concept: string; context_hint: string; anchor_data: { text: string; tag: string }[] }): Promise<boolean> => {
    try {
      const response = await fetch('/api/cards/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, card }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        if (selectedDeckId === deckId) handleSelectDeck(deckId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to upload card:', error)
      return false
    }
  }

  const handleMergeDeck = async (sourceDeckId: string, targetDeckId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/decks/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDeckId, targetDeckId }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        if (selectedDeckId === sourceDeckId) handleSelectDeck(targetDeckId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to merge deck:', error)
      return false
    }
  }

  const handleRenameDeck = async (deckId: string, newTitle: string): Promise<boolean> => {
    console.log('page.tsx handleRenameDeck called:', { deckId, newTitle })
    try {
      const response = await fetch('/api/decks/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, newTitle }),
      })
      const data = await response.json()
      console.log('API response:', data)
      if (data.success) {
        await fetchDecks()
        return true
      }
      console.log('API returned failure:', data.error)
      return false
    } catch (error) {
      console.error('Failed to rename deck:', error)
      return false
    }
  }

  const handleDeleteDeck = async (deckId: string): Promise<boolean> => {
    console.log('page.tsx handleDeleteDeck called:', { deckId })
    try {
      const response = await fetch(`/api/decks/manage?id=${deckId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      console.log('Delete API response:', data)
      if (data.success) {
        await fetchDecks()
        if (selectedDeckId === deckId) {
          setSelectedDeckId(null)
          setCards([])
        }
        return true
      }
      console.log('Delete API returned failure:', data.error)
      return false
    } catch (error) {
      console.error('Failed to delete deck:', error)
      return false
    }
  }

  const handleCreateEmptyDeck = async (title: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/decks/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        if (data.deck?.id) handleSelectDeck(data.deck.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to create deck:', error)
      return false
    }
  }

  // 卡片转移
  const handleTransferCard = async (cardId: string, targetDeckId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/cards/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, targetDeckId }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchDecks()
        // 从当前卡片列表中移除转移的卡片
        const newCards = cards.filter(c => c.id !== cardId)
        setCards(newCards)
        if (currentCardIndex >= newCards.length && newCards.length > 0) {
          setCurrentCardIndex(newCards.length - 1)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to transfer card:', error)
      return false
    }
  }

  // Deck 排序
  const handleReorderDecks = useCallback((newOrder: string[]) => {
    // 保存新顺序到 localStorage
    localStorage.setItem(DECK_ORDER_KEY, JSON.stringify(newOrder))

    // 根据新顺序重新排列 decks
    const sortedDecks = [...decks].sort((a, b) => {
      const indexA = newOrder.indexOf(a.id)
      const indexB = newOrder.indexOf(b.id)
      return indexA - indexB
    })
    setDecks(sortedDecks)
    console.log('Decks reordered:', newOrder)
  }, [decks])

  // 打开对话框
  const openCreateDeck = (mode: 'ai' | 'manual') => {
    if (mode === 'ai') {
      setIsGenerateDialogOpen(true)
    } else {
      setIsCreateEmptyDialogOpen(true)
    }
  }

  const openAddCardsDialog = (deckId: string) => {
    setTargetDeckId(deckId)
    setIsAddCardsDialogOpen(true)
  }

  const openUploadDialog = (deckId: string) => {
    setTargetDeckId(deckId)
    setIsUploadDialogOpen(true)
  }

  const openMergeDialog = (deckId: string) => {
    setTargetDeckId(deckId)
    setIsMergeDialogOpen(true)
  }

  const openRenameDialog = (deckId: string) => {
    setTargetDeckId(deckId)
    setIsRenameDialogOpen(true)
  }

  const openDeleteDialog = (deckId: string) => {
    setTargetDeckId(deckId)
    setIsDeleteDialogOpen(true)
  }

  const openTransferCardDialog = () => {
    if (currentCard) {
      setTransferCardId(currentCard.id)
      setIsTransferCardDialogOpen(true)
    }
  }

  const displayDailyProgress = {
    completed: dailyProgress.completed,
    total: Math.max(dailyProgress.completed, 10),
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        decks={decks}
        selectedDeckId={selectedDeckId}
        onSelectDeck={handleSelectDeck}
        onCreateDeck={openCreateDeck}
        onAddCardsToDeck={openAddCardsDialog}
        onUploadCard={openUploadDialog}
        onMergeDeck={openMergeDialog}
        onRenameDeck={openRenameDialog}
        onDeleteDeck={openDeleteDialog}
        onReorderDecks={handleReorderDecks}
        deckProgress={deckProgress}
        dailyProgress={displayDailyProgress}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        <Flashcard
          key={`${selectedDeckId}-${currentCardIndex}-${flashcardKey}`}
          card={currentCard}
          onSubmit={handleSubmitEvaluation}
          onNextCard={handleNextCard}
          onPrevCard={handlePrevCard}
          currentIndex={currentCardIndex}
          totalCards={cards.length}
          isLoading={isLoading}
          onTransferCard={openTransferCardDialog}
        />

        {cards.length > 0 && (
          <div className="p-4 border-t border-border bg-card/50">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* 进度条 */}
              <div className="relative h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-secondary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                />
              </div>

              {/* 导航控制 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Card {currentCardIndex + 1} of {cards.length}
                </span>

                {/* 页码跳转 */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={cards.length}
                    defaultValue={currentCardIndex + 1}
                    key={currentCardIndex}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = parseInt((e.target as HTMLInputElement).value)
                        if (target >= 1 && target <= cards.length) {
                          handleCardChange(target - 1)
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const target = parseInt(e.target.value)
                      if (target >= 1 && target <= cards.length) {
                        handleCardChange(target - 1)
                      }
                    }}
                    className="w-14 px-2 py-1 text-center text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                  <span className="text-muted-foreground text-xs">/ {cards.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <GenerateDeckDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onGenerate={handleGenerateDeck}
      />

      <AddCardsDialog
        open={isAddCardsDialogOpen}
        onOpenChange={setIsAddCardsDialogOpen}
        deckId={targetDeckId}
        deckTitle={targetDeck?.title || ''}
        onAddCards={handleAddCardsToDeck}
      />

      <UploadCardDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        deckId={targetDeckId}
        deckTitle={targetDeck?.title || ''}
        decks={decks}
        onUpload={handleUploadCard}
      />

      <MergeDeckDialog
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        sourceDeckId={targetDeckId}
        sourceDeckTitle={targetDeck?.title || ''}
        decks={decks}
        onMerge={handleMergeDeck}
      />

      <RenameDeckDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        deckId={targetDeckId}
        currentTitle={targetDeck?.title || ''}
        onRename={handleRenameDeck}
      />

      <DeleteDeckDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deckId={targetDeckId}
        deckTitle={targetDeck?.title || ''}
        cardCount={targetDeck?.card_count || 0}
        onDelete={handleDeleteDeck}
      />

      <CreateEmptyDeckDialog
        open={isCreateEmptyDialogOpen}
        onOpenChange={setIsCreateEmptyDialogOpen}
        onCreate={handleCreateEmptyDeck}
      />

      <TransferCardDialog
        open={isTransferCardDialogOpen}
        onOpenChange={setIsTransferCardDialogOpen}
        cardId={transferCardId}
        currentDeckId={selectedDeckId}
        decks={decks}
        onTransfer={handleTransferCard}
      />
    </div>
  )
}
