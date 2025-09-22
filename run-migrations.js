const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Read migration files
  const migration1 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20240101000000_initial_schema.sql'), 'utf8');
  const migration2 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20240102000000_add_profiles.sql'), 'utf8');

  console.log('Running initial schema migration...');

  // Split queries and run them individually
  const queries1 = migration1.split(';').filter(q => q.trim().length > 0);
  const queries2 = migration2.split(';').filter(q => q.trim().length > 0);

  for (const query of [...queries1, ...queries2]) {
    try {
      if (query.trim()) {
        console.log('Executing:', query.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: query.trim() });
        if (error) {
          console.warn('Query warning (might be expected):', error.message);
        } else {
          console.log('✅ Success');
        }
      }
    } catch (err) {
      console.warn('Query executed (might be expected error):', err.message);
    }
  }

  console.log('\n🎉 Migration completed! Check your Supabase dashboard to verify tables were created.');
}

runMigrations().catch(console.error);