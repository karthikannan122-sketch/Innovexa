import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probeCategoriesTable() {
  console.log("====================================================");
  console.log("PROBING SUPABASE CATEGORIES TABLE SCHEMA");
  console.log("====================================================");

  // Try to insert a test category to see if id is UUID or TEXT and what columns exist
  const testCats = [
    {
      id: "93fe2938-c843-4fa4-8b01-b07d59990023",
      name: "Technology",
      slug: "technology"
    },
    {
      id: "9dbbcd45-778e-411c-92cc-debee85d7137",
      name: "Education",
      slug: "education"
    },
    {
      id: "6f52ad32-3f1a-4c28-98e1-959f635c91b1",
      name: "Healthcare",
      slug: "healthcare"
    },
    {
      id: "3a42ce12-5b91-4d1a-821f-818a735c82a2",
      name: "AI & Machine Learning",
      slug: "ai-machine-learning"
    },
    {
      id: "8c91ef23-4a12-4c91-92aa-718f625b90c3",
      name: "Finance & Fintech",
      slug: "fintech"
    },
    {
      id: "4d71ba34-6e21-4f82-83bb-929a514d71e4",
      name: "Design & Creative",
      slug: "design"
    },
    {
      id: "5e82cb45-7f32-4a93-94cc-030b625e82f5",
      name: "Productivity",
      slug: "productivity"
    },
    {
      id: "7a93dc56-8a43-4b04-a5dd-141c736f93a6",
      name: "Cybersecurity",
      slug: "cybersecurity"
    }
  ];

  for (const cat of testCats) {
    const { data, error } = await supabase.from('categories').upsert([cat]).select();
    if (error) {
      console.log(`Upsert error for '${cat.name}':`, error.message, error);
    } else {
      console.log(`✓ Inserted category: ${cat.name} (${cat.id})`);
    }
  }

  const { data: finalCats, error: finalErr } = await supabase.from('categories').select('*');
  console.log(`\nFinal categories count in Supabase: ${finalCats?.length || 0}`);
  console.log("Final categories:", finalCats);
}

probeCategoriesTable();
