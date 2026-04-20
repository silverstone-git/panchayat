import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { Avatar } from '../common/Avatar';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  profile: any;
  handleLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleCategoryChange: (c: string | null) => void;
}

export function Header({ theme, toggleTheme, profile, handleLogout, searchQuery, setSearchQuery, handleCategoryChange }: HeaderProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'text-primary bg-primary/10 px-3 py-1.5 rounded-xl' : 'text-slate-500 hover:text-primary';

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl fixed top-0 z-40 w-full shadow-sm dark:shadow-none transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 cursor-pointer" onClick={() => handleCategoryChange(null)}>
          <span className="material-symbols-outlined text-blue-900 dark:text-blue-200">account_balance</span>
          <h1 className="text-2xl font-black text-blue-900 dark:text-blue-100 font-headline tracking-tight hidden sm:block">Panchayat</h1>
        </Link>
        
        <div className="flex-1 max-w-lg mx-6 relative hidden md:block">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input 
            className="w-full bg-surface-container-low border border-transparent rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
            placeholder="Search policies, regions, or members..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex gap-4 items-center border-r border-outline-variant pr-6">
            <Link to="/impact" className={`font-label text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isActive('/impact')}`}>Impact</Link>
            <Link to="/groups" className={`font-label text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isActive('/groups')}`}>Groups</Link>
            <Link to="/expert-review" className={`font-label text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isActive('/expert-review')}`}>Review</Link>
            <Link to="/funds" className={`font-label text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isActive('/funds')}`}>Funds</Link>
          </div>

          <ThemeToggle theme={theme} toggle={toggleTheme} />
          
          {profile && (
            <div className="flex items-center gap-2 p-1 pr-3 bg-surface-container-low rounded-full cursor-pointer hover:bg-surface-container transition-colors" onClick={handleLogout}>
              <Avatar size={32} url={profile.profile_data?.avatar_url} />
              <span className="font-bold text-sm hidden sm:block text-primary">u/{profile.username}</span>
              <span className="material-symbols-outlined text-slate-400 text-sm ml-1" title="Logout">logout</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
