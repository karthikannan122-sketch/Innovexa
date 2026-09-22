import { supabase } from "../lib/supabase.js";

export const getProjectCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch categories:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch project categories:", err);
    throw err;
  }
};
