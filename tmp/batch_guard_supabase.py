import os
import re

api_dir = r'c:\Users\jerry\Documents\loamlabs llc\loamlabs-ops-dashboard\loamlabs-ops-dashboard\pages\api'
files = [
    'bulk-compare-at.js',
    'bulk-update-metafields.js',
    'bulk-update-tags.js',
    'create-rule.js',
    'delete-rule.js',
    'duplicate-product.js',
    'get-logos.js',
    'get-sync-logs.js',
    'ignore-product.js',
    'import-catalog.js',
    'migrate.js',
    'sync.js',
    'update-logo.js',
    'update-rule.js'
]

guard_logic = """
// Initialize Supabase only if credentials exist
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to check supabase
const checkSupabase = (res) => {
  if (!supabase) {
    res.status(500).json({ 
      error: 'Supabase configuration is missing. Please check the server environment variables.',
      details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is undefined.'
    });
    return false;
  }
  return true;
};
"""

for filename in files:
    path = os.path.join(api_dir, filename)
    if not os.path.exists(path):
        print(f"Skipping {filename} (not found)")
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already guarded
    if 'const supabase =' in content and 'createClient(' in content:
        # Replace the direct initialization with the guard
        pattern = r"const supabase = createClient\(process\.env\.SUPABASE_URL,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\);"
        if re.search(pattern, content):
            new_content = re.sub(pattern, guard_logic, content)
            
            # Now inject checkSupabase(res) at the start of the handler
            handler_pattern = r"(export default async function handler\(req, res\) \{)"
            if re.search(handler_pattern, new_content):
                new_content = re.sub(handler_pattern, r"\1\n  if (!checkSupabase(res)) return;", new_content)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Guarded {filename}")
            else:
                print(f"Could not find handler in {filename}")
        else:
            print(f"Pattern not found in {filename}, skipping or manual check needed.")
    else:
        print(f"Supabase not found in {filename}")
