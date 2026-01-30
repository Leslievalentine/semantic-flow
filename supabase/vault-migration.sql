-- Knowledge Vault Migration
-- 扩展 reviews 表以存储用户输入和 AI 反馈

-- 添加 last_user_input 字段（用户上次输入的英文句子）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS last_user_input TEXT;

-- 添加 last_feedback 字段（AI 的评价反馈，JSONB 格式）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS last_feedback JSONB;

-- 创建 user_settings 表（存储用户偏好设置）
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS 策略 for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- 索引优化：按分数查询卡片
CREATE INDEX IF NOT EXISTS idx_reviews_last_score ON reviews(user_id, last_score);
CREATE INDEX IF NOT EXISTS idx_reviews_last_reviewed_at ON reviews(user_id, last_reviewed_at);
