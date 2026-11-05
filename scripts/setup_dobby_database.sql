-- ==============================================================================
-- ĐỀN GIÁO CHỦ DOBBY (DOBBY SANCTUARY): DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Chạy script này tại: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Dự án: fxucyrofcsuqtlkukcrx (Đồng bộ cùng 7-Potters & Undercover Hogwarts)
-- ==============================================================================

-- 1. BẢNG THỐNG KÊ CÔNG ĐỨC & MÕ TOÀN SẢNH (DOBBY_SANCTUARY_STATS)
CREATE TABLE IF NOT EXISTS public.dobby_sanctuary_stats (
    room_code VARCHAR(32) PRIMARY KEY,
    total_merit BIGINT NOT NULL DEFAULT 108,
    total_moktak BIGINT NOT NULL DEFAULT 108,
    total_bows BIGINT NOT NULL DEFAULT 18,
    total_oracles BIGINT NOT NULL DEFAULT 24,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.dobby_sanctuary_stats (room_code, total_merit, total_moktak, total_bows, total_oracles)
VALUES ('1', 108, 108, 18, 24)
ON CONFLICT (room_code) DO NOTHING;

-- 2. BẢNG LỊCH SỬ XIN QUẺ & NGHI THỨC (DOBBY_ORACLE_LOGS)
CREATE TABLE IF NOT EXISTS public.dobby_oracle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(32) NOT NULL DEFAULT '1',
    client_id VARCHAR(64) NOT NULL,
    wizard_name VARCHAR(80) NOT NULL DEFAULT '🧙 Phù Thuỷ Ẩn Danh',
    ritual_type VARCHAR(32) NOT NULL,   -- 'food' | 'place' | 'tuvi' | 'moktak' | 'moktak_108' | 'bow'
    summary TEXT NOT NULL,
    merit_delta INT NOT NULL DEFAULT 1,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dobby_oracle_logs_room_created
    ON public.dobby_oracle_logs (room_code, created_at DESC);

-- 3. BẢNG HIỆN DIỆN PHÙ THUỶ TRONG SẢNH 3D (DOBBY_ROOM_PEERS)
CREATE TABLE IF NOT EXISTS public.dobby_room_peers (
    id VARCHAR(64) NOT NULL,
    room_code VARCHAR(32) NOT NULL DEFAULT '1',
    wizard_name VARCHAR(80) NOT NULL DEFAULT '🧙 Phù Thuỷ Trốn Họp',
    state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, room_code)
);

CREATE INDEX IF NOT EXISTS idx_dobby_room_peers_room_seen
    ON public.dobby_room_peers (room_code, last_seen_at DESC);

-- 4. BẬT ROW LEVEL SECURITY (RLS) & POLICIES CHO PUBLIC SANCTUARY
ALTER TABLE public.dobby_sanctuary_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dobby_oracle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dobby_room_peers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dobby stats" ON public.dobby_sanctuary_stats;
CREATE POLICY "Public read dobby stats" ON public.dobby_sanctuary_stats
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert dobby stats" ON public.dobby_sanctuary_stats;
CREATE POLICY "Public upsert dobby stats" ON public.dobby_sanctuary_stats
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read dobby logs" ON public.dobby_oracle_logs;
CREATE POLICY "Public read dobby logs" ON public.dobby_oracle_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert dobby logs" ON public.dobby_oracle_logs;
CREATE POLICY "Public insert dobby logs" ON public.dobby_oracle_logs
    FOR INSERT WITH CHECK (char_length(summary) <= 280 AND merit_delta BETWEEN 0 AND 20);

DROP POLICY IF EXISTS "Public read dobby peers" ON public.dobby_room_peers;
CREATE POLICY "Public read dobby peers" ON public.dobby_room_peers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert dobby peers" ON public.dobby_room_peers;
CREATE POLICY "Public upsert dobby peers" ON public.dobby_room_peers
    FOR ALL USING (true) WITH CHECK (true);

-- 5. ĐĂNG KÝ SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'dobby_sanctuary_stats'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dobby_sanctuary_stats;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'dobby_oracle_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dobby_oracle_logs;
    END IF;
END $$;

-- 6. HÀM DỌN DẸP PHÙ THUỶ NGẮT KẾT NỐI & LOG CŨ (TTL CLEANUP)
CREATE OR REPLACE FUNCTION public.cleanup_stale_dobby_sanctuary()
RETURNS INT AS $$
DECLARE
    removed_count INT;
BEGIN
    DELETE FROM public.dobby_room_peers
    WHERE last_seen_at < now() - INTERVAL '2 minutes';
    GET DIAGNOSTICS removed_count = ROW_COUNT;

    DELETE FROM public.dobby_oracle_logs
    WHERE created_at < now() - INTERVAL '7 days';

    RETURN removed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
