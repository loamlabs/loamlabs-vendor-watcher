import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const cleanNum = (str) => str ? str.toString().replace(/\D/g, '') : '';

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
  const authHeader = req.headers['x-loam-secret'];
  if (authHeader !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: rules, error } = await supabase.from('watcher_rules').select('*');
    if (error) throw error;

    const adminToken = await getShopifyToken();
    let updatedCount = 0;
    let attentionCount = 0;

    // --- VENDOR LOGIC HANDLERS ---
    // This keeps the code organized. As you add more vendors (Phil Wood, Onyx), 
    // we just add a new "case" below.
    for (const rule of rules) {
      // 1. SILENT SKIP: If no URL is set, don't even try. Fixes the "null.js" noise.
      if (!rule.vendor_url) continue;

      try {
        const vResponse = await fetch(`${rule.vendor_url}.js`);
        if (!vResponse.ok) throw new Error(`Vendor URL unreachable: ${vResponse.status}`);
        const vData = await vResponse.json();

        const spokeGoal = cleanNum(rule.option_values["Spoke Count"]);
        const isFrontRule = rule.title.toLowerCase().includes('front');
        
        // Refined Axle Detection
        const isSuperBoost = rule.title.includes('157') || rule.title.toLowerCase().includes('super');
        const isBoost = rule.title.includes('148') && !isSuperBoost;

        let candidates = [];

        // --- BRANCHING LOGIC BY VENDOR ---
        switch (rule.vendor_name?.toLowerCase()) {
          case 'berd':
            candidates = vData.variants.filter(v => {
              const vTitle = v.public_title.toLowerCase();
              const hasSpokeCount = vTitle.includes(`${spokeGoal} spoke`) || vTitle.includes(`${spokeGoal} hole`) || vTitle.includes(`${spokeGoal}h`);
              if (!hasSpokeCount) return false;

              if (isFrontRule) return vTitle.includes('front');
              
              // Rear Logic
              const isRear = vTitle.includes('rear') || vTitle.includes('xd') || vTitle.includes('hg') || vTitle.includes('ms');
              if (!isRear) return false;

              if (isSuperBoost) return vTitle.includes('157') || vTitle.includes('super');
              if (isBoost) return vTitle.includes('148') && !vTitle.includes('157');

              return true;
            });
            break;

          default:
            candidates = vData.variants.filter(v => v.public_title.includes(spokeGoal));
        }

        console.log(`[${rule.vendor_name || 'Unknown'}] ${rule.title} | Matches: ${candidates.length}`);

        if (candidates.length > 0) {
          const highestPriceVariant = candidates.reduce((prev, current) => (prev.price > current.price) ? prev : current);
          const vendorPrice = highestPriceVariant.price / 100;
          const vendorAvailable = highestPriceVariant.available;
          const factor = rule.price_adjustment_factor || 1.1111;
          const goalPrice = parseFloat(vendorPrice * factor).toFixed(2);

          const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
            method: 'POST',
            headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `query($id: ID!) { productVariant(id: $id) { price compareAtPrice inventoryQuantity product { vendor } } }`,
              variables: { id: `gid://shopify/ProductVariant/${rule.shopify_variant_id}` }
            })
          });
          const sData = await sResponse.json();
          const variant = sData.data?.productVariant;
          if (!variant) throw new Error("Shopify variant ID not found");

          const myPrice = parseFloat(variant.price).toFixed(2);
          const myComparePrice = variant.compareAtPrice ? parseFloat(variant.compareAtPrice).toFixed(2) : null;
          
          let needsUpdate = false;
          let updatePayload = { id: rule.shopify_variant_id };
          let marginAlert = false;

          const priceDropPercent = (myPrice - goalPrice) / myPrice;
          if (priceDropPercent > (rule.price_drop_threshold || 0.20)) marginAlert = true;

          if (goalPrice !== myPrice && !marginAlert) {
            updatePayload.price = goalPrice;
            if (myComparePrice && Number(myComparePrice) > Number(myPrice)) {
              const gap = Number(myComparePrice) - Number(myPrice);
              updatePayload.compare_at_price = (Number(goalPrice) + gap).toFixed(2);
            }
            needsUpdate = true;
          }

          if (needsUpdate && rule.auto_update === true) {
            console.log(`>>> UPDATING SHOPIFY: ${rule.title} to $${goalPrice}`);
            await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
              method: 'PUT',
              headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
              body: JSON.stringify({ variant: updatePayload })
            });
            updatedCount++;
          } else if (needsUpdate || marginAlert) {
            attentionCount++;
            if (marginAlert) await supabase.from('watcher_rules').update({ needs_review: true, review_reason: `Margin Warning: ${Math.round(priceDropPercent * 100)}% drop` }).eq('id', rule.id);
          }

          await supabase.from('watcher_rules').update({ 
            last_price: Math.round(vendorPrice * 100), 
            last_availability: vendorAvailable,
            last_run_at: new Date().toISOString(),
            last_log: marginAlert ? "Margin Review Required" : `Matched $${vendorPrice}. Goal $${goalPrice}. ${needsUpdate ? 'Shopify updated.' : 'In sync.'}`,
            vendor_name: variant.product.vendor // Auto-heal vendor name
          }).eq('id', rule.id);
        }
      } catch (innerErr) {
        console.error(`Error on rule ${rule.title}:`, innerErr.message);
        await supabase.from('watcher_rules').update({ last_log: `Error: ${innerErr.message}` }).eq('id', rule.id);
      }
    } // This closes the 'for (const rule of rules)' loop

    res.status(200).json({ updatedCount, attentionCount });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}
