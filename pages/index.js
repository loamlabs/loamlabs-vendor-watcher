import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCcw, Power, Search, Package, ShieldCheck, UserCheck, Plus, X, Info, Image as ImageIcon, Loader2, LogOut, ChevronUp } from 'lucide-react';

export default function OpsDashboard() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [rules, setRules] = useState([]);
  const [vendorLogos, setVendorLogos] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVendor, setFilterVendor] = useState('All');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [vendorUrl, setVendorUrl] = useState('');
  const [freehubKeyword, setFreehubKeyword] = useState('');

  useEffect(() => {
    const savedPass = localStorage.getItem('loam_ops_auth');
    if (savedPass) { setPassword(savedPass); fetchRules(savedPass); }
  }, []);

  const fetchRules = async (passToUse) => {
    const auth = passToUse || password;
    if (!auth) return;
    setLoading(true);
    const res = await fetch('/api/get-rules', { headers: { 'x-dashboard-auth': auth } });
    if (res.ok) { 
      setRules(await res.json());
      localStorage.setItem('loam_ops_auth', auth);
      const logoRes = await fetch('/api/get-logos', { headers: { 'x-dashboard-auth': auth } });
      const logoData = await logoRes.json();
      setVendorLogos(logoData.savedLogos || []);
      setIsAuthorized(true); 
    } else { 
      localStorage.removeItem('loam_ops_auth');
      if (passToUse) alert("Invalid Session");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('loam_ops_auth');
    window.location.reload();
  };

  const toggleAutoSync = async (id, currentState) => {
    await fetch('/api/update-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dashboard-auth': password },
      body: JSON.stringify({ id, updates: { auto_update: !currentState } })
    });
    fetchRules();
  };

  const searchShopify = async () => {
    const res = await fetch(`/api/search-products?query=${searchQuery}`);
    setSearchResults(await res.json());
  };

  const handleSave = async () => {
    const newRules = selectedVariants.map(variant => ({
      shopify_product_id: selectedProduct.id.split('/').pop(),
      shopify_variant_id: variant.id.split('/').pop(),
      title: `${selectedProduct.title} - ${variant.title}`,
      vendor_name: selectedProduct.vendor,
      vendor_url: vendorUrl,
      site_type: 'SHOPIFY',
      option_values: { "Spoke Count": variant.title, ...(freehubKeyword && { "Freehub": freehubKeyword }) },
      auto_update: false
    }));
    await fetch('/api/create-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dashboard-auth': password },
      body: JSON.stringify({ rules: newRules })
    });
    setShowAddModal(false);
    fetchRules();
  };

  const vendorNames = ['All', ...new Set(rules.map(r => r.vendor_name).filter(Boolean))];
  const filteredRules = filterVendor === 'All' ? rules : rules.filter(r => r.vendor_name === filterVendor);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full text-center">
          <div className="h-20 mb-12 flex justify-center"><img src="/logo.png" alt="LoamLabs" className="h-full object-contain" onError={(e) => e.target.style.display='none'} /></div>
          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            <input type="password" placeholder={loading ? "VERIFYING..." : "ACCESS KEY"} className="w-full bg-zinc-950 border border-zinc-700 p-5 rounded-2xl mb-4 text-center text-xl tracking-widest outline-none focus:border-white transition-all font-mono" onKeyDown={(e) => e.key === 'Enter' && fetchRules()} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => fetchRules()} className="w-full bg-white text-black font-black p-5 rounded-2xl uppercase tracking-tighter hover:scale-[1.02] transition-all">Start Session</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <aside className="w-64 bg-black text-zinc-400 p-6 hidden md:flex flex-col border-r border-zinc-800">
        <div className="mb-12">
          <img src="/logo.png" alt="LoamLabs" className="h-8 mb-4 object-contain invert" />
          <div className="font-black italic text-xl text-white tracking-tighter uppercase">Ops Dashboard</div>
        </div>
        
        <nav className="space-y-1 flex-grow">
          <SidebarLink icon={<Package size={18}/>} label="Vendor Watcher" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
          <SidebarLink icon={<ShieldCheck size={18}/>} label="Shop Health" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          <SidebarLink icon={<ImageIcon size={18}/>} label="Branding" active={false} onClick={() => window.location.href = '/logos'} />
        </nav>

        <div className="relative mt-auto border-t border-zinc-800 pt-6">
           {showUserMenu && (
             <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2">
                <button onClick={handleLogout} className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-500/10 font-bold text-xs uppercase transition-all"><LogOut size={16}/> End Session</button>
             </div>
           )}
           <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 transition-all">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-black text-white text-xs">A</div><span className="text-xs font-bold text-white uppercase">Admin</span></div>
              <ChevronUp size={14} className={showUserMenu ? 'rotate-180' : ''}/>
           </button>
        </div>
      </aside>

      <main className="flex-grow p-6 md:p-12 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 uppercase italic">Registry</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-black text-white p-3 px-6 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all"><Plus size={18} /> Add Component</button>
            <button onClick={() => fetchRules()} className="bg-white border-2 border-zinc-200 p-3 px-4 rounded-xl hover:border-black transition-all shadow-sm"><RefreshCcw size={18} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
          {vendorNames.map(v => {
            const logo = vendorLogos.find(l => l.name === v);
            return (
              <button key={v} onClick={() => setFilterVendor(v)} className={`flex items-center gap-3 px-5 py-2 rounded-full border-2 transition-all whitespace-nowrap ${filterVendor === v ? 'bg-black text-white border-black shadow-lg scale-105 font-black' : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300 font-bold'}`}>
                {logo?.logo_url && <img src={logo.logo_url} className="h-4 w-auto object-contain" />}
                <span className="text-[10px] uppercase tracking-widest">{v}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 border-b text-[10px] uppercase font-black text-zinc-500 tracking-widest"><t
