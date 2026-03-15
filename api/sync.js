import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

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
  // Security Handshake
  const authHeader = req.headers['x-loam-secret'];
  if (authHeader !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: rules, error } = await supabase.from('watcher_rules').select('*');
    if (error) throw error;

    const adminToken = await getShopifyToken();
    
    // Categorized Groups for the Email
    let updated = [];
    let attention = [];
    let inSync = [];

    for (const rule of rules) {
      const vResponse = await fetch(`${rule.vendor_url}.js`);
      const vData = await vResponse.json();
      const spokeNum = rule.option_values["Spoke Count"]?.replace(/\D/g, '');
      const isFrontRule = rule.title.toLowerCase().includes('front');

      let candidates = vData.variants.filter(v => {
        const title = v.public_title.toLowerCase();
        const spokeMatch = v.public_title.includes(spokeNum);
        if (isFrontRule) return spokeMatch && title.includes('front');
        return spokeMatch && (title.includes('rear') || title.includes('xd') || title.includes('hg') || title.includes('ms'));
      });

      if (candidates.length > 0) {
        const highestPriceVariant = candidates.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        const vendorPrice = highestPriceVariant.price / 100;
        const goalPrice = (vendorPrice * (rule.price_adjustment_factor || 1.0)).toFixed(2);

        const sResponse = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const sData = await sResponse.json();
        const myCurrentPrice = parseFloat(sData.variant.price).toFixed(2);

        const itemResult = { 
          title: rule.title, 
          vendor: vendorPrice, 
          mine: myCurrentPrice, 
          goal: goalPrice,
          matched_on: highestPriceVariant.public_title 
        };

        if (goalPrice !== myCurrentPrice) {
          if (rule.auto_update === true) {
            // EXECUTE UPDATE
            await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/variants/${rule.shopify_variant_id}.json`, {
              method: 'PUT',
              headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
              body: JSON.stringify({ variant: { id: rule.shopify_variant_id, price: goalPrice } })
            });
            updated.push(itemResult);
          } else {
            attention.push(itemResult);
          }
        } else {
          inSync.push(itemResult);
        }

        // Update Supabase memory
        await supabase.from('watcher_rules').update({ 
          last_price: Math.round(vendorPrice * 100), 
          last_run_at: new Date() 
        }).eq('id', rule.id);
      }
    }

    // ONLY SEND EMAIL IF THERE ARE UPDATES OR MISMATCHES
    if (updated.length > 0 || attention.length > 0) {
      const updatedHtml = updated.map(i => `<li style="color:green;">✅ <b>UPDATED:</b> ${i.title} - Now $${i.goal}</li>`).join('');
      const attentionHtml = attention.map(i => `<li style="color:red;">⚠️ <b>MISMATCH:</b> ${i.title} - Vendor: $${i.vendor} | Mine: $${i.mine}</li>`).join('');
      const syncHtml = inSync.map(i => `<li style="color:gray;">Verified: ${i.title} ($${i.mine})</li>`).join('');

      await resend.emails.send({
        from: 'Watcher <system@loamlabsusa.com>',
        to: process.env.REPORT_EMAIL,
        subject: `Vendor Price Report: ${updated.length} Update(s), ${attention.length} Mismatch(es)`,
        html: `
          <div style="font-family:sans-serif;">
            <h2>LoamLabs Vendor Watcher Report</h2>
            ${updated.length > 0 ? `<h3>🚀 Automated Updates</h3><ul>${updatedHtml}</ul>` : ''}
            ${attention.length > 0 ? `<h3>⚠️ Manual Attention Required</h3><ul>${attentionHtml}</ul>` : ''}
            <hr>
            <h3>✅ Items In Sync</h3>
            <ul>${syncHtml}</ul>
          </div>
        `
      });
    }

    res.status(200).json({ updated, attention, inSync });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
