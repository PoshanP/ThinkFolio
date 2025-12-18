const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRAGTables() {
  console.log('Creating RAG-specific tables...\n');

  try {
    // Read the RAG migration SQL file
    const ragSqlPath = path.join(__dirname, 'supabase', 'migrations', '20240103000000_rag_tables.sql');
    const ragSql = fs.readFileSync(ragSqlPath, 'utf8');

    // Split SQL into individual statements and execute them
    const statements = ragSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('select'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_sql')
            .select()
            .single()
            .maybeSingle()
            .rpc('', {}, { body: statement + ';' });

          if (directError) {
            console.error(`Error executing: ${statement.substring(0, 50)}...`);
            console.error(directError.message);
            errorCount++;
          } else {
            console.log(`✓ Executed: ${statement.substring(0, 80)}...`);
            successCount++;
          }
        } else {
          console.log(`✓ Executed: ${statement.substring(0, 80)}...`);
          successCount++;
        }
      } catch (err) {
        console.error(`Error with statement: ${statement.substring(0, 50)}...`);
        console.error(err.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log(`RAG Table Creation Summary:`);
    console.log(`✓ Successful statements: ${successCount}`);
    if (errorCount > 0) {
      console.log(`✗ Failed statements: ${errorCount}`);
      console.log('\nNote: Some errors may be due to tables already existing.');
    }
    console.log('========================================\n');

    // Verify tables were created
    console.log('Verifying RAG tables...\n');
    const tablesToCheck = [
      'document_processing_status',
      'paper_chunks_metadata',
      'vector_index_config',
      'rag_query_logs',
      'retrieved_chunks',
      'document_collections',
      'collection_papers',
      'embedding_cache',
      'user_rag_preferences'
    ];

    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`✗ Table '${tableName}' - Error: ${error.message}`);
      } else {
        console.log(`✓ Table '${tableName}' exists and is accessible`);
      }
    }

    console.log('\n✨ RAG table creation process completed!');
    console.log('\nNext steps:');
    console.log('1. Verify the tables in your Supabase dashboard');
    console.log('2. The RAG agent can now use these tables for document processing');
    console.log('3. Run the RAG agent initialization when ready\n');

  } catch (error) {
    console.error('Fatal error during RAG table creation:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL if RPC doesn't work
async function createRAGTablesDirectSQL() {
  console.log('Attempting direct SQL execution...\n');

  console.log('========================================');
  console.log('MANUAL SETUP REQUIRED');
  console.log('========================================\n');
  console.log('The automatic table creation failed. Please:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Copy the contents of: supabase/migrations/20240103000000_rag_tables.sql');
  console.log('4. Paste and run it in the SQL Editor\n');
  console.log('File location: ' + path.join(__dirname, 'supabase', 'migrations', '20240103000000_rag_tables.sql'));
}

// Run the creation process
createRAGTables().catch(err => {
  console.error('Failed to create tables automatically.');
  createRAGTablesDirectSQL();
});