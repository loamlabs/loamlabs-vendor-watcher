const fs = require('fs');

const targetProducts = [
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

// Mappings done manually by looking at the e13_products.txt list
const mappedHandles = {
  "Grappler Flux DH Alloy Rim": "grappler-flux-aluminum-rims",
  "Grappler Flux DH Carbon Rim": "grappler-flux-carbon-rims",
  "Grappler Flux EN Alloy Rim": "grappler-flux-aluminum-rims",
  "Grappler Flux EN Carbon Rim": "grappler-flux-carbon-rims",
  "Grappler Flux GR Alloy Rim": "grappler-flux-aluminum-rims",
  "Grappler Flux GR Carbon Rim": "grappler-flux-carbon-rims",
  "Grappler Race E*Spec Enduro Carbon Rim": "grappler-race-carbon-e-spec-enduro-rim",
  "Grappler Race Enduro Carbon Rim": "grappler-race-carbon-enduro-rim",
  "Optimus Race Trail Carbon Rim": "optimus-race-carbon-trail-rim",
  "Piedmont Race Gravel Carbon Rim": "piedmont-race-carbon-gravel-rim",
  "Sidekick Boost Front Hub": "sidekick-front-hub",
  "Sidekick Front Hub": "sidekick-front-hub",
  "Sidekick Rear Hub": "sidekick-hubs", // Note: Rear uses "sidekick-hubs"
  "Sidekick SL Front Hub": "sidekick-front-hub",
  "Sidekick Superboost Rear Hub": "sidekick-hubs",
  "Sylvan Race All Mountain Carbon Rim": "sylvan-race-carbon-all-mountain-rim"
};

let sql = `-- E*THIRTEEN VENDOR URL MAPPING SQL\n\n`;

for (const pName of targetProducts) {
  const handle = mappedHandles[pName];
  if (handle) {
    const fullUrl = `https://www.ethirteen.com/products/${handle}`;
    sql += `UPDATE watcher_rules \nSET vendor_url = '${fullUrl}' \nWHERE title LIKE '%${pName.replace(/'/g, "''")}%' AND vendor_name = 'e*thirteen';\n\n`;
  } else {
    sql += `-- MISSING MAPPING FOR: ${pName}\n\n`;
  }
}

fs.writeFileSync('e13_sql_update.sql', sql);
console.log("SQL script built at e13_sql_update.sql");
