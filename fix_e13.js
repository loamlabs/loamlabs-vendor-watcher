const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envStr = envFile.split('\n');
const env = {};
envStr.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env['SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  console.log("Fetching e*thirteen products without vendor_url...");
  const { data, error } = await supabase.from('watcher_rules').select('*').eq('vendor_name', 'e*thirteen');
  
  if (error) {
     console.error("DB Error:", error);
     return;
  }

  let updatedCount = 0;
  for (let rule of data) {
    if (!rule.vendor_url || rule.vendor_url.trim() === '') {
       let baseTitle = rule.title.split('-')[0].trim().toLowerCase();
       baseTitle = baseTitle.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
       
       const url = `https://www.ethirteen.com/products/${baseTitle}`;
       console.log(`Restoring [${rule.title}] -> [${url}]`);
       
       const { error: updErr } = await supabase.from('watcher_rules').update({ vendor_url: url }).eq('id', rule.id);
       if (updErr) console.error("Failed to update", rule.id, updErr);
       else updatedCount++;
    }
  }
  console.log(`Successfully restored ${updatedCount} URLs.`);
}

run();
