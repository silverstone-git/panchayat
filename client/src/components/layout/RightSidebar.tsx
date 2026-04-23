import React, { useState, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import { AVATAR_OPTIONS } from '../../constants';
import { ExpertApplicationModal } from '../feed/ExpertApplicationModal';

interface RightSidebarProps {
  profile: any;
  updateAvatar: (url: string) => void;
  token: string | null;
}

export function RightSidebar({ profile, updateAvatar, token }: RightSidebarProps) {
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
     const fetchFeatured = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/v1/crowdfund/campaigns/featured', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCampaigns(await res.json());
            }
        } catch (e) {
            console.error("Error fetching featured campaigns", e);
        }
     };
     fetchFeatured();
  }, [token]);

  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-6">
      {profile && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container">
          <h3 className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4">Personalize Avatar</h3>
          <div className="grid grid-cols-3 gap-3">
            {AVATAR_OPTIONS.map((url, idx) => (
              <button 
                key={idx} 
                onClick={() => updateAvatar(url)}
                className={`p-1 rounded-full border-2 transition-colors ${profile.profile_data?.avatar_url === url ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-surface-container-high'}`}
              >
                <img src={url} alt="Avatar option" className="w-10 h-10 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {campaigns.map(c => (
          <div key={c.id} className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl shadow-lg text-on-primary relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-9xl">volunteer_activism</span>
            </div>
            <div className="relative z-10">
              <h5 className="font-label text-[10px] font-bold text-primary-fixed-dim uppercase tracking-[0.2em] mb-2">Funded Projects</h5>
              <h4 className="font-headline font-bold text-xl mb-1">{c.title}</h4>
              <p className="text-sm text-primary-fixed-dim mb-4 leading-tight">{c.description}</p>
              
              <div className="space-y-1 mb-4">
                <div className="w-full bg-primary-fixed/20 rounded-full h-2">
                  <div className="bg-tertiary-fixed-dim h-2 rounded-full transition-all duration-1000" style={{ width: `${(c.raisedAmount/c.goalAmount)*100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-primary-fixed-dim">
                  <span>₹{c.raisedAmount/1000}k raised</span>
                  <span>Goal: ₹{c.goalAmount/1000}k</span>
                </div>
              </div>
              
              <button className="w-full bg-tertiary-fixed text-on-tertiary-container py-2.5 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Contribute Now</button>
            </div>
          </div>
      ))}
      
      {showExpertModal && (
          <ExpertApplicationModal 
            token={token} 
            onClose={() => setShowExpertModal(false)}
            onSuccess={() => setShowExpertModal(false)}
          />
      )}
    </aside>
  );
}
