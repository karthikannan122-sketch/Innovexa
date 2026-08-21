import { supabase } from './src/lib/supabase.js';
import { INITIAL_CATEGORIES } from './src/services/seedData.js';

async function seedCategories() {
  console.log('--- Seeding public.categories in Supabase ---');
  for (const cat of INITIAL_CATEGORIES) {
    const { data, error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || ''
    }).select();

    if (error) {
      console.error(`Error inserting category ${cat.name}:`, error.message);
    } else {
      console.log(`✓ Inserted category: ${cat.name} (${cat.id})`);
    }
  }
}

seedCategories().catch(console.error);
