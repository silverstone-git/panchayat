import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';

export function SubpanchayatsDirectoryPage({ token }: { token: string | null }) {
  const [threadStats, setThreadStats] = useState<Record<string, number>>({});
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const [tRes, uRes] = await Promise.all([
           fetch('/api/v1/threads/feed/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
           fetch('/api/v1/users/stats/categories', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (tRes.ok) setThreadStats(await tRes.json());
        if (uRes.ok) setUserStats(await uRes.json());
      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <main className="pt-24 pb-32 min-h-screen">
      <section className="max-w-7xl mx-auto px-6 mb-12 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-3xl p-8 md:p-16 shadow-lg">
        <div className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary-fixed font-bold mb-4 block">Civic Communities</span>
            <h2 className="text-4xl md:text-6xl font-headline font-black leading-none mb-6">
              The Directory of <br/>Subpanchayats
            </h2>
            <p className="text-primary-fixed-dim max-w-xl text-lg leading-relaxed">
              Join specialized topic-based circles where policy becomes action. Each community is a hub for expert discourse and civic collaboration.
            </p>
          </div>
          <div className="md:col-span-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">search</span>
              </div>
              <input className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-secondary/20 transition-all font-body text-on-surface placeholder:text-outline-variant" placeholder="Search communities..." type="text"/>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, idx) => {
             const isMain = idx === 0;
             const citizenCount = userStats[cat.id] || 0;
             const proposalCount = threadStats[cat.id] || 0;

             return (
                <div key={cat.id} className={`${isMain ? 'md:col-span-2' : ''} bg-surface-container-lowest border border-surface-container rounded-3xl p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 shadow-sm`}>
                    <div>
                    <div className="flex justify-between items-start mb-12">
                        <div className="bg-secondary-container p-4 rounded-2xl">
                        <span className="material-symbols-outlined text-on-secondary-container text-4xl">{cat.id === 'environment' ? 'forest' : cat.id === 'infrastructure' ? 'architecture' : 'diversity_3'}</span>
                        </div>
                        {isMain && <span className="bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-label uppercase tracking-widest font-bold">Priority focus</span>}
                    </div>
                    <h3 className={`${isMain ? 'text-3xl' : 'text-xl'} font-headline font-bold text-primary mb-4`}>{cat.name}</h3>
                    <p className="text-on-surface-variant text-lg max-w-md mb-8">
                        Active community discussions regarding {cat.name.toLowerCase()} in your district.
                    </p>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-8">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-primary">{citizenCount}</span>
                            <span className="text-[10px] uppercase font-label tracking-tighter text-outline">Active Citizens</span>
                        </div>
                        <div className="w-px h-8 bg-outline-variant/30"></div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-tertiary">{proposalCount}</span>
                            <span className="text-[10px] uppercase font-label tracking-tighter text-outline">Live Proposals</span>
                        </div>
                        <button className="ml-auto bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                            Enter Circle <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
             );
          })}
        </div>
      </section>
    </main>
  );
}
