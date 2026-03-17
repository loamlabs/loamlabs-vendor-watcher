export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  if (req.headers['x-dashboard-auth'] !== process.env.DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const adminToken = await getShopifyToken();
    let hasNextPage = true;
    let cursor = null;
    let importedTotal = 0;

    console.log("--- STARTING SMART VARIANT IMPORT ---");

    while (hasNextPage) {
      const response = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($after: String) { 
            products(first: 250, after: $after) { 
              pageInfo { hasNextPage } 
              edges { 
                cursor 
                node { 
                  id title vendor tags 
                  variants(first: 50) { 
                    edges { 
                      node { 
                        id 
                        title 
                        selectedOptions { name value } 
                      } 
                    } 
                  } 
                } 
              } 
            } 
          }`,
          variables: { after: cursor }
        })
      });

      const data = await response.json();
      const products = data.data?.products?.edges || [];
      if (products.length === 0) break;

      const filtered = products.filter(edge => {
        const tags = (edge.node.tags || []).map(t => t.toLowerCase());
        return !tags.some(tag => EXCLUDED_TAGS.includes(tag));
      });

      if (filtered.length > 0) {
        let variantBatch = [];

        for (const p of filtered) {
          for (const v of p.node.variants.edges) {
            
            // AUTOMATIC OPTION MAPPING
            // Converts [{name: "Spoke Count", value: "28h"}] into {"Spoke Count": "28h"}
            const mappedOptions = {};
            v.node.selectedOptions.forEach(opt => {
              mappedOptions[opt.name] = opt.value;
            });

            variantBatch.push({
              shopify_product_id: p.node.id.split('/').pop(),
              shopify_variant_id: v.node.id.split('/').pop(),
              title: `${p.node.title} - ${v.node.title}`,
              vendor_name: p.node.vendor,
              auto_update: false,
              site_type: 'SHOPIFY',
              option_values: mappedOptions, // <-- Now fully populated
              price_adjustment_factor: 1.1111 
            });
          }
        }

        // Sync to Supabase
        const { error: upsertError } = await supabase.from('watcher_rules').upsert(variantBatch, { onConflict: 'shopify_variant_id' });
        if (upsertError) throw upsertError;
        
        importedTotal += variantBatch.length;
        console.log(`Processed batch. Registry now has ${importedTotal} variants.`);
      }
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      if (hasNextPage) cursor = products[products.length - 1].cursor;
    }

    res.status(200).json({ success: true, count: importedTotal });
  } catch (err) {
    console.error("Import Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
