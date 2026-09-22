import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProjectCategoriesColumns() {
  await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  // Try insert empty to see expected columns
  const { error } = await supabase.from('project_categories').insert({}).select();
  console.log("Empty insert error (reveals schema):", error);
}

inspectProjectCategoriesColumns();
