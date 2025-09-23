-- Get complete database schema information

-- 1. List all tables
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Get all columns for each table
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. List all functions
SELECT
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. List all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check if vector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 6. List all constraints
SELECT
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name;