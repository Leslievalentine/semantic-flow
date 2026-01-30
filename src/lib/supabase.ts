import { createBrowserClient } from '@supabase/ssr'

// Supabase 客户端 - 浏览器端使用
// 使用 createBrowserClient 确保 Cookie 正确同步
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 数据库类型定义
export interface Deck {
  id: string
  title: string
  user_id: string | null
  is_custom: boolean
  created_at: string
}

export interface AnchorItem {
  text: string
  tag: string
}

export interface Card {
  id: string
  deck_id: string
  chinese_concept: string
  context_hint: string | null
  anchor_data: AnchorItem[]
  created_at: string
  // Memory Engine 扩展字段
  mastery_level?: 'new' | 'red' | 'yellow' | 'green'
  last_score?: number | null
  next_review_at?: string | null
}

export interface Review {
  id: string
  user_id: string
  card_id: string
  ease_factor: number
  interval: number
  next_review_at: string
  state: 'new' | 'learning' | 'review'
  last_reviewed_at: string
}
