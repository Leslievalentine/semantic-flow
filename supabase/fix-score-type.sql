-- 修复 last_score 列类型：从 INTEGER 改为 NUMERIC
-- 这样可以存储小数分数如 9.5, 7.8 等

ALTER TABLE reviews 
ALTER COLUMN last_score TYPE NUMERIC(3,1) 
USING last_score::NUMERIC(3,1);

-- 验证修改
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'last_score';
