-- Memory Engine - 数据库迁移脚本
-- 添加 last_score 字段到 reviews 表

-- 添加 last_score 字段（如果不存在）
DO $$ BEGIN
  ALTER TABLE reviews ADD COLUMN last_score int DEFAULT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 完成提示
SELECT '✅ Memory Engine 数据库迁移完成！' AS status;
