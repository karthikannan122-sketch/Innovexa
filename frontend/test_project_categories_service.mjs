import { getProjectCategories } from "./src/services/projectCategories.js";
import { supabase } from "./src/lib/supabase.js";

console.log("====================================================");
console.log("TESTING getProjectCategories SERVICE");
console.log("====================================================");

async function testService() {
  try {
    // Authenticate
    await supabase.auth.signInWithPassword({
      email: 'bob.evaluator@demo.innovexa.io',
      password: 'DemoPass123!'
    });

    const categories = await getProjectCategories();
    console.log(`✓ getProjectCategories() returned ${categories.length} categories:`);
    categories.forEach((c, idx) => {
      console.log(`   ${idx + 1}. [${c.id}] ${c.name}`);
    });

    if (categories.length > 0) {
      console.log("\n✓ SERVICE TEST PASSED SUCCESSFULLY!");
    } else {
      console.error("❌ No categories returned.");
    }
  } catch (e) {
    console.error("❌ Error in test:", e);
  }
}

testService();
