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
    feed, userVotes, hasMore, loading,
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

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 grid grid-cols-1 md:grid-cols-12 gap-8 pb-24">
      <LeftSidebar 
        activeCategory={activeCategory} 
        handleCategoryChange={handleCategoryChange} 
        setShowModal={setShowModal} 
      />

      <div className="col-span-1 md:col-span-9 lg:col-span-7 flex flex-col space-y-6">
        
        {/* Featured Hero Section (Asymmetric Layout) */}
        {displayHero && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-4 animate-in fade-in duration-700">
            <div className="md:col-span-7 space-y-6">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-tertiary-container bg-tertiary-fixed px-3 py-1 rounded-full">Top Trending Initiative</span>
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
              <img className="w-full h-full object-cover rounded-[2rem] shadow-2xl relative z-10" alt="solar panels" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNaujvn5kdLy9EtTOzs3jSFGLmm2UY6GmHtVCCwKga1nBbneKKOxarFBoXv0w5O_0dqQT6yyjwPP5sOvjkuxlryCc88R-qVc2RK65JvF6AZzR6tVTQqxNDNpsB4O0O2oI69aP7sUyDgLcwqfUVIKUV50oeuYbLCzNmqqE4s6Elb6lPqpxzETJkwQ2kFj_QhHEXfbBZWGhUTEt7d30p3KfRz3SB1N9vknijjADE8QhsxFRUZaEXcHtmZmE3sjJXAniRq65FX3D0Zkw"/>
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
          onSuccess={() => {
            setShowModal(false);
            setTimeout(refreshFeed, 1000);
          }} 
        />
      )}
    </main>
  );
}
