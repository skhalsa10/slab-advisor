-- ============================================================================
-- COMBINED DATABASE AUDIT SCRIPT
-- Purpose: Get all database info in one query result
-- Usage: Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Combine all audit queries with UNION ALL to see everything at once
(
    -- Tables
    SELECT 
        'TABLES' as audit_type,
        tablename as object_name,
        'Has RLS: ' || rowsecurity::text as detail1,
        'Has Triggers: ' || hastriggers::text as detail2,
        '' as detail3
    FROM pg_tables 
    WHERE schemaname = 'public'
)
UNION ALL
(
    -- Columns
    SELECT 
        'COLUMNS' as audit_type,
        table_name || '.' || column_name as object_name,
        data_type as detail1,
        'Nullable: ' || is_nullable as detail2,
        COALESCE(column_default, '') as detail3
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name IN ('collection_cards', 'user_credits')
)
UNION ALL
(
    -- RLS Policies
    SELECT 
        'RLS_POLICIES' as audit_type,
        tablename || '.' || policyname as object_name,
        cmd as detail1,
        CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as detail2,
        LEFT(COALESCE(qual::text, ''), 50) as detail3
    FROM pg_policies 
    WHERE schemaname = 'public'
)
UNION ALL
(
    -- Functions
    SELECT 
        'FUNCTIONS' as audit_type,
        proname as object_name,
        pg_get_function_arguments(p.oid) as detail1,
        pg_get_function_result(p.oid) as detail2,
        CASE
            WHEN prokind = 'a' THEN 'aggregate'
            WHEN prokind = 'w' THEN 'window'
            WHEN prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
            ELSE 'normal'
        END as detail3
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
)
UNION ALL
(
    -- Triggers
    SELECT 
        'TRIGGERS' as audit_type,
        trigger_name as object_name,
        event_object_table as detail1,
        event_manipulation || ' ' || action_timing as detail2,
        '' as detail3
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public'
)
UNION ALL
(
    -- Indexes
    SELECT 
        'INDEXES' as audit_type,
        indexname as object_name,
        tablename as detail1,
        LEFT(indexdef, 50) as detail2,
        '' as detail3
    FROM pg_indexes 
    WHERE schemaname = 'public'
)
UNION ALL
(
    -- Row Counts
    SELECT 
        'ROW_COUNTS' as audit_type,
        relname as object_name,
        'Live rows: ' || n_live_tup::text as detail1,
        'Dead rows: ' || n_dead_tup::text as detail2,
        '' as detail3
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
)
ORDER BY audit_type, object_name;