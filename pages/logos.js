import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Save, ArrowLeft, Loader2, Link2 } from 'lucide-react';
import Link from 'next/link';

export default function LogoManager() {
  const [data, setData] = useState({ vendors: [], savedLogos: [] });
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLogos = async (authPass) => {
    setLoading(true);
    const passToUse = authPass || password;
    const res = await fetch('/api/get-logos', { headers: { 'x-dashboard-auth': passToUse } });
    if (res.ok) {
      setData(await res.json());
      setIsAuthorized(true);
      if (!authPass) setPassword(passToUse);
    } else if (!authPass) {
      alert("Unauthorized");
    }
    setLoading(false);
  };

  const updateLogo = async (vendorName, url) => {
    await fetch('/api/update-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dashboard-auth': password },
      body: JSON.stringify({ name: vendorName, logo_url: url })
    });
    fetchLogos(password);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans text-center">
        <div className="max-w-sm w-full">
           <h1 className="text-2xl font-black mb-6 uppercase tracking-widest">Branding Auth</h1>
           <input type="password" placeholder="PASSWORD" className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4 text-center text-xl outline-none" onKeyDown={(e) => e.key === 'Enter' && fetchLogos(e.target.value)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
           <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all font-bold uppercase text-xs tracking-widest">
             <ArrowLeft size={16} /> Back to Registry
           </Link>
           <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Branding</h1>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.vendors.map(vendor => {
            const saved = data.savedLogos.find(l => l.name === vendor);
            return (
              <div key={vendor} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100">
                  {saved?.logo_url ? <img src={saved.logo_url} alt={vendor} className="max-w-full max-h-full object-contain p-2" /> : <ImageIcon className="text-zinc-300" size={32} />}
                </div>
                <div className="flex-grow w-full">
                  <h3 className="font-black uppercase text-xs tracking-widest text-zinc-400 mb-2">{vendor}</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste Shopify Logo URL..." 
                      className="flex-grow p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-mono outline-none focus:border-black transition-all"
                      defaultValue={saved?.logo_url || ''}
                      onBlur={(e) => updateLogo(vendor, e.target.value)}
                    />
                    <div className="bg-zinc-100 p-4 rounded-xl text-zinc-400"><Link2 size={20}/></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
