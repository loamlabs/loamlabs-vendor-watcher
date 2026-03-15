import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-dashboard-auth'] !== process.env.DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { name, logo_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Vendor name is required' });

  try {
    const { error } = await supabase
      .from('vendor_logos')
      .upsert(
        { name, logo_url, updated_at: new Date() }, 
        { onConflict: 'name' }
      );
      
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Supabase Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
