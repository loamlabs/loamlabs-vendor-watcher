import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCcw, Power, Search, Package, LayoutDashboard, ShieldCheck, UserCheck, Plus, X, Loader2 } from 'lucide-react';

export default function OpsDashboard() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [rules, setRules] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

    if (res.ok) { setShowAddModal(false); fetchRules(); }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full text-center">
          <img src="/logo.png" alt="LoamLabs" className="h-16 mx-auto mb-6 object-contain" />
          <p className="text-zinc-500 mb-8 uppercase text-xs tracking-[0.3em] font-black">Ops Command Center</p>
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
            <input type="password" placeholder="ACCESS KEY" className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-2xl mb-4 text-center text-xl tracking-widest outline-none focus:border-white transition-all" onKeyDown={(e) => e.key === 'Enter' && fetchRules()} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={fetchRules} className="w-full bg-white text-black font-black p-4 rounded-2xl uppercase tracking-tighter hover:bg-zinc-200 transition-all">Initialize Session</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-zinc-400 p-6 hidden md:flex flex-col border-r border-zinc-800">
        <div className="mb-12">
          <img src="/logo.png" alt="LoamLabs" className="h-8 mb-2 object-contain invert" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">v1.2 Production</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <SidebarLink icon={<Package size={18}/>} label="Vendor Watcher" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
          <SidebarLink icon={<ShieldCheck size={18}/>} label="Shop Health" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          <SidebarLink icon={<UserCheck size={18}/>} label="Competitor Intel" active={activeTab === 'competitors'} onClick={() => setActiveTab('competitors')} />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-grow p-6 md:p-12 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vendor Registry</h1>
            <p className="text-zinc-500 font-medium">Monitoring boutique component margins and stock.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-black text-white p-3 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"><Plus size={18} /> Add Component</button>
            <button onClick={fetchRules} className="bg-white border-2 border-zinc-200 p-3 px-4 rounded-xl hover:border-black transition-all shadow-sm"><RefreshCcw size={18} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 border-b text-[10px] uppercase font-black text-zinc-500 tracking-widest">
              <tr>
                <th className="p-6">Registry Item</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6">Price Memory</th>
                <th className="p-6 text-right">Auto-Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rules.map((rule) => (
                <tr key={rule.id} className={`${rule.needs_review ? 'bg-red-50' : 'hover:bg-zinc-50'} transition-colors`}>
                  <td className="p-6">
                    <div className="font-bold text-zinc-900 leading-tight text-base">{rule.title}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1 truncate max-w-sm">{rule.vendor_url}</div>
                  </td>
                  <td className="p-6 text-center">
                    {rule.needs_review ? (
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">REVIEW REQ</span>
                    ) : rule.last_availability ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Active</span>
                    ) : (
                      <span className="bg-zinc-200 text-zinc-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">OOS</span>
                    )}
                  </td>
                  <td className="p-6 font-mono font-bold text-lg text-zinc-700">
                    ${(rule.last_price / 100).toFixed(2)}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end">
                      <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${rule.auto_update ? 'bg-black justify-end' : 'bg-zinc-300 justify-start'}`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8 border-b flex justify-between items-center bg-zinc-50">
                <h3 className="text-2xl font-black tracking-tighter italic">ADD TO REGISTRY</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-10 space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-3 block tracking-widest">Step 1: Search LoamLabs Catalog</label>
                  <div className="flex gap-3">
                    <input type="text" placeholder="e.g. Berd Talon" className="flex-grow p-5 bg-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchShopify()} />
                    <button onClick={searchShopify} className="bg-zinc-950 text-white p-5 rounded-2xl hover:bg-black transition-colors"><Search size={24}/></button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-auto border-2 border-zinc-100 rounded-2xl divide-y">
                    {searchResults.map(({ node: p }) => (
                      <button key={p.id} onClick={() => { setSelectedProduct(p); setSelectedVariants([]); }} className={`w-full text-left p-4 hover:bg-zinc-50 flex justify-between items-center transition-colors ${selectedProduct?.id === p.id ? 'bg-zinc-100' : ''}`}>
                        <span className="font-bold">{p.title}</span>
                        <span className="text-[10px] font-black bg-zinc-200 px-2 py-1 rounded text-zinc-500 uppercase">{p.variants.edges.length} VARIANTS</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="bg-zinc-50 p-8 rounded-[1.5rem] border-2 border-zinc-100">
                    <label className="text-[10px] font-black uppercase text-zinc-400 mb-4 block tracking-widest text-center">Step 2: Select Spoke Counts</label>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedProduct.variants.edges.map(({ node: v }) => (
                        <button key={v.id} onClick={() => {
                          const exists = selectedVariants.find(sv => sv.id === v.id);
                          if (exists) setSelectedVariants(selectedVariants.filter(sv => sv.id !== v.id));
                          else setSelectedVariants([...selectedVariants, v]);
                        }} className={`p-3 rounded-xl border-2 text-xs font-black transition-all ${selectedVariants.find(sv => sv.id === v.id) ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'}`}>
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-3 block tracking-widest">Step 3: Vendor Metadata</label>
                  <input type="text" placeholder="Vendor URL" className="w-full p-5 bg-zinc-100 rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-black transition-all" value={vendorUrl} onChange={(e) => setVendorUrl(e.target.value)} />
                  <input type="text" placeholder="Freehub Keyword (Optional, e.g. XD)" className="w-full p-5 bg-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all" value={freehubKeyword} onChange={(e) => setFreehubKeyword(e.target.value)} />
                </div>

                <button 
                  onClick={handleSave} 
                  disabled={!selectedVariants.length || !vendorUrl}
                  className="w-full bg-black text-white font-black p-6 rounded-[1.5rem] hover:bg-zinc-800 disabled:opacity-10 transition-all uppercase tracking-widest shadow-2xl text-lg"
                >
                  Confirm Registry Rules
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-tight ${active ? 'bg-white text-black shadow-xl scale-[1.03]' : 'hover:bg-zinc-900 text-zinc-600'}`}>{icon} {label}</button>
  );
}
