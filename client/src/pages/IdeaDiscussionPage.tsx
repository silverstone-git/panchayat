import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/common/Avatar';
import { Comments } from '../components/comments/Comments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function IdeaDiscussionPage({ token }: { token: string | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'trending-solar-stub') {
      setIdea({
         id: 'trending-solar-stub',
         title: 'Decentralized Solar Grids for Coastal Villages',
         description: 'The proposed policy aims to transition 45 coastal panchayats to 100% renewable energy through community-owned microgrids. By leveraging federal subsidies and localized maintenance squads, we can eliminate carbon footprint while ensuring grid stability during cyclone seasons.',
         category: 'infrastructure',
         author_id: 'civic_leader_01',
         vote_count: 1240,
         comment_count: 24,
         isStub: true
      });
      setLoading(false);
      return;
    }

    const fetchIdea = async () => {
      try {
        const res = await fetch(`/api/v1/threads/ideas/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setIdea(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [id, token]);

  if (loading) return <div className="pt-32 text-center text-primary font-headline text-2xl">Analyzing Proposal...</div>;
  if (!idea) return <div className="pt-32 text-center text-error font-headline text-2xl">Proposal Not Found</div>;

  const totalVotes = (idea.upvote_count || 0) + (idea.downvote_count || 0);
  const agreePercent = totalVotes > 0 ? Math.round(((idea.upvote_count || 0) / totalVotes) * 100) : 0;
  const debatingPercent = 100 - agreePercent;

  return (
    <main className="pt-24 pb-32 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Policy Content (Asymmetric Layout) */}
      <div className="lg:col-span-8">
        <nav className="mb-8 flex items-center text-sm font-label cursor-pointer text-on-surface-variant transition-colors" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-sm mr-2 text-primary">arrow_back</span>
          <span className="hover:text-primary font-bold">Back to Feed</span>
          <span className="mx-3 text-outline">/</span>
          <span className="text-secondary font-bold capitalize">{idea.category}</span>
        </nav>

        
        <article>
          <header className="mb-10">
            <div className="mb-4 flex gap-2">
              <span className="bg-secondary-container text-on-secondary-container font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-secondary-container">Active Legislation</span>
              {idea.vote_count > 10 && <span className="bg-tertiary-container text-on-tertiary-container font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Under Expert Review</span>}
            </div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
              {idea.title}
            </h1>
          </header>

          <div className="flex flex-col gap-8 text-on-surface-variant">
            <section className="max-w-2xl bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container">
              <div className="flex items-center gap-3 mb-6">
                <Avatar size={32} url={idea.author_avatar} />
                <span className="font-label font-bold text-sm text-primary">u/{idea.author_name || idea.author_id}</span>
                <span className="text-outline text-[11px] ml-auto">Posted recently</span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-primary mb-4">Executive Summary</h3>
              <div className="prose prose-slate max-w-none text-lg leading-relaxed mb-6 font-body whitespace-pre-wrap text-on-surface-variant">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {idea.description}
                </ReactMarkdown>
              </div>
            </section>

            <div className="bg-surface-container-low p-8 rounded-xl space-y-6 border border-surface-container">
              <h4 className="font-headline font-bold text-primary flex justify-between">
                Consensus Meter <span className="text-tertiary">{idea.vote_count} Score</span>
              </h4>
              <div className="space-y-2">
                <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-tertiary-container h-full transition-all duration-1000" style={{ width: `${agreePercent}%` }}></div>
                </div>
                <div className="flex justify-between font-label text-[11px] font-bold text-secondary">
                  <span>{agreePercent}% AGREE</span>
                  <span>{debatingPercent}% DEBATING</span>
                </div>
              </div>
              <p className="text-sm font-label italic opacity-80">Based on architectural reviews and {totalVotes} citizen votes.</p>
            </div>
          </div>
        </article>

        {/* Discussion Section */}
        <section className="mt-20 border-t-0">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="font-headline text-3xl font-bold text-primary">Community Discourse</h2>
            </div>
          </div>
          
          {idea.isStub ? (
             <div className="py-12 text-center text-outline bg-surface-container-low rounded-2xl font-medium">Discussion stub for this fake idea. Go to a real idea to test comments!</div>
          ) : (
             <Comments ideaId={idea.id} token={token!} />
          )}
        </section>
      </div>

      {/* Sidebar (Editorial Metadata) */}
      <aside className="lg:col-span-4 space-y-10">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-8 sticky top-28 border border-surface-container">
          <div>
            <h5 className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4">Policy Author</h5>
            <div className="flex items-center gap-4">
              <Avatar size={56} url={idea.author_avatar} className="border-2 border-surface-container-highest" />
              <div>
                <div className="font-headline font-black text-primary text-lg">u/{idea.author_name || idea.author_id}</div>
                <div className="font-label text-[11px] font-bold text-secondary uppercase tracking-widest">Verified Citizen</div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-container">
            <h5 className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4">Timeline</h5>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                  <div className="w-0.5 h-full bg-surface-container-highest mt-2"></div>
                </div>
                <div>
                  <div className="font-bold text-primary text-sm">Under Review</div>
                  <div className="text-xs text-on-surface-variant">Expert Panel Assigned</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-surface-container-highest mt-1.5"></div>
                </div>
                <div className="opacity-50">
                  <div className="font-bold text-primary text-sm">Open for Votes</div>
                  <div className="text-xs text-on-surface-variant">Initial Proposal</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="pt-6 border-t border-surface-container">
             <button 
                onClick={() => navigate('/funds')}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
             >
                 <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                 Fund this Initiative
             </button>
             <button 
                onClick={() => {
                    if (navigator.share) {
                        navigator.share({ title: idea.title, url: window.location.href }).catch(console.error);
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied!');
                    }
                }}
                className="w-full mt-3 bg-surface-container-high text-primary py-3 rounded-full font-bold shadow-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
             >
                 <span className="material-symbols-outlined text-sm">share</span>
                 Share Proposal
             </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
