import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.headers['x-dashboard-auth'] !== process.env.DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  // 1. Get all unique vendors currently in your rules
  const { data: rules } = await supabase.from('watcher_rules').select('vendor_name');
  const uniqueVendors = [...new Set(rules.map(r => r.vendor_name).filter(Boolean))];

  // 2. Get the existing logo mappings
  const { data: logos } = await supabase.from('vendor_logos').select('*');
  
  res.status(200).json({ vendors: uniqueVendors, savedLogos: logos });
}
