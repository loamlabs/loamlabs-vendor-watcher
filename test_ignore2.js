require('dotenv').config({ path: '.env.local' });

async function testGraphQL() {
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  
  if (!adminToken) {
    console.error("Missing SHOPIFY_ADMIN_TOKEN in .env.local");
    return;
  }

  const pid = 9783066722611;
  const productGid = `gid://shopify/Product/${pid}`;

  console.log("Fetching...", productGid);
  const currentRes = await fetch(`https://${shopName}.myshopify.com/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($id: ID!) { product(id: $id) { tags } }`,
      variables: { id: productGid }
    })
  });
  
  const currentData = await currentRes.json();
  let tags = currentData.data?.product?.tags || [];
  console.log("Current tags array:", tags);
  
  if (!tags.includes('watcher-ignore')) {
    // Try passing tags string instead of array
    const tagsString = [...tags, 'watcher-ignore'].join(', ');
    console.log("Attempting string mutation:", tagsString);
    
    const updateRes = await fetch(`https://${shopName}.myshopify.com/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation productUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id tags } userErrors { field message } } }`,
        variables: { input: { id: productGid, tags: tagsString } }
      })
    });
    
    const updateData = await updateRes.json();
    console.log("Update response:", JSON.stringify(updateData));
  } else {
    console.log("Already tagged.");
  }
}

testGraphQL();
