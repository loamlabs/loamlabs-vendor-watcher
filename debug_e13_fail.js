const axios = require('axios');

async function run() {
    try {
        const { data: rules } = await axios.get('http://localhost:3000/api/get-rules', {
             headers: { 'x-dashboard-auth': 'loamlabs2025' }
        });
        
        const rims = rules.filter(r => r.vendor_name === 'e*thirteen' && r.title.includes('Rim'));
        console.log("== RIMS ==");
        rims.forEach(r => console.log(`${r.title} | ${r.vendor_url} | ${r.last_log}`));

        const hubs = rules.filter(r => r.vendor_name === 'e*thirteen' && r.title.includes('Sidekick SL Front'));
        console.log("\\n== HUBS ==");
        hubs.forEach(r => console.log(`${r.title} | ${r.vendor_url} | ${r.last_log}`));
    } catch (e) { console.error(e.message); }
}
run();
run();
