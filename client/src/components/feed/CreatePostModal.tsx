import React, { useState, FormEvent } from 'react';
import { CATEGORIES } from '../../constants';

interface CreatePostModalProps {
  token: string | null;
  activeCategory: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePostModal({ token, activeCategory, onClose, onSuccess }: CreatePostModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [localCategory, setLocalCategory] = useState(activeCategory || 'general');

  const postIdea = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/v1/threads/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: newTitle, description: newDesc, category: localCategory })
    });
    if (res.ok) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-surface-container-low px-8 py-5 flex justify-between items-center border-b border-outline-variant/30">
          <h3 className="font-headline font-black text-2xl text-primary">Propose a Policy</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={postIdea} className="p-8 space-y-6">
          <div>
            <label className="block font-label text-xs font-bold text-outline-variant uppercase tracking-[0.1em] mb-2">Subpanchayat Category</label>
            <select 
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none font-bold" 
              value={localCategory} 
              onChange={e => setLocalCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block font-label text-xs font-bold text-outline-variant uppercase tracking-[0.1em] mb-2">Policy Title</label>
            <input 
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-headline font-bold text-lg" 
              placeholder="e.g., Decentralized Solar Grid for Old Town" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block font-label text-xs font-bold text-outline-variant uppercase tracking-[0.1em] mb-2">Description & Rationale</label>
            <textarea 
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 h-40 resize-none font-body leading-relaxed" 
              placeholder="Detail the problem, your proposed solution, and the expected community impact..." 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              required 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" className="px-6 py-3 rounded-full font-bold text-outline hover:bg-surface-container transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              Submit Proposal
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
