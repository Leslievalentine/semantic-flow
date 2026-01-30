-- Semantic Flow - Phase 2.0 数据库架构升级
-- 多租户安全架构 + 用户档案系统
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 0. 清理现有 RLS 策略
-- ============================================
-- Decks policies
DROP POLICY IF EXISTS "Public decks are visible to everyone" ON decks;
DROP POLICY IF EXISTS "Users can create custom decks" ON decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON decks;
DROP POLICY IF EXISTS "Users can view their own decks" ON decks;
DROP POLICY IF EXISTS "Users can insert their own decks" ON decks;

-- Cards policies
DROP POLICY IF EXISTS "Cards follow deck visibility" ON cards;
DROP POLICY IF EXISTS "Users can manage cards in their decks" ON cards;
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;

-- Reviews policies
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- ============================================
-- 1. 用户档案表 (Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  daily_goal int DEFAULT 20,           -- 每日打卡目标
  streak_current int DEFAULT 0,        -- 当前连胜天数
  last_active_at timestamptz DEFAULT now(),  -- 用于计算是否断签
  created_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles 策略清理
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Profiles RLS 策略
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. 自动创建用户档案的 Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧 Trigger（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新 Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. 修改 Decks 表 - 添加 user_id 约束
-- ============================================
-- 确保 decks 表存在
CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- ============================================
-- 4. 修改 Cards 表 - 添加 user_id 字段
-- ============================================
-- 确保 cards 表存在
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  chinese_concept text NOT NULL,
  context_hint text,
  anchor_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 添加 user_id 字段（如果不存在）
DO $$ BEGIN
  ALTER TABLE cards ADD COLUMN user_id uuid REFERENCES auth.users ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ============================================
-- 5. Reviews 表结构确认
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  card_id uuid REFERENCES cards ON DELETE CASCADE NOT NULL,
  ease_factor float DEFAULT 2.5,
  interval int DEFAULT 0,
  next_review_at timestamptz DEFAULT now(),
  state text CHECK (state IN ('new', 'learning', 'review')) DEFAULT 'new',
  last_reviewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_next ON reviews(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);

-- ============================================
-- 6. 启用 RLS
-- ============================================
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. 严格的 RLS 策略 - Decks
-- ============================================
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. 严格的 RLS 策略 - Cards
-- ============================================
CREATE POLICY "Users can view their own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON cards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. 严格的 RLS 策略 - Reviews
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

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ Phase 2.0 数据库架构升级完成！' AS status;
