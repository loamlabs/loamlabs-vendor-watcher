import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCcw, Power, Search, Package, LayoutDashboard, Settings, UserCheck, Plus, X, Loader2 } from 'lucide-react';

export default function OpsDashboard() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [rules, setRules] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [vendorUrl, setVendorUrl] = useState('');
  const [freehubKeyword, setFreehubKeyword] = useState('');

  const fetchRules = async () => {
    setLoading(true);
    const res = await fetch('/api/get-rules', { headers: { 'x-dashboard-auth': password } });
    if (res.ok) { setRules(await res.json()); setIsAuthorized(true); } 
    else { alert("Unauthorized"); }
    setLoading(false);
  };

  const searchShopify = async () => {
    if (!searchQuery) return;
    const res = await fetch(`/api/search-products?query=${searchQuery}`);
    const data = await res.json();
    setSearchResults(data);
  };

  const handleSave = async () => {
    const newRules = selectedVariants.map(variant => ({
      shopify_product_id: selectedProduct.id.split('/').pop(),
      shopify_variant_id: variant.id.split('/').pop(),
      title: `${selectedProduct.title} - ${variant.title}`,
      vendor_url: vendorUrl,
      site_type: 'SHOPIFY',
      option_values: { 
        "Spoke Count": variant.title,
        ...(freehubKeyword && { "Freehub": freehubKeyword })
      },
      auto_update: false
    }));

    const res = await fetch('/api/create-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dashboard-auth': password },
      body: JSON.stringify({ rules: newRules })
    });

    if (res.ok) {
      setShowAddModal(false);
      fetchRules();
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-black italic mb-2 tracking-tighter">LOAMLABS OPS</h1>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
            <input type="password" placeholder="Access Key" className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl mb-4 text-center text-xl" onKeyDown={(e) => e.key === 'Enter' && fetchRules()} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={fetchRules} className="w-full bg-white text-black font-black p-4 rounded-xl uppercase">Initialize</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-zinc-400 p-6 hidden md:flex flex-col border-r border-zinc-800">
        <div className="mb-10 text-white"><h2 className="text-xl font-black italic tracking-tighter text-white">LOAMLABS OPS</h2></div>
        <nav className="space-y-2 flex-grow">
          <SidebarLink icon={<Package size={18}/>} label="Vendor Watcher" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
          <SidebarLink icon={<ShieldAlert size={18}/>} label="Shop Health" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-grow p-6 md:p-12 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vendor Registry</h1>
            <p className="text-zinc-500 font-medium">Protecting boutique component margins.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-black text-white p-3 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"><Plus size={18} /> Add Component</button>
            <button onClick={fetchRules} className="bg-white border-2 border-zinc-200 p-3 px-4 rounded-xl hover:border-black transition-all"><RefreshCcw size={18} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 border-b text-[10px] uppercase font-black text-zinc-500 tracking-widest">
              <tr>
                <th className="p-5">Registry Item</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5">Price Memory</th>
                <th className="p-5">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-zinc-900">{rule.title}</div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate max-w-sm">{rule.vendor_url}</div>
                  </td>
                  <td className="p-5 text-center">
                    {rule.needs_review ? <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full">REVIEW</span> : <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Active</span>}
                  </td>
                  <td className="p-5 font-mono font-bold">${(rule.last_price / 100).toFixed(2)}</td>
                  <td className="p-5"><div className={`w-10 h-5 rounded-full p-1 flex items-center ${rule.auto_update ? 'bg-black justify-end' : 'bg-zinc-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full"></div></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-zinc-50">
                <h3 className="text-xl font-black italic">ADD TO REGISTRY</h3>
                <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-400 mb-2 block tracking-widest">Step 1: Search LoamLabs Catalog</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. Berd Talon" className="flex-grow p-4 bg-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchShopify()} />
                    <button onClick={searchShopify} className="bg-zinc-200 p-4 rounded-xl hover:bg-zinc-300"><Search size={20}/></button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-auto border rounded-xl divide-y">
                    {searchResults.map(({ node: p }) => (
                      <button key={p.id} onClick={() => { setSelectedProduct(p); setSelectedVariants([]); }} className={`w-full text-left p-3 hover:bg-zinc-50 flex justify-between items-center ${selectedProduct?.id === p.id ? 'bg-zinc-100 font-bold' : ''}`}>
                        {p.title} <span className="text-[10px] text-zinc-400">{p.variants.edges.length} variants</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="bg-zinc-50 p-6 rounded-2xl border-2 border-zinc-100">
                    <label className="text-xs font-black uppercase text-zinc-400 mb-3 block">Step 2: Select Spoke Counts</label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.variants.edges.map(({ node: v }) => (
                        <button key={v.id} onClick={() => {
                          const exists = selectedVariants.find(sv => sv.id === v.id);
                          if (exists) setSelectedVariants(selectedVariants.filter(sv => sv.id !== v.id));
                          else setSelectedVariants([...selectedVariants, v]);
                        }} className={`p-2 rounded-lg border text-xs font-bold transition-all ${selectedVariants.find(sv => sv.id === v.id) ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-black uppercase text-zinc-400 mb-2 block tracking-widest">Step 3: Vendor Metadata</label>
                  <input type="text" placeholder="Vendor Product URL (e.g. Berd Spokes URL)" className="w-full p-4 bg-zinc-100 rounded-xl mb-3 outline-none" value={vendorUrl} onChange={(e) => setVendorUrl(e.target.value)} />
                  <input type="text" placeholder="Freehub Keyword (Optional, e.g. XD)" className="w-full p-4 bg-zinc-100 rounded-xl outline-none" value={freehubKeyword} onChange={(e) => setFreehubKeyword(e.target.value)} />
                </div>

                <button 
                  onClick={handleSave} 
                  disabled={!selectedVariants.length || !vendorUrl}
                  className="w-full bg-black text-white font-black p-5 rounded-2xl hover:bg-zinc-800 disabled:opacity-20 transition-all uppercase tracking-widest shadow-xl"
                >
                  Create {selectedVariants.length} Registry Rules
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-white text-black shadow-lg scale-[1.02]' : 'hover:bg-zinc-900 text-zinc-500'}`}>{icon} {label}</button>
  );
}
