import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAnonVsAuth() {
  console.log("1. Querying categories as ANON (unauthenticated)...");
  const { data: anonCats, error: anonErr } = await supabase.from('categories').select('*');
  console.log("Anon result:", { count: anonCats?.length, error: anonErr?.message });

  console.log("\n2. Querying categories as AUTHENTICATED (Bob)...");
  await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  const { data: authCats, error: authErr } = await supabase.from('categories').select('*');
  console.log("Auth result:", { count: authCats?.length, error: authErr?.message });
}

checkAnonVsAuth();
