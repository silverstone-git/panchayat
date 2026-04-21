import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/common/Avatar';
import { useUserFeed } from '../hooks/useUserFeed';

export function ImpactResumePage({ profile, token }: { profile: any, token: string | null }) {
  const navigate = useNavigate();
  const { userFeed, loading: loadingFeed } = useUserFeed(token, profile?.id);

  if (!profile) return <div className="pt-32 text-center text-primary font-bold">Please log in to view your impact resume.</div>;

  return (
    <main className="pt-24 pb-32 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Sidebar Navigation */}
      <aside className="hidden md:block md:col-span-3">
        <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col h-auto sticky top-24 shadow-sm border border-surface-container">
          <div className="flex flex-col mb-8 px-2">
            <Avatar size={64} url={profile.profile_data?.avatar_url} className="mb-4" />
            <h3 className="font-headline font-bold text-primary text-lg">{profile.username}</h3>
            <p className="text-sm text-secondary font-bold uppercase tracking-widest mt-1">Level {profile.level}</p>
            <div className="mt-4 py-1.5 px-4 bg-tertiary-container rounded-full inline-block w-max">
              <span className="text-[11px] font-black text-on-tertiary-container uppercase tracking-widest font-label">Impact Score: {profile.xp}</span>
            </div>
          </div>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 text-slate-600 hover:bg-surface-container-low font-bold">
              <span className="material-symbols-outlined">verified</span>
              Expert Reviews
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 text-slate-600 hover:bg-surface-container-low font-bold">
              <span className="material-symbols-outlined">library_books</span>
              Policy Archive
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 bg-primary/10 text-primary font-bold">
              <span className="material-symbols-outlined">military_tech</span>
              Impact Resume
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 text-slate-600 hover:bg-surface-container-low font-bold">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <div className="md:col-span-9">
        {/* Hero Impact Section */}
        <section className="bg-surface-container-lowest rounded-3xl p-8 mb-8 border border-surface-container shadow-sm transition-all duration-300">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-4xl font-headline font-black text-primary mb-4 tracking-tight">The Impact Resume</h2>
              <p className="text-on-surface-variant mb-8 text-lg leading-relaxed font-body">
                A verifiable public ledger of your civic contributions. Every upvote, authored policy, and community review builds your standing in the Panchayat ecosystem.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 shadow-inner">
                  <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-label">Policies Authored</span>
                  </div>
                  <span className="text-3xl font-black text-primary font-headline">{profile.authored_count}</span>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 shadow-inner">
                  <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">how_to_vote</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest font-label">Votes Cast</span>
                  </div>
                  <span className="text-3xl font-black text-tertiary font-headline">{profile.votes_cast_count}</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1 bg-gradient-to-b from-primary to-primary-container rounded-2xl p-6 text-on-primary flex flex-col justify-between relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2 font-label">Current Tier</h4>
                <div className="text-3xl font-black font-headline">Citizen Architect</div>
              </div>
              <div className="relative z-10 mt-12">
                <div className="flex justify-between text-xs mb-2 font-bold font-label opacity-90 uppercase tracking-widest">
                  <span>XP: {profile.xp}</span>
                  <span>Next Tier: { (Math.floor(Math.sqrt(profile.xp / 100)) + 1) ** 2 * 100 }</span>
                </div>
                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(profile.xp % 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Authored Legislation */}
        <section className="bg-surface-container-lowest rounded-3xl p-8 border border-surface-container shadow-sm">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-surface-container">
            <h3 className="text-xl font-bold font-headline text-primary">Authored Legislation</h3>
          </div>

          <div className="space-y-6">
            {loadingFeed ? (
                <p>Loading authored policies...</p>
            ) : userFeed.length === 0 ? (
                <p className="text-outline italic">You haven't proposed any policies yet.</p>
            ) : userFeed.map(idea => (
                <div key={idea.id} className="group border border-transparent hover:border-surface-container-high rounded-xl p-4 -mx-4 transition-all cursor-pointer" onClick={() => navigate(`/idea/${idea.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <span className="bg-secondary-container text-on-secondary-container font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{idea.status}</span>
                            <h4 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors font-headline">{idea.title}</h4>
                        </div>
                        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">{new Date(idea.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                        {idea.description}
                    </p>
                    <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span> {idea.vote_count} Votes
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
