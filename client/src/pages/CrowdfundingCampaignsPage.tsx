import React, { useState, useEffect } from 'react';

export function CrowdfundingCampaignsPage({ token }: { token: string | null }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchActive = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/v1/crowdfund/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCampaigns(await res.json());
            }
        } catch (e) {
            console.error("Error fetching campaigns", e);
        } finally {
            setLoading(false);
        }
     };
     fetchActive();
  }, [token]);

  // Use the first campaign as the "Main Featured" one for the layout
  const featured = campaigns.length > 0 ? campaigns[0] : null;
  const others = campaigns.slice(1);

  return (
    <main className="pt-24 pb-32 max-w-7xl mx-auto px-6">
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-end">
        <div className="md:col-span-8">
          <h2 className="text-5xl md:text-7xl font-black font-headline text-primary tracking-tighter leading-none mb-6">
            Collective Action,<br/>Enduring Impact.
          </h2>
          <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed font-body">
            Join peer-led Subpanchayat tasks or fuel NGO initiatives that reshape our local landscape. Every contribution is a brick in our civic foundation.
          </p>
        </div>
        <div className="md:col-span-4 flex flex-col items-start md:items-end gap-4">
          <div className="bg-tertiary-fixed text-on-tertiary-fixed p-6 rounded-xl w-full shadow-sm">
            <div className="font-label text-[11px] uppercase tracking-widest font-semibold mb-2">Live Consensus</div>
            <div className="text-4xl font-black font-headline">1,240</div>
            <div className="text-sm font-medium opacity-80 mt-1">Policies influenced this month</div>
          </div>
        </div>
      </section>

      <section className="mb-20">
        <div className="flex justify-between items-baseline mb-8">
          <h3 className="text-3xl font-bold font-headline text-primary">Active Civic Funds</h3>
          <span className="text-sm font-label font-semibold text-secondary uppercase tracking-widest">Featured Initiatives</span>
        </div>

        {loading ? (
            <div className="text-center py-20 font-bold text-primary">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-low rounded-3xl text-outline italic">No active campaigns at the moment.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Card */}
              {featured && (
                <div className="md:col-span-2 md:row-span-2 bg-surface-container-lowest border border-surface-container rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative shadow-sm">
                   {featured.imageUrl && (
                       <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                            <img alt="" className="w-full h-full object-cover" src={featured.imageUrl}/>
                        </div>
                   )}
                  <div className="relative z-10">
                    <div className="inline-block px-3 py-1 bg-secondary-fixed-dim text-on-secondary-fixed rounded-full font-label text-[10px] font-bold uppercase tracking-wider mb-6">{featured.category}</div>
                    <h4 className="text-4xl font-bold font-headline text-primary mb-4 leading-tight">{featured.title}</h4>
                    <p className="text-on-surface-variant text-lg max-w-md mb-12">{featured.description}</p>
                  </div>
                  <div className="relative z-10 w-full mt-auto">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-sm font-label text-on-surface-variant uppercase tracking-wider font-bold mb-1">Funding Progress</div>
                        <div className="text-2xl font-black text-primary">₹{featured.raisedAmount.toLocaleString()} <span className="text-base font-bold text-outline">/ ₹{featured.goalAmount.toLocaleString()}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-label text-on-surface-variant uppercase tracking-wider font-bold mb-1">Supporters</div>
                        <div className="text-2xl font-black text-primary">{featured.supportersCount}</div>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden mb-8">
                      <div className="h-full bg-gradient-to-r from-primary to-tertiary-container transition-all duration-1000" style={{ width: `${(featured.raisedAmount/featured.goalAmount)*100}%` }}></div>
                    </div>
                    <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-xl transition-all active:scale-[0.98]">
                      Contribute to Project
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary Cards */}
              {others.map(c => (
                <div key={c.id} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 flex flex-col shadow-sm">
                  <div className="aspect-video bg-secondary-container mb-6 rounded-lg overflow-hidden flex items-center justify-center">
                    {c.imageUrl ? (
                        <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.title} />
                    ) : (
                        <span className="material-symbols-outlined text-4xl text-on-secondary-container">volunteer_activism</span>
                    )}
                  </div>
                  <h5 className="font-headline font-bold text-lg text-primary mb-2">{c.title}</h5>
                  <p className="text-sm text-on-surface-variant mb-6 flex-1 line-clamp-3">{c.description}</p>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-tertiary">₹{c.raisedAmount.toLocaleString()} Raised</span>
                    <span className="text-outline">Goal: ₹{c.goalAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3">
                    <div className="bg-tertiary h-1.5 rounded-full" style={{ width: `${(c.raisedAmount/c.goalAmount)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </section>
    </main>
  );
}
