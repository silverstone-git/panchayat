import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Comments } from '../comments/Comments';

interface IdeaCardProps {
  item: any;
  userVotes: Record<string, number>;
  vote: (id: string, dir: number) => void;
  expandedIdea: string | null;
  setExpandedIdea: (id: string | null) => void;
  token: string | null;
}

export function IdeaCard({ item, userVotes, vote, expandedIdea, setExpandedIdea, token }: IdeaCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-0 flex flex-row group hover:shadow-xl transition-all duration-300 border border-surface-container overflow-hidden cursor-pointer" onClick={() => navigate(`/idea/${item.id}`)}>
      {/* Vote Sidebar */}
      <div className="bg-surface-container-low w-14 flex flex-col items-center py-4 border-r border-surface-container" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 hover:text-secondary-color transition-colors" onClick={() => vote(item.id, 1)}>
          <span className="material-symbols-outlined text-xl" style={{ color: userVotes[item.id] === 1 ? 'var(--secondary-color)' : '' }}>expand_less</span>
        </button>
        <span className="font-headline font-black text-primary my-1" style={{ color: userVotes[item.id] === 1 ? 'var(--secondary-color)' : userVotes[item.id] === -1 ? '#7193ff' : '' }}>{item.vote_count}</span>
        <button className="p-1 hover:text-blue-500 transition-colors" onClick={() => vote(item.id, -1)}>
          <span className="material-symbols-outlined text-xl" style={{ color: userVotes[item.id] === -1 ? '#7193ff' : '' }}>expand_more</span>
        </button>
      </div>
      
      {/* Main Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Avatar size={20} url={item.author_avatar} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary font-label">p/{item.category}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-on-surface-variant">Posted by u/{item.author_name || item.author_id}</span>
          </div>
          
          {/* Stubbed Expert Review Tag */}
          {item.vote_count > 10 && (
            <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest font-label ml-2 shrink-0">Under Expert Review</span>
          )}
        </div>
        
        <h4 className="text-xl font-bold font-headline text-on-surface group-hover:text-primary transition-colors mb-2 leading-snug">{item.title}</h4>
        <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-4 line-clamp-3">{item.description}</p>
        
        <div className="flex items-center gap-6 mt-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary/60 group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">forum</span>
            {item.comment_count || 0} Discussion
          </div>
          {/* Stubbed Share Button */}
          <button 
            className="flex items-center gap-1.5 text-xs font-bold text-primary/60 hover:text-primary transition-colors" 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (navigator.share) {
                    navigator.share({
                        title: item.title,
                        text: item.description,
                        url: `${window.location.origin}/idea/${item.id}`
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(`${window.location.origin}/idea/${item.id}`);
                    alert('Link copied to clipboard!');
                }
            }}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share
          </button>
        </div>
        
        {/* We removed inline comments to send them to the dedicated IdeaDiscussionPage */}
      </div>
    </div>
  );
}
