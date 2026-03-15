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

      // 1. Find all candidates on vendor site matching the spoke count and position
      let candidates = vData.variants.filter(v => {
        const title = v.public_title.toLowerCase();
        const spokeMatch = v.public_title.includes(spokeNum);
        if (isFrontRule) return spokeMatch && title.includes('front');
        return spokeMatch && (title.includes('rear') || title.includes('xd') || title.includes('hg') || title.includes('ms'));
      });

      if (candidates.length > 0) {
        // 2. Identify the highest vendor price
        const highestPriceVariant = candidates.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        const vendorPrice = highestPriceVariant.price / 100;
        const goalPrice = (vendorPrice * (rule.price_adjustment_factor || 1.0)).toFixed(2);

        // 3. Fetch LoamLabs current data
        const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const sData = await sResponse.json();
        const myCurrentPrice = parseFloat(sData.variant.price).toFixed(2);

        let actionTaken = "Checked";

        // 4. AUTO-UPDATE LOGIC
        if (goalPrice !== myCurrentPrice) {
          if (rule.auto_update === true) {
            // Update Shopify Price
            await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
              method: 'PUT',
              headers: { 
                'X-Shopify-Access-Token': adminToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ variant: { id: rule.shopify_variant_id, price: goalPrice } })
            });
            actionTaken = `UPDATED SHOPIFY PRICE TO $${goalPrice}`;
          } else {
            actionTaken = `MISMATCH DETECTED (Manual Update Required: $${goalPrice})`;
          }
        } else {
          actionTaken = "Prices are in sync";
        }

        reports.push({
          item: rule.title,
          vendor_price: vendorPrice,
          my_price: myCurrentPrice,
          action: actionTaken,
          matched_on: highestPriceVariant.public_title
        });

        // Update Supabase memory
        await supabase.from('watcher_rules').update({ 
          last_price: Math.round(vendorPrice * 100), 
          last_run_at: new Date().toISOString() 
        }).eq('id', rule.id);

      } else {
        reports.push({ item: rule.title, status: "NOT FOUND", url_checked: rule.vendor_url });
      }
    }
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
