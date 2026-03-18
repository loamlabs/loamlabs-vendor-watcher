const fs = require('fs');
const envConfig = require('dotenv').parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

async function testGraphQL() {
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  
  const pid = 9783066722611; // One of his products
  const productGid = `gid://shopify/Product/${pid}`;

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
  console.log('Current tags:', tags);
  
  const tagsString = [...tags, 'watcher-ignore'].join(', ');
  console.log('Sending string:', tagsString);
  
  const updateRes = await fetch(`https://${shopName}.myshopify.com/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation productUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id tags } userErrors { field message } } }`,
      variables: { input: { id: productGid, tags: tagsString } }
    })
  });
  
  const updateData = await updateRes.json();
  console.log('Update response:', JSON.stringify(updateData, null, 2));
}

testGraphQL();
