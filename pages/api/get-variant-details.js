
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
  if (req.headers['x-dashboard-auth']?.trim() !== process.env.DASHBOARD_PASSWORD?.trim()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Expecting POST with { variantIds: [...] }
  const { variantIds } = req.body;
  
  if (!variantIds || !Array.isArray(variantIds)) {
    return res.status(400).json({ error: 'Missing or invalid variantIds array' });
  }

  if (variantIds.length === 0) {
    return res.status(200).json({});
  }

  try {
    const adminToken = await getShopifyToken();
    const shopifyUrl = `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-04/graphql.json`;

    // Map short IDs to Shopify GIDs
    const gids = variantIds.map(id => id.startsWith('gid://') ? id : `gid://shopify/ProductVariant/${id}`);
    
    const query = `
      query($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            title
            sku
            product {
               id
               title
               metafields(first: 50) {
                 edges {
                   node { key namespace value }
                 }
               }
            }
            metafields(first: 50) {
              edges {
                node { key namespace value }
              }
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    `;

    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { ids: gids } })
    });

    const data = await response.json();
    if (data.errors) {
       console.error(`[API] Shopify nodes query returned errors:`, JSON.stringify(data.errors));
       return res.status(500).json({ error: 'Shopify API Error', details: data.errors });
    }

    const nodes = data.data?.nodes || [];
    const variantMap = {};

    nodes.forEach(node => {
       if (!node) return;
       const shortId = node.id.split('/').pop();
       variantMap[shortId] = {
          id: shortId,
          full_id: node.id,
          title: node.title,
          sku: node.sku,
          product: node.product ? {
             id: node.product.id.split('/').pop(),
             title: node.product.title,
             metafields: node.product.metafields?.edges.map(e => e.node) || []
          } : null,
          metafields: node.metafields?.edges.map(e => e.node) || [],
          options: node.selectedOptions?.reduce((acc, opt) => {
             acc[opt.name] = opt.value;
             return acc;
          }, {}) || {}
       };
    });

    return res.status(200).json(variantMap);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
