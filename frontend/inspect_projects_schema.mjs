import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProjects() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error("Projects query error:", error);
  } else {
    console.log("Project columns:", Object.keys(data[0] || {}));
    console.log("First project:", data[0]);
  }
}

inspectProjects();
