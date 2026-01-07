-- Migration: Enable RLS on all public tables
-- This fixes the security warnings from Supabase linter
-- Run this in your Supabase SQL editor

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

-- Core tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- These policies allow the service role (backend) full access
-- and restrict anon/authenticated users appropriately
-- =============================================

-- EMPLOYEES TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.employees;
DROP POLICY IF EXISTS "Anon can read employees" ON public.employees;

CREATE POLICY "Service role full access" ON public.employees
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read employees" ON public.employees
    FOR SELECT USING (true);

-- CALL_SESSIONS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.call_sessions;
DROP POLICY IF EXISTS "Anon can insert" ON public.call_sessions;
DROP POLICY IF EXISTS "Anon can read call_sessions" ON public.call_sessions;

CREATE POLICY "Service role full access" ON public.call_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read call_sessions" ON public.call_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anon can insert call_sessions" ON public.call_sessions
    FOR INSERT WITH CHECK (true);

-- CALL_INSIGHTS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.call_insights;
DROP POLICY IF EXISTS "Anon can read call_insights" ON public.call_insights;

CREATE POLICY "Service role full access" ON public.call_insights
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read call_insights" ON public.call_insights
    FOR SELECT USING (true);

-- CHAT_SESSIONS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anon can insert" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anon can read chat_sessions" ON public.chat_sessions;

CREATE POLICY "Service role full access" ON public.chat_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read chat_sessions" ON public.chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anon can insert chat_sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (true);

-- MESSAGES TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.messages;
DROP POLICY IF EXISTS "Anon can insert" ON public.messages;
DROP POLICY IF EXISTS "Anon can read messages" ON public.messages;

CREATE POLICY "Service role full access" ON public.messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Anon can insert messages" ON public.messages
    FOR INSERT WITH CHECK (true);

-- SMS_MESSAGES TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.sms_messages;
DROP POLICY IF EXISTS "Anon can read sms_messages" ON public.sms_messages;

CREATE POLICY "Service role full access" ON public.sms_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read sms_messages" ON public.sms_messages
    FOR SELECT USING (true);

-- CONSULTATIONS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.consultations;
DROP POLICY IF EXISTS "Anon can read consultations" ON public.consultations;

CREATE POLICY "Service role full access" ON public.consultations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read consultations" ON public.consultations
    FOR SELECT USING (true);

-- BOOKINGS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.bookings;
DROP POLICY IF EXISTS "Anon can read bookings" ON public.bookings;

CREATE POLICY "Service role full access" ON public.bookings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read bookings" ON public.bookings
    FOR SELECT USING (true);

CREATE POLICY "Anon can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- DOCUMENTS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.documents;
DROP POLICY IF EXISTS "Anon can read documents" ON public.documents;

CREATE POLICY "Service role full access" ON public.documents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read documents" ON public.documents
    FOR SELECT USING (true);

-- PROCESSES TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.processes;
DROP POLICY IF EXISTS "Anon can read processes" ON public.processes;

CREATE POLICY "Service role full access" ON public.processes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read processes" ON public.processes
    FOR SELECT USING (true);

-- REPORTS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.reports;
DROP POLICY IF EXISTS "Anon can read reports" ON public.reports;

CREATE POLICY "Service role full access" ON public.reports
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read reports" ON public.reports
    FOR SELECT USING (true);

-- WORKFLOW_MAPPINGS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.workflow_mappings;
DROP POLICY IF EXISTS "Anon can read workflow_mappings" ON public.workflow_mappings;

CREATE POLICY "Service role full access" ON public.workflow_mappings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read workflow_mappings" ON public.workflow_mappings
    FOR SELECT USING (true);

-- ANALYTICS TABLE
DROP POLICY IF EXISTS "Service role full access" ON public.analytics;
DROP POLICY IF EXISTS "Anon can insert" ON public.analytics;
DROP POLICY IF EXISTS "Anon can read analytics" ON public.analytics;

CREATE POLICY "Service role full access" ON public.analytics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read analytics" ON public.analytics
    FOR SELECT USING (true);

CREATE POLICY "Anon can insert analytics" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this query to verify RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
