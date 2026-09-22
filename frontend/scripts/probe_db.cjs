// Supabase live column probe (uses @supabase/supabase-js with service role)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || 'YOUR_SUPABASE_SERVICE_ROLE';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const TESTS = [
  { name: 'profiles basic columns', fn: () =>
    sb.from('profiles').select('id,full_name,avatar_url,bio,organization,onboarding_completed,created_at,updated_at').limit(1)
  },
  { name: 'profiles extra columns', fn: () =>
    sb.from('profiles').select('id,name,email,headline,role,points,website_url,credits,reputation_score,reputation_tier,interests,skills,preferred_domains').limit(1)
  },
  { name: 'projects basic columns', fn: () =>
    sb.from('projects').select('id,user_id,category_id,title,description,project_type,launch_url,status,created_at,updated_at').limit(1)
  },
  { name: 'projects extended columns', fn: () =>
    sb.from('projects').select('id,short_description,problem_statement,proposed_solution,target_users,website_url,demo_url,github_url,app_store_url,play_store_url,valid_reviews_count,upvotes_count,downvotes_count,dislikes_count,comments_count,follows_count,published_at,project_stage,creation_type,innovation_type,development_stage,launch_status,category_name,has_live_product,next_community_action,version,validation_target,creator_name,creator_avatar,tags,features,images').limit(1)
  },
  { name: 'reviews columns', fn: () =>
    sb.from('reviews').select('id,project_id,user_id,rating,content,created_at,updated_at,title,reviewer_name,reviewer_avatar,helpful_count,review_status,overall_feedback,suggestion,problem_relevance').limit(1)
  },
  { name: 'notifications columns', fn: () =>
    sb.from('notifications').select('id,user_id,type,message,is_read,created_at,title,project_id,related_project_id,related_message_id,actor_id,sender_id,read_at,data').limit(1)
  },
  { name: 'messages columns', fn: () =>
    sb.from('messages').select('id,sender_id,receiver_id,content,created_at,is_read,message_type,conversation_id,thread_id,parent_id,read_at').limit(1)
  },
  { name: 'community_posts columns', fn: () =>
    sb.from('community_posts').select('id,user_id,content,created_at,updated_at,post_type,type,title,category,category_id,project_id,tags,upvotes_count,downvotes_count,comments_count,is_published,author_name,author_avatar').limit(1)
  },
  { name: 'categories table', fn: () =>
    sb.from('categories').select('id,name,slug,description').limit(1)
  },
  { name: 'project_likes table', fn: () =>
    sb.from('project_likes').select('id,project_id,user_id,created_at,user_name,user_avatar,vote_type').limit(1)
  },
  { name: 'project_dislikes table', fn: () =>
    sb.from('project_dislikes').select('id,project_id,user_id,created_at,user_name,user_avatar,vote_type').limit(1)
  },
  { name: 'project_follows table', fn: () =>
    sb.from('project_follows').select('id,project_id,user_id,created_at,user_name,user_avatar').limit(1)
  },
  { name: 'votes table', fn: () =>
    sb.from('votes').select('id,target_type,target_id,user_id,vote_type,created_at').limit(1)
  },
  { name: 'community_comments table', fn: () =>
    sb.from('community_comments').select('id,post_id,user_id,parent_comment_id,content,created_at,author_name,author_avatar,upvotes_count,downvotes_count,is_deleted').limit(1)
  },
  { name: 'community_resources table', fn: () =>
    sb.from('community_resources').select('id,user_id,title,description,resource_url,resource_type,category_id,category_name,tags,author_name,author_avatar,upvotes_count,downvotes_count,comments_count,is_published,created_at').limit(1)
  },
  { name: 'external_innovations table', fn: () =>
    sb.from('external_innovations').select('id,title,summary,source,source_name,source_domain,source_url,category,tags,ai_summary,published_at,is_active,is_external,likes_count,saves_count,content_hash,created_at').limit(1)
  },
  { name: 'external_sources table', fn: () =>
    sb.from('external_sources').select('id,name,slug,description,url,source_type,category,config,is_active,last_fetched_at,created_at').limit(1)
  },
  { name: 'user_interests table', fn: () =>
    sb.from('user_interests').select('id,user_id,interest,created_at').limit(1)
  },
  { name: 'resource_bookmarks table', fn: () =>
    sb.from('resource_bookmarks').select('id,user_id,resource_id,resource_type,created_at').limit(1)
  },
];

async function main() {
  console.log(`Probing ${TESTS.length} tables...\n`);
  let ok = 0, fail = 0;
  for (const t of TESTS) {
    try {
      const r = await t.fn();
      if (r.error) {
        fail++;
        const msg = String(r.error.message || JSON.stringify(r.error)).slice(0, 200);
        console.log(`FAIL [${t.name}]: ${msg}`);
      } else {
        ok++;
        console.log(`OK   [${t.name}]: returned ${Array.isArray(r.data) ? r.data.length : '?'} rows`);
      }
    } catch (e) {
      fail++;
      console.log(`EXC  [${t.name}]: ${String(e).slice(0, 200)}`);
    }
  }
  console.log(`\nResults: ${ok} OK, ${fail} FAIL`);
}
main();
