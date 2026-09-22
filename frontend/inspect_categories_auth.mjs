import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectCategoriesAuth() {
  await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  const { data, error } = await supabase.from('categories').select('*');
  console.log("Categories query as Bob:", { count: data?.length, error });
  console.log("Categories items:", data);
}

inspectCategoriesAuth();
