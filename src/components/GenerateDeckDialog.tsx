'use client'

import { useState, useEffect } from 'react'
import { Loader2, Sparkles, Plus, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// 生成新卡组对话框
interface GenerateDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onGenerate: (topic: string) => Promise<boolean>
}

export function GenerateDeckDialog({ open, onOpenChange, onGenerate }: GenerateDeckDialogProps) {
    const [topic, setTopic] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!topic.trim()) return

        setIsGenerating(true)
        const success = await onGenerate(topic)
        setIsGenerating(false)

        if (success) {
            setTopic('')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-secondary" />
                        AI Generate New Deck
                    </DialogTitle>
                    <DialogDescription>
                        Enter a topic and AI will generate 5 challenging translation cards for practice.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Input
                        placeholder="e.g., Climate Change, Business Negotiation..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isGenerating}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />

                    <Button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating (may take 10-15 seconds)...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Deck
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 追加卡片对话框
interface AddCardsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deckId: string | null
    deckTitle: string
    onAddCards: (deckId: string, topic: string) => Promise<boolean>
}

export function AddCardsDialog({ open, onOpenChange, deckId, deckTitle, onAddCards }: AddCardsDialogProps) {
    const [topic, setTopic] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!topic.trim() || !deckId) return

        setIsGenerating(true)
        const success = await onAddCards(deckId, topic)
        setIsGenerating(false)

        if (success) {
            setTopic('')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-secondary" />
                        AI Add Cards
                    </DialogTitle>
                    <DialogDescription>
                        Add more AI-generated cards to &ldquo;{deckTitle}&rdquo;
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Input
                        placeholder="Subtopic within the deck theme..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isGenerating}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />

                    <Button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Cards
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 手动上传卡片对话框
interface UploadCardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deckId: string | null
    deckTitle: string
    decks: { id: string; title: string }[]
    onUpload: (deckId: string, card: { chinese_concept: string; context_hint: string; anchor_data: { text: string; tag: string }[] }) => Promise<boolean>
}

export function UploadCardDialog({ open, onOpenChange, deckId, deckTitle, decks, onUpload }: UploadCardDialogProps) {
    const [selectedDeckId, setSelectedDeckId] = useState(deckId || '')
    const [chineseConcept, setChineseConcept] = useState('')
    const [contextHint, setContextHint] = useState('')
    const [anchors, setAnchors] = useState<{ text: string; tag: string }[]>([
        { text: '', tag: 'Formal' },
        { text: '', tag: 'Academic' },
    ])
    const [isUploading, setIsUploading] = useState(false)

    // 当 deckId 变化时更新选中的 deck
    useState(() => {
        if (deckId) setSelectedDeckId(deckId)
    })

    const handleAddAnchor = () => {
        setAnchors([...anchors, { text: '', tag: 'Neutral' }])
    }

    const handleRemoveAnchor = (index: number) => {
        if (anchors.length > 1) {
            setAnchors(anchors.filter((_, i) => i !== index))
        }
    }

    const handleAnchorChange = (index: number, field: 'text' | 'tag', value: string) => {
        const newAnchors = [...anchors]
        newAnchors[index][field] = value
        setAnchors(newAnchors)
    }

    const handleUpload = async () => {
        const targetDeckId = selectedDeckId || deckId
        if (!targetDeckId || !chineseConcept.trim() || !anchors.some(a => a.text.trim())) return

        setIsUploading(true)
        const success = await onUpload(targetDeckId, {
            chinese_concept: chineseConcept,
            context_hint: contextHint,
            anchor_data: anchors.filter(a => a.text.trim()),
        })
        setIsUploading(false)

        if (success) {
            // 重置表单
            setChineseConcept('')
            setContextHint('')
            setAnchors([
                { text: '', tag: 'Formal' },
                { text: '', tag: 'Academic' },
            ])
            onOpenChange(false)
        }
    }

    const isValid = (selectedDeckId || deckId) &&
        chineseConcept.trim() &&
        anchors.some(a => a.text.trim())

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-secondary" />
                        Upload Custom Card
                    </DialogTitle>
                    <DialogDescription>
                        Manually add a translation practice card{deckTitle ? ` to "${deckTitle}"` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Deck Selector (if no deckId provided) */}
                    {!deckId && decks.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Deck</label>
                            <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a deck..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {decks.map(deck => (
                                        <SelectItem key={deck.id} value={deck.id}>
                                            {deck.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Chinese Concept */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Chinese Concept *</label>
                        <Textarea
                            placeholder="请输入中文句子或短语..."
                            value={chineseConcept}
                            onChange={(e) => setChineseConcept(e.target.value)}
                            className="font-content"
                            rows={2}
                        />
                    </div>

                    {/* Context Hint */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Context Hint (Optional)</label>
                        <Input
                            placeholder="e.g., Formal Argument, Business Email..."
                            value={contextHint}
                            onChange={(e) => setContextHint(e.target.value)}
                        />
                    </div>

                    {/* English Anchors */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Native English Alternatives *</label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleAddAnchor}
                                className="h-7 text-xs"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {anchors.map((anchor, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            placeholder="English translation..."
                                            value={anchor.text}
                                            onChange={(e) => handleAnchorChange(index, 'text', e.target.value)}
                                            className="font-content"
                                        />
                                    </div>
                                    <Select
                                        value={anchor.tag}
                                        onValueChange={(value) => handleAnchorChange(index, 'tag', value)}
                                    >
                                        <SelectTrigger className="w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Formal">Formal</SelectItem>
                                            <SelectItem value="Academic">Academic</SelectItem>
                                            <SelectItem value="Literary">Literary</SelectItem>
                                            <SelectItem value="Neutral">Neutral</SelectItem>
                                            <SelectItem value="Casual">Casual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {anchors.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveAnchor(index)}
                                            className="w-8 h-8 flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!isValid || isUploading}
                        className="w-full"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Card
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 合并 Deck 对话框
interface MergeDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceDeckId: string | null
    sourceDeckTitle: string
    decks: { id: string; title: string }[]
    onMerge: (sourceDeckId: string, targetDeckId: string) => Promise<boolean>
}

export function MergeDeckDialog({ open, onOpenChange, sourceDeckId, sourceDeckTitle, decks, onMerge }: MergeDeckDialogProps) {
    const [targetDeckId, setTargetDeckId] = useState('')
    const [isMerging, setIsMerging] = useState(false)

    // 过滤掉源 deck
    const availableDecks = decks.filter(d => d.id !== sourceDeckId)

    const handleMerge = async () => {
        if (!sourceDeckId || !targetDeckId) return

        setIsMerging(true)
        const success = await onMerge(sourceDeckId, targetDeckId)
        setIsMerging(false)

        if (success) {
            setTargetDeckId('')
            onOpenChange(false)
        }
    }

    const targetDeck = availableDecks.find(d => d.id === targetDeckId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Merge Deck
                    </DialogTitle>
                    <DialogDescription>
                        Merge &ldquo;{sourceDeckTitle}&rdquo; into another deck. All cards will be moved and this deck will be deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Merge into:</label>
                        <Select value={targetDeckId} onValueChange={setTargetDeckId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target deck..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDecks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.id}>
                                        {deck.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {targetDeckId && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                            <strong>Warning:</strong> This will move all cards from &ldquo;{sourceDeckTitle}&rdquo; to &ldquo;{targetDeck?.title}&rdquo; and delete the source deck. This action cannot be undone.
                        </div>
                    )}

                    <Button
                        onClick={handleMerge}
                        disabled={!targetDeckId || isMerging}
                        className="w-full"
                        variant="destructive"
                    >
                        {isMerging ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Merging...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Merge and Delete Source
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 重命名 Deck 对话框
interface RenameDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deckId: string | null
    currentTitle: string
    onRename: (deckId: string, newTitle: string) => Promise<boolean>
}

export function RenameDeckDialog({ open, onOpenChange, deckId, currentTitle, onRename }: RenameDeckDialogProps) {
    const [newTitle, setNewTitle] = useState(currentTitle)
    const [isRenaming, setIsRenaming] = useState(false)

    // 当 dialog 打开时或 currentTitle 变化时，同步标题
    useEffect(() => {
        if (open) {
            setNewTitle(currentTitle)
        }
    }, [open, currentTitle])

    const handleRename = async () => {
        console.log('handleRename called:', { deckId, newTitle })
        if (!deckId || !newTitle.trim()) {
            console.log('Rename aborted: missing deckId or newTitle')
            return
        }

        setIsRenaming(true)
        console.log('Calling onRename with:', deckId, newTitle.trim())
        const success = await onRename(deckId, newTitle.trim())
        console.log('onRename result:', success)
        setIsRenaming(false)

        if (success) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Rename Deck
                    </DialogTitle>
                    <DialogDescription>
                        Enter a new name for this deck.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Input
                        placeholder="New deck name..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        disabled={isRenaming}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />

                    <Button
                        onClick={handleRename}
                        disabled={!newTitle.trim() || newTitle === currentTitle || isRenaming}
                        className="w-full"
                    >
                        {isRenaming ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Renaming...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 删除 Deck 确认对话框
interface DeleteDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deckId: string | null
    deckTitle: string
    cardCount: number
    onDelete: (deckId: string) => Promise<boolean>
}

export function DeleteDeckDialog({ open, onOpenChange, deckId, deckTitle, cardCount, onDelete }: DeleteDeckDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        console.log('handleDelete called:', { deckId })
        if (!deckId) {
            console.log('Delete aborted: missing deckId')
            return
        }

        setIsDeleting(true)
        console.log('Calling onDelete with:', deckId)
        const success = await onDelete(deckId)
        console.log('onDelete result:', success)
        setIsDeleting(false)

        if (success) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Deck
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{deckTitle}&rdquo;?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                        <strong>Warning:</strong> This will permanently delete the deck and all {cardCount} cards inside. This action cannot be undone.
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 手动创建空 Deck 对话框
interface CreateEmptyDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (title: string) => Promise<boolean>
}

export function CreateEmptyDeckDialog({ open, onOpenChange, onCreate }: CreateEmptyDeckDialogProps) {
    const [title, setTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        if (!title.trim()) return

        setIsCreating(true)
        const success = await onCreate(title.trim())
        setIsCreating(false)

        if (success) {
            setTitle('')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-secondary" />
                        Create Empty Deck
                    </DialogTitle>
                    <DialogDescription>
                        Create a new deck and add cards manually later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Input
                        placeholder="Deck name..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isCreating}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />

                    <Button
                        onClick={handleCreate}
                        disabled={!title.trim() || isCreating}
                        className="w-full"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Deck
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// 转移卡片对话框
interface TransferCardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cardId: string | null
    currentDeckId: string | null
    decks: { id: string; title: string }[]
    onTransfer: (cardId: string, targetDeckId: string) => Promise<boolean>
}

export function TransferCardDialog({ open, onOpenChange, cardId, currentDeckId, decks, onTransfer }: TransferCardDialogProps) {
    const [targetDeckId, setTargetDeckId] = useState('')
    const [isTransferring, setIsTransferring] = useState(false)

    // 过滤掉当前 deck
    const availableDecks = decks.filter(d => d.id !== currentDeckId)

    const handleTransfer = async () => {
        if (!cardId || !targetDeckId) return

        setIsTransferring(true)
        const success = await onTransfer(cardId, targetDeckId)
        setIsTransferring(false)

        if (success) {
            setTargetDeckId('')
            onOpenChange(false)
        }
    }

    const targetDeck = availableDecks.find(d => d.id === targetDeckId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Transfer Card
                    </DialogTitle>
                    <DialogDescription>
                        Move this card to another deck.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Move to:</label>
                        <Select value={targetDeckId} onValueChange={setTargetDeckId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target deck..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDecks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.id}>
                                        {deck.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {targetDeckId && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                            Card will be moved to &ldquo;{targetDeck?.title}&rdquo;
                        </div>
                    )}

                    <Button
                        onClick={handleTransfer}
                        disabled={!targetDeckId || isTransferring}
                        className="w-full"
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Transfer Card
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
