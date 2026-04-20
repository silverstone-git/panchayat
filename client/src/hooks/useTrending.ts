import { useState, useEffect } from 'react';

export function useTrending(token: string | null) {
  const [trendingIdea, setTrendingIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/v1/threads/ideas/trending/hero', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setTrendingIdea(await res.json());
        }
      } catch (e) {
        console.error("Error fetching trending hero", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [token]);

  return { trendingIdea, loading };
}
