const axios = require('axios');

const normalize = (t) => String(t || "").toLowerCase().replace(/×/g, 'x').replace(/\\s+/g, ' ').trim();
const cleanNum = (str) => str ? str.toString().replace(/\D/g, '') : '';

async function testMatch(rule) {
  try {
    const vResponse = await axios.get(`${rule.vendor_url}.js`);
    const vData = vResponse.data;
    
    let parsedOptions = rule.option_values;
    if (typeof parsedOptions === 'string') {
        try { parsedOptions = JSON.parse(parsedOptions); } catch (e) {}
    }
    
    console.log(`\\nTesting: ${rule.title}`);

    let candidates = vData.variants.filter(v => {
      const vTitle = normalize(v.public_title);
      const ruleTitle = normalize(rule.title);
      const isHub = ruleTitle.includes('hub');
      const isRim = ruleTitle.includes('rim');

      if (isRim) {
          let expectedSize = parsedOptions["Size"] ? parsedOptions["Size"].toLowerCase() : null;
          if (expectedSize) {
              if (expectedSize.includes('700c') && !vTitle.includes('700c')) {
                   expectedSize = '29';
              }
              // Clean quotes and spaces
              const cleanExpected = expectedSize.replace(/["'\\\\ ]/g, '');
              const cleanVTitle = vTitle.replace(/["' ]/g, '');
              
              // Only keep numbers, standard decimal, and 'c'
              const sizeString = cleanExpected.replace(/[^\d.c]/g, ''); 
              const vTitleSize = cleanVTitle.replace(/[^\d.c]/g, '');

              if (!cleanVTitle.includes(sizeString)) {
                  return false;
              }
          }

          const spokeCount = parsedOptions["Spoke Count"] ? parsedOptions["Spoke Count"].toLowerCase() : null;
          if (spokeCount && !vTitle.includes(spokeCount)) return false;

          // Only require DH/EN/GR if the vendor actually specifies it in the variant title
          const ruleTokens = ruleTitle.split(' ');
          const vTokens = vTitle.replace(/[^a-z0-9\\s]/g, ' ').split(/\\s+/);
          
          if (ruleTokens.includes('dh') && !vTokens.includes('dh') && (vTokens.includes('en') || vTokens.includes('gr'))) return false;
          if (ruleTokens.includes('en') && !vTokens.includes('en') && (vTokens.includes('dh') || vTokens.includes('gr'))) return false;
          if (ruleTokens.includes('gr') && !vTokens.includes('gr') && (vTokens.includes('dh') || vTokens.includes('en'))) return false;
       }

       if (isHub) {
          const isFrontRule = ruleTitle.includes('front');
          if (isFrontRule && !vTitle.includes('front') && !vTitle.includes('15x') && !vTitle.includes('15mm') && !vTitle.includes('110x')) { console.log(`[H1] Front fail: ${vTitle}`); return false; }
          
          if (!isFrontRule && !vTitle.includes('rear') && !vTitle.includes('148') && !vTitle.includes('157')) { console.log(`[H2] Rear fail: ${vTitle}`); return false; }

          let expectedHoles = null;
          if (parsedOptions["Spoke Count"]) {
             expectedHoles = cleanNum(parsedOptions["Spoke Count"]);
          } else if (ruleTitle.includes('28h')) expectedHoles = '28';
          else if (ruleTitle.includes('32h')) expectedHoles = '32';

          if (expectedHoles && !vTitle.includes(`${expectedHoles} hole`) && !vTitle.includes(`${expectedHoles}h`) && !vTitle.includes(`${expectedHoles} h`)) {
              console.log(`[H3] Holes fail: ${vTitle}`); 
              return false;
          }

          if (ruleTitle.includes('superboost') && !vTitle.includes('157')) { console.log(`[H4] Superboost fail: ${vTitle}`); return false; }
          if (!ruleTitle.includes('superboost') && ruleTitle.includes('rear') && !vTitle.includes('148')) { console.log(`[H5] Non-Superboost fail: ${vTitle}`); return false; }
          
          if (!ruleTitle.includes('7spd') && !ruleTitle.includes('7 spd') && (vTitle.includes('7spd') || vTitle.includes('7 spd'))) { console.log(`[H6] 7Spd fail: ${vTitle}`); return false; }
          if (!ruleTitle.includes('mini') && vTitle.includes('mini')) { console.log(`[H7] Mini fail: ${vTitle}`); return false; }
       }
       
       console.log(`MATCHED: ${vTitle}`);

      return true;
    });

    if (candidates.length > 0) {
      const winner = candidates[0];
      console.log(`✅ MATCH: ${winner.public_title}`);
    } else {
      console.log(`❌ FAILED. Options: ${vData.variants.map(v=>v.public_title).join(' | ')}`);
    }
  } catch (err) {
    console.error(`Error on ${rule.title}:`, err.message);
  }
}

const failingRules = [
  { title: "e*thirteen Grappler Flux DH Alloy Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux DH Alloy Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Grappler Flux DH Carbon Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux DH Carbon Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Grappler Flux EN Alloy Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux EN Alloy Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Grappler Flux EN Carbon Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux EN Carbon Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "29\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Grappler Flux GR Alloy Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "27.5\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux GR Alloy Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-aluminum-rims", option_values: {"Size": "27.5\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Grappler Flux GR Carbon Rim (28h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "27.5\\\"", "Color": "Black", "Spoke Count": "28h"} },
  { title: "e*thirteen Grappler Flux GR Carbon Rim (32h)", vendor_url: "https://www.ethirteen.com/products/grappler-flux-carbon-rims", option_values: {"Size": "27.5\\\"", "Color": "Black", "Spoke Count": "32h"} },
  { title: "e*thirteen Piedmont Race Gravel Carbon Rim (24h)", vendor_url: "https://www.ethirteen.com/products/piedmont-race-carbon-gravel-rim", option_values: {"Size": "700c", "Color": "Black", "Spoke Count": "24h"} },
  { title: "e*thirteen Sidekick Rear Hub - 6-Bolt - 12x148mm (32h)", vendor_url: "https://www.ethirteen.com/products/sidekick-hubs", option_values: {"Color": "Black", "Spoke Count": "32h"} }
];

async function run() {
    for (const r of failingRules) {
        await testMatch(r);
    }
}
run();
