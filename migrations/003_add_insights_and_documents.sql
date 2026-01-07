-- Migration: Add call_insights and documents tables
-- Run this in your Supabase SQL editor

-- Table for AI-generated call insights
CREATE TABLE IF NOT EXISTS call_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
    summary TEXT,
    pain_points JSONB DEFAULT '[]'::jsonb,
    workarounds JSONB DEFAULT '[]'::jsonb,
    tools_mentioned JSONB DEFAULT '[]'::jsonb,
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    automation_opportunities JSONB DEFAULT '[]'::jsonb,
    key_quotes JSONB DEFAULT '[]'::jsonb,
    sentiment VARCHAR(20),
    engagement_level VARCHAR(20),
    follow_up_questions JSONB DEFAULT '[]'::jsonb,
    analyzed_at TIMESTAMPTZ,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_insights_session ON call_insights(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_insights_created ON call_insights(created_at DESC);

-- Table for uploaded documents (PDFs, SOPs, handbooks)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),
    file_url TEXT,
    file_type VARCHAR(50) DEFAULT 'pdf',
    file_size BIGINT,
    category VARCHAR(100), -- handbook, sop, policy, training, other
    department VARCHAR(100),
    extracted_text TEXT,
    summary TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, deleted
    uploaded_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

-- Add analysis_status columns to call_sessions if they don't exist
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50);
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS insights_id UUID REFERENCES call_insights(id);
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS analysis_error TEXT;

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE call_insights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your auth setup)
-- GRANT ALL ON call_insights TO authenticated;
-- GRANT ALL ON documents TO authenticated;
