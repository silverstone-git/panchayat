import { useState, useEffect, useCallback } from 'react';

export function useFeed(token: string | null, isLoggedIn: boolean) {
  const [feed, setFeed] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(new URLSearchParams(window.location.search).get('category'));
  const [sortBy, setSortBy] = useState<'new' | 'trending'>('new');

  const fetchFeedData = useCallback(async (pageNum: number, query: string, category: string | null, sort: string, append = false) => {
    if (!token || loading) return;
    setLoading(true);
    try {
      let url = `/api/v1/threads/feed?page=${pageNum}&size=10&sort=${sort}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFeed(prev => append ? [...prev, ...data.items] : data.items);
        setHasMore(data.has_more);
        
        const ids = data.items.map((item: any) => item.id).join(',');
        if (ids) {
          const vRes = await fetch(`/api/v1/votes/my-votes?target_type=idea&target_ids=${ids}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            setUserVotes(prev => ({ ...prev, ...vData }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, loading]);

  // Initial load & category/sort changes handled explicitly via handlers to avoid double-fetching
  const handleCategoryChange = (catId: string | null) => {
    setActiveCategory(catId);
    setPage(1);
    fetchFeedData(1, searchQuery, catId, sortBy, false);
  };

  const handleSortChange = (newSort: 'new' | 'trending') => {
    setSortBy(newSort);
    setPage(1);
    fetchFeedData(1, searchQuery, activeCategory, newSort, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeedData(nextPage, searchQuery, activeCategory, sortBy, true);
  };

  const refreshFeed = () => {
    setPage(1);
    fetchFeedData(1, searchQuery, activeCategory, sortBy, false);
  };

  const vote = async (id: string, dir: number) => {
    const current = userVotes[id] || 0;
    const next = current === dir ? 0 : dir;
    const delta = next - current;
    setFeed(prev => prev.map(i => i.id === id ? { ...i, vote_count: i.vote_count + delta } : i));
    setUserVotes(prev => ({ ...prev, [id]: next }));
    try {
      await fetch(`/api/v1/votes/idea/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ direction: next })
      });
    } catch (e) {}
  };

  // Handle Search with debounce
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchFeedData(1, searchQuery, activeCategory, sortBy, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, isLoggedIn]); // Omitting fetchFeedData to prevent infinite loops, managed via manual calls mostly

  return {
    setFeed,
    feed, userVotes, hasMore, loading,
    searchQuery, setSearchQuery,
    activeCategory, handleCategoryChange,
    sortBy, handleSortChange,
    loadMore, refreshFeed, vote
  };
}
