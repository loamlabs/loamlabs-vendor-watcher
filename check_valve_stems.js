require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('watcher_rules')
    .select('title, vendor_name, tags')
    .contains('tags', ['component:valvestem'])
    .limit(20);
  
  if (error) {
     console.error("Tags filter failed, trying title search...");
     const { data: fallback, err } = await supabase
       .from('watcher_rules')
       .select('title, vendor_name')
       .ilike('title', '%valve%stem%')
       .limit(20);
     console.log(JSON.stringify(fallback, null, 2));
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

check();
