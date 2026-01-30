-- Semantic Flow - 数据库架构
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- 注意：此脚本支持重复运行

-- ============================================
-- 0. 清理现有策略（如果存在）
-- ============================================
DO $$ BEGIN
  -- Decks policies
  DROP POLICY IF EXISTS "Public decks are visible to everyone" ON decks;
  DROP POLICY IF EXISTS "Users can create custom decks" ON decks;
  DROP POLICY IF EXISTS "Users can update their own decks" ON decks;
  DROP POLICY IF EXISTS "Users can delete their own decks" ON decks;
  -- Cards policies
  DROP POLICY IF EXISTS "Cards follow deck visibility" ON cards;
  DROP POLICY IF EXISTS "Users can manage cards in their decks" ON cards;
  -- Reviews policies
  DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- 1. 卡包表 (Decks)
-- ============================================
CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 为 user_id 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- ============================================
-- 2. 卡片表 (Cards)
-- 一张卡片 = 一个上下文/翻译任务
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks ON DELETE CASCADE NOT NULL,
  chinese_concept text NOT NULL,    -- 中文提示，例如："扩大规模"
  context_hint text,                -- 上下文副标题，例如："Business Context"
  anchor_data jsonb NOT NULL,       -- 结构：[{ "text": "...", "tag": "Standard" }]
  created_at timestamptz DEFAULT now()
);

-- 为 deck_id 创建索引
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);

-- ============================================
-- 3. 复习记录表 (Reviews) - SRS 引擎
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  card_id uuid REFERENCES cards ON DELETE CASCADE NOT NULL,
  ease_factor float DEFAULT 2.5,    -- 难度因子
  interval int DEFAULT 0,           -- 间隔天数
  next_review_at timestamptz DEFAULT now(),
  state text CHECK (state IN ('new', 'learning', 'review')) DEFAULT 'new',
  last_reviewed_at timestamptz DEFAULT now(),
  
  -- 防止重复记录
  UNIQUE(user_id, card_id)
);

-- 创建索引以加速查询到期复习
CREATE INDEX IF NOT EXISTS idx_reviews_user_next ON reviews(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);

-- ============================================
-- 4. 启用 Row Level Security (RLS)
-- ============================================
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS 策略 - Decks
-- ============================================

-- 公共卡组对所有人可见（包括未登录用户）
CREATE POLICY "Public decks are visible to everyone"
  ON decks FOR SELECT
  USING (is_custom = false OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create custom decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 允许更新自己的 deck 或 user_id 为 NULL 的 deck（匿名创建）
CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 允许删除自己的 deck 或 user_id 为 NULL 的 deck（匿名创建）
CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 6. RLS 策略 - Cards
-- ============================================

-- 卡片跟随其所属 deck 的可见性
CREATE POLICY "Cards follow deck visibility"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND (decks.is_custom = false OR decks.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage cards in their decks"
  ON cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND (decks.user_id = auth.uid() OR decks.user_id IS NULL)
    )
  );

-- ============================================
-- 7. RLS 策略 - Reviews
-- ============================================

CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
