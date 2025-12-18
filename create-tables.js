require('dotenv').config({ path: '.env.local' });

async function createTables() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Creating database tables...');

  // Test basic table creation
  const tables = [
    {
      name: 'papers',
      sql: `
        CREATE TABLE IF NOT EXISTS papers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          source TEXT NOT NULL,
          storage_path TEXT,
          page_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    },
    {
      name: 'profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    },
    {
      name: 'chat_sessions',
      sql: `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    },
    {
      name: 'chat_messages',
      sql: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
          role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    }
  ];

  // Try to create tables by checking if they exist
  for (const table of tables) {
    try {
      // Check if table exists by trying to select from it
      const { data, error } = await supabase.from(table.name).select('*').limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table ${table.name} does not exist. Please create it manually.`);
      } else if (error) {
        console.log(`❌ Error checking table ${table.name}:`, error.message);
      } else {
        console.log(`✅ Table ${table.name} already exists`);
      }
    } catch (err) {
      console.log(`❌ Failed to check table ${table.name}:`, err.message);
    }
  }

  console.log('\n📋 TO FIX THE DATABASE ISSUE:');
  console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of setup-database.sql');
  console.log('4. Click "Run" to execute the SQL');
  console.log('\nAlternatively, the tables shown as ❌ need to be created manually.');
}

createTables().catch(console.error);