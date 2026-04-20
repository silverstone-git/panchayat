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
     // Stub for crowdfund-service featured campaigns
     // In real world: fetch('/api/v1/crowdfund/campaigns/featured')
     setCampaigns([
        { id: 1, title: 'Local Park Renovation', goal: 100000, raised: 65000, desc: 'Sector 3 Community Park needs your help.' }
     ]);
  }, [token]);

  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-28 h-fit">
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container">
        <h5 className="font-label text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em] mb-6">Civic Identity</h5>
        {profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size={64} url={profile.profile_data?.avatar_url} className="shadow-md border-2 border-surface-container-highest" />
              <div>
                <div className="font-headline font-black text-lg text-primary">u/{profile.username}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Level {profile.level}</span>
                  <span className="text-xs font-semibold text-secondary">{profile.xp} XP</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-surface-container-high">
              <h6 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Personalize Avatar</h6>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map(url => (
                  <div 
                    key={url} 
                    className={`rounded-full overflow-hidden cursor-pointer border-2 transition-transform hover:scale-105 ${profile.profile_data?.avatar_url === url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                    onClick={() => updateAvatar(url)}
                  >
                    <img src={url} alt="avatar option" className="w-full h-full object-cover bg-surface-container-low" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-surface-container-high">
              <button 
                onClick={() => setShowExpertModal(true)} 
                className="w-full py-2.5 rounded-full font-label font-bold text-xs uppercase tracking-widest text-on-primary bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Apply to be an Expert
              </button>
            </div>
          </div>
        )}
      </div>

      {campaigns.map(c => (
          <div key={c.id} className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl shadow-lg text-on-primary relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-9xl">volunteer_activism</span>
            </div>
            <div className="relative z-10">
              <h5 className="font-label text-[10px] font-bold text-primary-fixed-dim uppercase tracking-[0.2em] mb-2">Funded Projects</h5>
              <h4 className="font-headline font-bold text-xl mb-1">{c.title}</h4>
              <p className="text-sm text-primary-fixed-dim mb-4 leading-tight">{c.desc}</p>
              
              <div className="space-y-1 mb-4">
                <div className="w-full bg-primary-fixed/20 rounded-full h-2">
                  <div className="bg-tertiary-fixed-dim h-2 rounded-full transition-all duration-1000" style={{ width: `${(c.raised/c.goal)*100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-primary-fixed-dim">
                  <span>₹{c.raised/1000}k raised</span>
                  <span>Goal: ₹{c.goal/1000}k</span>
                </div>
              </div>
              
              <button className="w-full bg-tertiary-fixed text-on-tertiary-fixed py-2.5 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Contribute Now</button>
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
