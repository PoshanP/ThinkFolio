require('dotenv').config({ path: '.env.local' });

async function forceCreateTables() {
  console.log('🔥 FORCE CREATING DATABASE TABLES...');

  // Use direct PostgreSQL connection via HTTP
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const queries = [
    // First, create the basic tables
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS papers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      storage_path TEXT,
      page_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      paper_id UUID NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    )`
  ];

  for (const [index, query] of queries.entries()) {
    try {
      console.log(`📋 Creating table ${index + 1}/${queries.length}...`);

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({
          sql: query,
          options: {}
        })
      });

      if (response.ok) {
        console.log(`✅ Table ${index + 1} created successfully`);
      } else {
        const error = await response.text();
        console.log(`⚠️  Table ${index + 1} response:`, response.status, error);
      }
    } catch (error) {
      console.log(`⚠️  Table ${index + 1} error:`, error.message);
    }
  }

  // Try alternative method - direct SQL via REST API
  console.log('\n🔄 Trying alternative method...');

  try {
    const directQuery = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'upload',
        page_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({
        query: directQuery
      })
    });

    if (response.ok) {
      console.log('✅ Alternative method succeeded!');
    } else {
      console.log('❌ Alternative method failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Alternative method error:', error.message);
  }

  console.log('\n🎯 MANUAL SOLUTION:');
  console.log('If the above didn\'t work, you MUST manually run this in Supabase SQL Editor:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/jneenvfqeiyjglmvcdrp/sql');
  console.log('2. Paste this SQL:');
  console.log('');
  console.log(`
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload',
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paper_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`);
  console.log('3. Click "Run"');
  console.log('');
}

forceCreateTables().catch(console.error);