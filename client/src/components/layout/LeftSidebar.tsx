import React from 'react';
import { CATEGORIES } from '../../constants';

interface LeftSidebarProps {
  activeCategory: string | null;
  handleCategoryChange: (c: string | null) => void;
  setShowModal: (show: boolean) => void;
}

export function LeftSidebar({ activeCategory, handleCategoryChange, setShowModal }: LeftSidebarProps) {
  return (
    <aside className="hidden md:block md:col-span-3 lg:col-span-2 space-y-8 sticky top-28 h-fit">
      <nav className="space-y-1">
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all ${!activeCategory ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-low'}`} onClick={() => handleCategoryChange(null)}>
          <span className="material-symbols-outlined text-lg">home</span>
          Home Feed
        </button>
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all text-on-surface-variant hover:bg-surface-container-low`} onClick={() => window.location.href='/moderation'}>
          <span className="material-symbols-outlined text-lg">shield</span>
          Moderation Hub
        </button>
      </nav>

      <div>
        <h5 className="font-label text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em] mb-4 px-4">Subpanchayats</h5>
        <nav className="space-y-1">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </nav>
      </div>
      
      <button onClick={() => setShowModal(true)} className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4">
        <span className="material-symbols-outlined text-sm">edit_square</span>
        Propose Policy
      </button>
    </aside>
  );
}
