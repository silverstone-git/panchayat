import React from 'react';

export function SubpanchayatsDirectoryPage() {
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
          {/* Featured Card */}
          <div className="md:col-span-2 bg-surface-container-lowest border border-surface-container rounded-3xl p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-12">
                <div className="bg-secondary-container p-4 rounded-2xl">
                  <span className="material-symbols-outlined text-on-secondary-container text-4xl">forest</span>
                </div>
                <span className="bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-label uppercase tracking-widest font-bold">Priority focus</span>
              </div>
              <h3 className="text-3xl font-headline font-bold text-primary mb-4">Environment & Ecology</h3>
              <p className="text-on-surface-variant text-lg max-w-md mb-8">
                Advocating for sustainable urban canopies and river rejuvenation projects in the district.
              </p>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary">12.4k</span>
                <span className="text-[10px] uppercase font-label tracking-tighter text-outline">Active Citizens</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/30"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-tertiary">342</span>
                <span className="text-[10px] uppercase font-label tracking-tighter text-outline">Live Proposals</span>
              </div>
              <button className="ml-auto bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                Enter Circle <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Secondary Card */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl p-8 flex flex-col justify-between shadow-sm group hover:shadow-md transition-all">
            <div>
              <div className="bg-tertiary-fixed p-3 rounded-xl w-fit mb-6">
                <span className="material-symbols-outlined text-tertiary text-2xl">architecture</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-primary mb-3">Urban Planning</h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Redesigning public transit corridors and zoning laws for tomorrow's density.</p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="font-label font-bold text-xs uppercase tracking-wider text-outline">Top Priority</span>
                <span className="font-headline font-black text-lg text-primary">Transit Route B</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div className="bg-tertiary h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
