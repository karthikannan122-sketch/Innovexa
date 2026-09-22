import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectCategories() {
  console.log("====================================================");
  console.log("INSPECTING CATEGORIES TABLE IN SUPABASE");
  console.log("====================================================");

  const { data, error } = await supabase.from('categories').select('*');

  if (error) {
    console.error("Error querying categories table:", error);
  } else {
    console.log(`Total rows in 'categories' table: ${data?.length || 0}`);
    console.log("Categories data:", data);
  }
}

inspectCategories();
