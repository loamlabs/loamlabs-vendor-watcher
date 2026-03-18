require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testIgnore() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
  
  const pid = 9783066722611; // One of the items in their JSON
  const productGid = `gid://shopify/Product/${pid}`;
  
  console.log("Fetching tags for:", productGid);
  const currentRes = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($id: ID!) { product(id: $id) { tags } }`,
      variables: { id: productGid }
    })
  });
  const currentData = await currentRes.json();
  console.log('Current tags:', JSON.stringify(currentData));
  
  let tags = currentData.data?.product?.tags || [];
  if (!tags.includes('watcher-ignore')) {
    tags.push('watcher-ignore');
    console.log("Updating tags to:", tags);
    
    const updateRes = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation productUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id tags } userErrors { field message } } }`,
        variables: { input: { id: productGid, tags: tags } }
      })
    });
    
    const updateData = await updateRes.json();
    console.log("Update response:", JSON.stringify(updateData));
  } else {
    console.log("Already ignored");
  }

  // test delete
  console.log("Attempting delete locally");
  const { data: d, error: e } = await supabase.from('watcher_rules').select('id, shopify_product_id').eq('shopify_product_id', pid);
  console.log("Rows matching pid:", d.length);
}

testIgnore();
