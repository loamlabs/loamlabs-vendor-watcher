import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to strip "h", "hole", etc. and just get the number (28h -> 28)
const clean = (str) => str.toString().replace(/\D/g, '');

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

      // SMARTER MATCHING:
      const variant = vData.variants.find(v => {
        const colorMatch = v.public_title.toLowerCase().includes(rule.option_values.Color.toLowerCase());
        const spokeMatch = clean(v.public_title) === clean(rule.option_values["Spoke Count"]);
        return colorMatch && spokeMatch;
      });

      if (variant) {
        // Fetch YOUR current price from Shopify
        const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const sData = await sResponse.json();

        reports.push({
          item: rule.title,
          vendor_price: variant.price / 100,
          loamlabs_price: parseFloat(sData.variant.price),
          status: (variant.price / 100 == sData.variant.price) ? "PRICES MATCH" : "!!! PRICE MISMATCH !!!",
          vendor_variant_name: variant.public_title
        });

        await supabase.from('watcher_rules').update({ 
          last_price: variant.price, 
          last_run_at: new Date().toISOString() 
        }).eq('id', rule.id);

      } else {
        reports.push({ 
          item: rule.title, 
          status: "FAILED: Could not find variant matching " + rule.option_values.Color + " and " + rule.option_values["Spoke Count"] 
        });
      }
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
