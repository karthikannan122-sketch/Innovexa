import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAllTables() {
  console.log("====================================================");
  console.log("INSPECTING ALL TABLES ON REMOTE SUPABASE INSTANCE");
  console.log("====================================================");

  // Authenticate as Bob
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  const tablesToCheck = [
    'categories',
    'projects',
    'project_categories',
    'profiles',
    'reviews',
    'project_likes',
    'project_dislikes',
    'project_follows',
    'comments',
    'notifications',
    'messages'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`[Table: ${table}] Error:`, error.message, `(Code: ${error.code})`);
      } else {
        console.log(`[Table: ${table}] ✓ Rows count: ${data?.length || 0}`);
        if (data && data.length > 0) {
          console.log(`   Sample item from ${table}:`, JSON.stringify(data[0]).slice(0, 100) + '...');
        }
      }
    } catch (e) {
      console.log(`[Table: ${table}] Exception:`, e.message);
    }
  }

  console.log("====================================================");
}

inspectAllTables();
