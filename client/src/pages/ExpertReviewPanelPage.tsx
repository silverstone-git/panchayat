import React, { useState, useEffect } from 'react';

export function ExpertReviewPanelPage({ token }: { token: string | null }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch ideas specifically in EXPERT_REVIEW status from the threads feed
      const res = await fetch('/api/v1/threads/feed?status=EXPERT_REVIEW', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProposals(data.items);
      }
    } catch (e) {
      console.error("Error fetching review queue", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [token]);

  const handleReviewAction = async (ideaId: string, action: 'ENDORSE' | 'FLAG') => {
    if (!token) return;
    const notes = prompt(`Enter ${action.toLowerCase()} notes:`);
    if (notes === null) return;

    try {
      const res = await fetch('/api/v1/expert-review/reviews', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ideaId, action, notes })
      });
      if (res.ok) {
        alert("Review submitted successfully.");
        fetchQueue(); // Refresh queue
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to submit review");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-bold uppercase tracking-widest">Priority Queue</span>
          <span className="text-slate-400 text-sm font-bold">{proposals.length} Pending Reviews</span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">Expert Review Panel</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl font-body leading-relaxed">
          As a Subject Matter Expert, your technical validation is required to move community-driven proposals toward final approval.
        </p>
      </header>

      {loading ? (
          <div className="text-center py-20 font-bold text-primary">Loading your review queue...</div>
      ) : proposals.length === 0 ? (
          <div className="bg-surface-container-low p-12 rounded-3xl text-center text-outline italic">
              The review queue is currently empty. Great work!
          </div>
      ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <section className="xl:col-span-8 space-y-8">
              {proposals.map(prop => (
                <div key={prop.id} className="bg-surface-container-lowest border border-surface-container rounded-3xl p-8 shadow-sm transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex gap-2 mb-3">
                        <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">{prop.category}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-headline font-black text-primary tracking-tight">{prop.title}</h2>
                      <p className="text-slate-500 font-label text-xs uppercase tracking-wider font-bold mt-1">Submitted by u/{prop.author_id} • {new Date(prop.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-tertiary font-headline">{prop.vote_count}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Support</div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-6 rounded-2xl mb-8 border border-outline-variant/20">
                    <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-widest font-label">Proposal Abstract</h3>
                    <p className="text-on-surface-variant leading-relaxed text-sm">
                      {prop.description}
                    </p>
                  </div>

                  {/* Review Action Controls */}
                  <div className="border-t border-surface-container pt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleReviewAction(prop.id, 'ENDORSE')} className="bg-primary text-on-primary font-bold font-label text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Endorse Technicals
                      </button>
                      <button onClick={() => handleReviewAction(prop.id, 'FLAG')} className="bg-surface-container-highest text-primary font-bold font-label text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-sm hover:bg-outline-variant transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Flag Concerns
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <aside className="xl:col-span-4 space-y-6">
              <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-3xl shadow-sm sticky top-28">
                <h3 className="font-headline font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">policy</span>
                  Review Mandates
                </h3>
                <ul className="space-y-4 font-body text-sm text-on-surface-variant">
                  <li className="flex gap-3">
                    <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <span>Evaluate purely on technical merit and logistical feasibility. Do not vote based on ideological preference.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <span>If flagging concerns, you must provide a concrete, actionable modification that would resolve the issue.</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
      )}
    </main>
  );
}
