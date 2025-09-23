-- Check if the function exists and its signature
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname LIKE '%match_paper_chunks%'
ORDER BY proname;

-- Alternative: Check all functions in public schema
SELECT
  routines.routine_name,
  routines.routine_type,
  parameters.parameter_name,
  parameters.data_type,
  parameters.ordinal_position
FROM information_schema.routines
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.specific_schema = 'public'
  AND routines.routine_name LIKE '%match_paper_chunks%'
ORDER BY routines.routine_name, parameters.ordinal_position;