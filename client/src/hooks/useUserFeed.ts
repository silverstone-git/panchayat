import { useState, useEffect } from 'react';

export function useUserFeed(token: string | null, authorId: string | number | undefined) {
  const [userFeed, setUserFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserFeed = async () => {
      if (!token || !authorId) return;
      try {
        const res = await fetch(`/api/v1/threads/feed?author_id=${authorId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserFeed(data.items);
        }
      } catch (e) {
        console.error("Error fetching user feed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserFeed();
  }, [token, authorId]);

  return { userFeed, loading };
}
