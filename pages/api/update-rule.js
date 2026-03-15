import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-dashboard-auth'] !== process.env.DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const { id, updates } = req.body;
  
  // Clean the data before sending to Supabase
  const sanitizedUpdates = {
    vendor_url: updates.vendor_url,
    auto_update: updates.auto_update,
    price_adjustment_factor: parseFloat(updates.price_adjustment_factor),
    needs_review: false // Reset review status if edited
  };

  try {
    const { data, error } = await supabase
      .from('watcher_rules')
      .update(sanitizedUpdates)
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
