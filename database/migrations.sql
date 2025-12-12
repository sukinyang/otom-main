-- Otom AI Consultant - Supabase Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- Free tier: 500MB database, 1GB storage, 2GB bandwidth

-- ===========================================
-- CALL SESSIONS (Voice calls via Vapi)
-- ===========================================
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vapi_call_id TEXT,
    phone_number TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) DEFAULT 'outbound',
    status TEXT CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer')) DEFAULT 'initiated',
    platform TEXT DEFAULT 'vapi',

    -- Call data
    transcript TEXT,
    summary TEXT,
    duration_seconds INTEGER,
    cost DECIMAL(10, 4),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_call_sessions_phone ON call_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created ON call_sessions(created_at DESC);

-- ===========================================
-- CHAT SESSIONS (Multi-platform)
-- ===========================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT CHECK (platform IN ('web', 'slack', 'whatsapp', 'telegram', 'teams', 'api')) NOT NULL,

    -- Platform-specific IDs
    platform_user_id TEXT,
    platform_channel_id TEXT,

    -- User info
    user_name TEXT,
    phone_number TEXT,  -- For WhatsApp

    -- Status
    status TEXT CHECK (status IN ('active', 'ended', 'archived')) DEFAULT 'active',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_platform ON chat_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- ===========================================
-- MESSAGES
-- ===========================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,

    -- Message content
    sender TEXT CHECK (sender IN ('user', 'otom')) NOT NULL,
    content TEXT NOT NULL,

    -- Metadata
    platform TEXT,
    intent TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);

-- ===========================================
-- CONSULTATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,  -- Can reference either call or chat session

    -- Client info
    client_email TEXT,
    client_phone TEXT,
    company_name TEXT,

    -- Source
    source_platform TEXT,

    -- Status
    status TEXT CHECK (status IN ('discovery', 'analysis', 'strategy', 'implementation', 'completed', 'cancelled')) DEFAULT 'discovery',
    phase TEXT DEFAULT 'discovery',

    -- Consultation data (stored as JSONB)
    context JSONB DEFAULT '{}',
    analysis JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_session ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_email ON consultations(client_email);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- ===========================================
-- BOOKINGS (Scheduled consultations)
-- ===========================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Client info
    client_email TEXT,
    client_phone TEXT,

    -- Scheduling
    preferred_time TEXT,
    scheduled_at TIMESTAMPTZ,
    timezone TEXT DEFAULT 'UTC',

    -- Status
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',

    -- Source
    source_platform TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pending bookings
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_at) WHERE status = 'scheduled';

-- ===========================================
-- ANALYTICS
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    platform TEXT,
    session_id UUID,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics(platform);

-- ===========================================
-- REPORTS (Generated documents)
-- ===========================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,

    -- Report info
    report_type TEXT CHECK (report_type IN ('quick_assessment', 'strategy_deck', 'full_analysis', 'executive_summary', 'workflow_report')),
    file_name TEXT,
    storage_path TEXT,
    public_url TEXT,
    file_size INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reports_consultation ON reports(consultation_id);

-- ===========================================
-- WORKFLOW MAPPINGS
-- ===========================================
CREATE TABLE IF NOT EXISTS workflow_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    company_name TEXT,

    -- Survey data
    employees_surveyed INTEGER DEFAULT 0,

    -- Analysis results (stored as JSONB)
    workflows JSONB DEFAULT '{}',
    bottlenecks JSONB DEFAULT '[]',
    redundancies JSONB DEFAULT '[]',
    insights JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_company ON workflow_mappings(company_id);

-- ===========================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for backend operations)
CREATE POLICY "Service role full access" ON call_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON chat_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON consultations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON bookings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON workflow_mappings FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow anon role for basic operations (adjust as needed)
CREATE POLICY "Anon can insert" ON call_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert" ON analytics FOR INSERT WITH CHECK (true);

-- ===========================================
-- STORAGE BUCKET (Run in Supabase Dashboard > Storage)
-- ===========================================
-- Create a bucket called 'otom-files' with public access for reports

-- ===========================================
-- REALTIME (Enable in Supabase Dashboard)
-- ===========================================
-- Enable realtime for tables that need live updates:
-- - messages (for live chat)
-- - call_sessions (for call status updates)

-- To enable: Supabase Dashboard > Database > Replication > Add tables

-- ===========================================
-- FUNCTIONS (Optional: Auto-update timestamps)
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_call_sessions_updated_at
    BEFORE UPDATE ON call_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
