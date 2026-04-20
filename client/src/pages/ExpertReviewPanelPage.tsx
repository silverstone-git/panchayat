import React from 'react';

export function ExpertReviewPanelPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-bold uppercase tracking-widest">Priority Queue</span>
          <span className="text-slate-400 text-sm font-bold">3 Pending Reviews</span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">Expert Review Panel</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl font-body leading-relaxed">
          As a Senior Policy Lead, your technical validation is required to move these community-driven proposals into the legislative draft phase.
        </p>
      </header>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-8 space-y-8">
          {/* Proposal Item */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl p-8 shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="flex gap-2 mb-3">
                  <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">Infrastructure</span>
                  <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">Sustainability</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-black text-primary tracking-tight">Project Green Transit: Sub-City Rail Expansion</h2>
                <p className="text-slate-500 font-label text-xs uppercase tracking-wider font-bold mt-1">Proposal ID: P-2024-0892 • Submitted 14h ago</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-tertiary font-headline">88%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Consensus</div>
              </div>
            </div>

            {/* Consensus Meter */}
            <div className="mb-8">
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-tertiary-container" style={{ width: '88%' }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label">
                <span>Structural Feasibility</span>
                <span>Community Support</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl mb-8 border border-outline-variant/20">
              <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-widest font-label">Abstract</h3>
              <p className="text-on-surface-variant leading-relaxed text-sm">
                A localized proposal to expand the existing mono-rail network by 12km into the eastern suburbs, incorporating green roofs on all new transit stations and utilizing solar-powered ticket kiosks. We project a 15% reduction in commuter vehicle emissions.
              </p>
            </div>

            {/* Review Action Controls */}
            <div className="border-t border-surface-container pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-4">
                <button className="bg-primary text-on-primary font-bold font-label text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Endorse Technicals
                </button>
                <button className="bg-surface-container-highest text-primary font-bold font-label text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-sm hover:bg-outline-variant transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Flag Concerns
                </button>
              </div>
              <span className="text-xs font-bold text-outline uppercase tracking-widest">Expires in 48h</span>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Guidelines */}
        <aside className="xl:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-3xl shadow-sm">
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
    </main>
  );
}
