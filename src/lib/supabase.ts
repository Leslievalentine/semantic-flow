import { createClient } from '@supabase/supabase-js'

// Supabase 客户端 - 服务端使用
export const supabase = createClient(
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
