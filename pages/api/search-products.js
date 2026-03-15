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
  if (!response.ok) throw new Error(`Auth Failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  const { query } = req.query;

  try {
    const adminToken = await getShopifyToken();
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    // --- RECURSIVE PAGINATION LOOP ---
    // This keeps running until every product in the shop has been scanned
    while (hasNextPage) {
      const response = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($q: String, $after: String) {
            products(first: 250, query: $q, after: $after) {
              pageInfo { hasNextPage }
              edges {
                cursor
                node {
                  id
                  title
                  vendor
                  variants(first: 1) {
                    edges {
                      node {
                        id
                        price
                      }
                    }
                  }
                }
              }
            }
          }`,
          variables: { 
            // Fix: If no query, we pass null to return everything
            q: query ? `title:*${query}*` : null, 
            after: cursor 
          }
        })
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);

      const pageProducts = data.data.products.edges;
      allProducts = [...allProducts, ...pageProducts];
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      if (hasNextPage) {
        cursor = pageProducts[pageProducts.length - 1].cursor;
      }
    }

    console.log(`Success: Scanned ${allProducts.length} products.`);
    res.status(200).json(allProducts);

  } catch (err) {
    console.error("Discovery Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
