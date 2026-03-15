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
  if (!response.ok) {
    throw new Error(`Shopify Auth Failed: ${response.status}`);
  }
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  const { query } = req.query;

  try {
    const adminToken = await getShopifyToken();
    
    // If query is empty, we don't send a search filter, which returns all products.
    const searchTerm = query ? `title:*${query}*` : "";

    const response = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($q: String) {
          products(first: 250, query: $q) {
            edges {
              node {
                id
                title
                vendor
                variants(first: 50) {
                  edges {
                    node {
                      id
                      title
                      price
                    }
                  }
                }
              }
            }
          }
        }`,
        variables: { q: searchTerm }
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: data.errors[0].message });
    }

    // Return the edges directly as the app expects
    res.status(200).json(data.data.products.edges);
    
  } catch (err) {
    console.error("Discovery Engine Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
