-- =============================================
-- Semantic Flow - RLS 策略快速修复
-- 运行此脚本以修复重命名/删除功能
-- 请在 Supabase SQL Editor 中执行
-- =============================================

-- 1. 删除旧的 decks 策略
DROP POLICY IF EXISTS "Public decks are visible to everyone" ON decks;
DROP POLICY IF EXISTS "Users can create custom decks" ON decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON decks;

-- 2. 创建新的策略（支持匿名用户操作 user_id 为 NULL 的 deck）

-- 允许所有人查看公共 deck 或 user_id 为 NULL 的 deck
CREATE POLICY "Public decks are visible to everyone"
  ON decks FOR SELECT
  USING (is_custom = false OR user_id = auth.uid() OR user_id IS NULL);

-- 允许创建 deck
CREATE POLICY "Users can create custom decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 允许更新自己的 deck 或 user_id 为 NULL 的 deck
CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 允许删除自己的 deck 或 user_id 为 NULL 的 deck
CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 完成！现在重命名和删除功能应该可以正常工作了。
