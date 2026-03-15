import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getShopifyToken() {
  const response = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  try {
    const { data: rules, error } = await supabase.from('watcher_rules').select('*');
    if (error) throw error;

    const adminToken = await getShopifyToken();
    const reports = [];

    for (const rule of rules) {
      const vResponse = await fetch(`${rule.vendor_url}.js`);
      const vData = await vResponse.json();

      const spokeNum = rule.option_values["Spoke Count"] ? rule.option_values["Spoke Count"].replace(/\D/g, '') : null;
      const isFrontRule = rule.title.toLowerCase().includes('front');
      const freehubGoal = rule.option_values.Freehub ? rule.option_values.Freehub.toLowerCase() : null;

      // 1. Filter variants to those that match the Spoke Count
      let candidates = vData.variants.filter(v => v.public_title.includes(spokeNum));

      // 2. Narrow down by Position (Front vs Rear)
      candidates = candidates.filter(v => {
        const title = v.public_title.toLowerCase();
        if (isFrontRule) return title.includes('front');
        // If it's a Rear rule, it should have "rear" OR a freehub name
        return title.includes('rear') || title.includes('xd') || title.includes('hg') || title.includes('ms') || title.includes('microspline');
      });

      // 3. If it's a Rear hub and we specified a Freehub, find that specific one
      let finalVariant = null;
      if (!isFrontRule && freehubGoal) {
        finalVariant = candidates.find(v => v.public_title.toLowerCase().includes(freehubGoal));
      } else {
        // For Front hubs or if no specific freehub is requested, take the first match
        finalVariant = candidates[0];
      }

      if (finalVariant) {
        const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const sData = await sResponse.json();

        reports.push({
          item: rule.title,
          vendor_price: finalVariant.price / 100,
          loamlabs_price: parseFloat(sData.variant.price),
          status: (finalVariant.price / 100 == sData.variant.price) ? "MATCHED" : "PRICE MISMATCH",
          matched_on: finalVariant.public_title
        });

        await supabase.from('watcher_rules').update({ 
          last_price: finalVariant.price, 
          last_run_at: new Date().toISOString() 
        }).eq('id', rule.id);
      } else {
        reports.push({ 
          item: rule.title, 
          status: "NOT FOUND", 
          debug: `Spoke goal: ${spokeNum}, IsFront: ${isFrontRule}, Candidates found: ${candidates.length}`
        });
      }
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
