import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-dashboard-auth'] !== process.env.DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.body;
  const { error } = await supabase.from('watcher_rules').delete().eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
