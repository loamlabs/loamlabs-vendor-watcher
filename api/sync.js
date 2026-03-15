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

      // 1. Filter variants by Spoke Count and Position
      let candidates = vData.variants.filter(v => {
        const title = v.public_title.toLowerCase();
        const spokeMatch = v.public_title.includes(spokeNum);
        if (isFrontRule) return spokeMatch && title.includes('front');
        return spokeMatch && (title.includes('rear') || title.includes('xd') || title.includes('hg') || title.includes('ms'));
      });

      // 2. Pricing Strategy: Find the highest price among valid candidates
      let targetPrice = 0;
      let matchedTitle = "";

      if (candidates.length > 0) {
        // Find the variant with the highest price
        const highestPriceVariant = candidates.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        targetPrice = highestPriceVariant.price / 100;
        matchedTitle = highestPriceVariant.public_title;

        // 3. Fetch YOUR current price from Shopify
        const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const sData = await sResponse.json();
        const myPrice = parseFloat(sData.variant.price);

        // 4. Calculate the "Goal Price" (Vendor Price * Adjustment Factor)
        const goalPrice = targetPrice * (rule.price_adjustment_factor || 1.0);

        reports.push({
          item: rule.title,
          vendor_highest_price: targetPrice,
          my_current_price: myPrice,
          status: (goalPrice === myPrice) ? "MATCHED" : "PRICE MISMATCH",
          details: `Highest price found on: ${matchedTitle}`
        });

        // 5. Save the price to Supabase memory
        await supabase.from('watcher_rules').update({ 
          last_price: Math.round(targetPrice * 100), 
          last_run_at: new Date().toISOString() 
        }).eq('id', rule.id);

      } else {
        reports.push({ item: rule.title, status: "NOT FOUND" });
      }
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
