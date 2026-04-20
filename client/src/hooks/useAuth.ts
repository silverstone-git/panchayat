import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [profile, setProfile] = useState<any>(null);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
  };

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setProfile(await res.json());
  }, [token]);

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
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, fetchProfile]);

  return { token, isLoggedIn, profile, handleAuthSuccess, handleLogout, updateAvatar };
}
