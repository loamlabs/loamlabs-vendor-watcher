-- E*THIRTEEN WHEELSET & COMPONENT VENDOR URL RECOVERY
-- Execute this entirely inside the Supabase SQL Editor!

-- 1. Restore Wheelsets
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-sidekick-flux-carbon-downhill-wheels' WHERE title ILIKE 'Grappler Sidekick Flux Carbon Downhill Wheels%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-sidekick-flux-carbon-enduro-wheels' WHERE title ILIKE 'Grappler Sidekick Flux Carbon Enduro Wheels%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/sylvan-sidekick-race-aluminum-all-mountain-wheels' WHERE (title ILIKE 'Sylvan Sidekick Race Alloy All Mountain Wheels%' OR title ILIKE 'Sylvan Sidekick Race Aluminum All Mountain Wheels%') AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/sylvan-sidekick-race-carbon-all-mountain-wheels' WHERE title ILIKE 'Sylvan Sidekick Race Carbon All Mountain Wheels%' AND vendor_name = 'e*thirteen';

-- Generic automated fallback for any other wheelsets (e.g. Helix, Optimus)
-- This takes the text before the hyphen, lowercases it, and replaces spaces with dashes.
UPDATE watcher_rules 
SET vendor_url = 'https://www.ethirteen.com/products/' || REPLACE(REPLACE(REPLACE(LOWER(TRIM(SPLIT_PART(title, '-', 1))), ' ', '-'), '''', ''), '*', '')
WHERE vendor_name = 'e*thirteen' AND (vendor_url IS NULL OR vendor_url = '') AND title ILIKE '%wheels%';

-- 2. Restore Component Rims
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-flux-aluminum-rims' WHERE (title ILIKE 'Grappler Flux DH Alloy Rim%' OR title ILIKE 'Grappler Flux EN Alloy Rim%' OR title ILIKE 'Grappler Flux GR Alloy Rim%') AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-flux-carbon-rims' WHERE (title ILIKE 'Grappler Flux DH Carbon Rim%' OR title ILIKE 'Grappler Flux EN Carbon Rim%' OR title ILIKE 'Grappler Flux GR Carbon Rim%') AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-race-carbon-e-spec-enduro-rim' WHERE title ILIKE 'Grappler Race E*Spec Enduro Carbon Rim%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/grappler-race-carbon-enduro-rim' WHERE title ILIKE 'Grappler Race Enduro Carbon Rim%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/optimus-race-carbon-trail-rim' WHERE title ILIKE 'Optimus Race Trail Carbon Rim%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/piedmont-race-carbon-gravel-rim' WHERE title ILIKE 'Piedmont Race Gravel Carbon Rim%' AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/sylvan-race-carbon-all-mountain-rim' WHERE title ILIKE 'Sylvan Race All Mountain Carbon Rim%' AND vendor_name = 'e*thirteen';

-- 3. Restore Hubs
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/sidekick-front-hub' WHERE (title ILIKE 'Sidekick Boost Front Hub%' OR title ILIKE 'Sidekick Front Hub%' OR title ILIKE 'Sidekick SL Front Hub%') AND vendor_name = 'e*thirteen';
UPDATE watcher_rules SET vendor_url = 'https://www.ethirteen.com/products/sidekick-hubs' WHERE (title ILIKE 'Sidekick Rear Hub%' OR title ILIKE 'Sidekick Superboost Rear Hub%') AND vendor_name = 'e*thirteen';
