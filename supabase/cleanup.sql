-- =============================================
-- Semantic Flow - 数据清理脚本（安全版本）
-- 用于清空现有数据，为多用户模式做准备
-- =============================================

DO $$
BEGIN
    -- 清空 reviews 表（如果存在）
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        TRUNCATE TABLE reviews CASCADE;
        RAISE NOTICE 'reviews 表已清空';
    END IF;

    -- 清空 cards 表（如果存在）
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cards') THEN
        TRUNCATE TABLE cards CASCADE;
        RAISE NOTICE 'cards 表已清空';
    END IF;

    -- 清空 decks 表（如果存在）
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decks') THEN
        TRUNCATE TABLE decks CASCADE;
        RAISE NOTICE 'decks 表已清空';
    END IF;

    -- 清空 profiles 表（如果存在）
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        TRUNCATE TABLE profiles CASCADE;
        RAISE NOTICE 'profiles 表已清空';
    END IF;

    RAISE NOTICE '✅ 数据清理完成！';
END $$;

-- 完成提示
SELECT '✅ 数据清理完成！现在请执行 schema-v2.sql' AS status;
