import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [profile, setProfile] = useState<any>(null);

  const handleLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
    window.location.reload();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(await res.json());
      } else if (res.status === 401) {
        // Automatically logout on expired/invalid token
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  }, [token, handleLogout]);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setIsLoggedIn(true);
  };

  const updateAvatar = async (url: string) => {
    if (!token || !profile) return;
    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ profile_data: { ...profile.profile_data, avatar_url: url } })
    });
    if (res.ok) fetchProfile();
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchProfile();
    }
  }, [isLoggedIn, token, fetchProfile]);

  return { token, isLoggedIn, profile, handleAuthSuccess, handleLogout, updateAvatar };
}
