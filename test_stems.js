const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/SUPABASE_URL=([^\r\n]+)/)[1];
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('watcher_rules')
    .select('title, vendor_name, tags')
    .ilike('title', '%valve%')
    .limit(15);
  
  if (error) {
     console.error(error);
  } else {
     console.log(JSON.stringify(data.map(d => d.title), null, 2));
  }
}

check();
