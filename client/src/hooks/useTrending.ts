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
          const idea = await res.json();
          
          // If no images, fetch placeholder from our new endpoint
          if (!idea.images || idea.images.length === 0) {
            try {
              const pRes = await fetch(`/api/v1/threads/images/category-placeholder?category=${idea.category}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (pRes.ok) {
                const pData = await pRes.ok ? await pRes.json() : { url: '' };
                if (pData.url) {
                  idea.images = [{ url: pData.url, caption: 'Category placeholder' }];
                }
              }
            } catch (err) {
              console.error("Error fetching placeholder", err);
            }
          }
          
          setTrendingIdea(idea);
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
