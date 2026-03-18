const axios = require('axios');

const products = [
  "Grappler Flux DH Alloy Rim",
  "Grappler Flux DH Carbon Rim",
  "Grappler Flux EN Alloy Rim",
  "Grappler Flux EN Carbon Rim",
  "Grappler Flux GR Alloy Rim",
  "Grappler Flux GR Carbon Rim",
  "Grappler Race E*Spec Enduro Carbon Rim",
  "Grappler Race Enduro Carbon Rim",
  "Optimus Race Trail Carbon Rim",
  "Piedmont Race Gravel Carbon Rim",
  "Sidekick Boost Front Hub",
  "Sidekick Front Hub",
  "Sidekick Rear Hub",
  "Sidekick SL Front Hub",
  "Sidekick Superboost Rear Hub",
  "Sylvan Race All Mountain Carbon Rim"
];

async function findUrls() {
  try {
    const res = await axios.get('https://www.ethirteen.com/products.json?limit=250');
    const allProducts = res.data.products;
    
    console.log(`Found ${allProducts.length} products on e*thirteen site.\n`);
    
    for (const pName of products) {
      // Create a search-friendly tokenized version
      const searchTokens = pName.toLowerCase().replace(/\\*/g, '').split(' ').filter(p => !['rim', 'hub', 'front', 'rear', 'boost'].includes(p));
      
      const potentialMatches = allProducts.filter(siteProd => {
        const siteTitle = siteProd.title.toLowerCase().replace(/\\*/g, '');
        return searchTokens.every(token => siteTitle.includes(token));
      });
      
      if (potentialMatches.length > 0) {
        console.log(`✅ MATCH: "${pName}" -> https://www.ethirteen.com/products/${potentialMatches[0].handle}`);
      } else {
        console.log(`❌ NO MATCH: "${pName}"`);
      }
    }
  } catch (err) {
    console.error("Error fetching products:", err.message);
  }
}

findUrls();
