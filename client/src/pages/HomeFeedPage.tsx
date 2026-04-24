import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeed } from '../hooks/useFeed';
import { useTrending } from '../hooks/useTrending';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { FeedList } from '../components/feed/FeedList';
import { CreatePostModal } from '../components/feed/CreatePostModal';

export function HomeFeedPage({ token, profile, updateAvatar, searchQuery }: any) {
  const navigate = useNavigate();
  const {
    feed, setFeed,
    userVotes, hasMore, loading,
    setSearchQuery,
    activeCategory, handleCategoryChange,
    sortBy, handleSortChange,
    loadMore, refreshFeed, vote
  } = useFeed(token, true);

  const { trendingIdea, loading: loadingTrending } = useTrending(token);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
     setSearchQuery(searchQuery);
  }, [searchQuery, setSearchQuery]);

  const displayHero = !activeCategory && !searchQuery && !loadingTrending && trendingIdea;

  const getCategoryPlaceholder = (category: string) => {
    const keywords: Record<string, string> = {
      'environment': 'nature,forest',
      'governance': 'government,parliament',
      'infrastructure': 'bridge,architecture',
      'policy': 'document,legal',
      'general': 'community,meeting'
    };
    const kw = keywords[category] || 'city';
    return `https://source.unsplash.com/featured/800x600?${kw}`;
  };

  const handleOptimisticPost = (newIdea: any) => {
    setFeed(prev => [newIdea, ...prev]);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 grid grid-cols-1 md:grid-cols-12 gap-8 pb-24">
      <LeftSidebar 
        activeCategory={activeCategory} 
        handleCategoryChange={handleCategoryChange} 
        setShowModal={setShowModal} 
      />

      <div className="col-span-1 md:col-span-9 lg:col-span-7 flex flex-col space-y-6">
        
        {displayHero && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-4 animate-in fade-in duration-700">
            <div className="md:col-span-7 space-y-6">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-tertiary-container bg-tertiary-container px-3 py-1 rounded-full">Top Trending Initiative</span>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
                {trendingIdea.title}
              </h2>
              <p className="text-lg text-on-surface-variant max-w-xl font-body line-clamp-3">
                {trendingIdea.description}
              </p>
              <div className="flex gap-4 pt-4">
                <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2" onClick={() => navigate(`/idea/${trendingIdea.id}`)}>
                  View Full Proposal
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
            <div className="md:col-span-5 relative aspect-square md:aspect-auto h-full min-h-[250px]">
              <div className="absolute inset-0 bg-primary-container rounded-[2rem] transform rotate-3 scale-95 opacity-20"></div>
              <img 
                className="w-full h-full object-cover rounded-[2rem] shadow-2xl relative z-10" 
                alt={trendingIdea.title} 
                src={
                  (trendingIdea.images && trendingIdea.images.length > 0) 
                    ? trendingIdea.images[0].url 
                    : getCategoryPlaceholder(trendingIdea.category)
                } 
              />
            </div>
          </section>
        )}

        <FeedList 
          feed={feed} 
          loading={loading} 
          hasMore={hasMore} 
          loadMore={loadMore}
          activeCategory={activeCategory} 
          sortBy={sortBy} 
          handleSortChange={handleSortChange} 
          userVotes={userVotes} 
          vote={vote} 
          token={token} 
        />
      </div>

      <RightSidebar 
        profile={profile} 
        updateAvatar={updateAvatar} 
        token={token}
      />

      {showModal && (
        <CreatePostModal 
          token={token} 
          activeCategory={activeCategory} 
          onClose={() => setShowModal(false)} 
          onSuccess={(newIdea) => {
            handleOptimisticPost(newIdea);
            setTimeout(refreshFeed, 1500);
          }} 
        />
      )}
    </main>
  );
}
