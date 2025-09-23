-- Force refresh the PostgREST schema cache again
NOTIFY pgrst, 'reload schema';