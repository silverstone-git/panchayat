import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdeaCard } from './IdeaCard';
import { CATEGORIES } from '../../constants';

interface FeedListProps {
  feed: any[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  activeCategory: string | null;
  sortBy: string;
  handleSortChange: (sort: 'new' | 'trending') => void;
  userVotes: Record<string, number>;
  vote: (id: string, dir: number) => void;
  token: string | null;
}

export function FeedList({ feed, loading, hasMore, loadMore, activeCategory, sortBy, handleSortChange, userVotes, vote, token }: FeedListProps) {
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold font-headline text-primary">{activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.name : 'Community Feed'}</h3>
          <p className="text-sm text-slate-500">Curated civic ideas and discussions.</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${sortBy === 'new' ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container-low text-slate-500'}`} onClick={() => handleSortChange('new')}>Latest</button>
          <button className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${sortBy === 'trending' ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container-low text-slate-500'}`} onClick={() => handleSortChange('trending')}>🔥 Top Voted</button>
        </div>
      </div>

      <div className="space-y-6">
        {feed.length === 0 && !loading && <div className="text-center py-12 text-outline font-medium bg-surface-container-lowest rounded-2xl border border-surface-container">No ideas found. Be the first to propose one!</div>}
        
        {feed.map(item => (
          <IdeaCard 
            key={item.id} 
            item={item} 
            userVotes={userVotes} 
            vote={vote} 
            expandedIdea={expandedIdea} 
            setExpandedIdea={setExpandedIdea} 
            token={token} 
          />
        ))}
      </div>

      {hasMore && (
        <button className="w-full py-4 rounded-xl bg-surface-container-low text-primary font-bold hover:bg-surface-container transition-colors mt-4 shadow-sm" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More Policies'}
        </button>
      )}
    </div>
  );
}
