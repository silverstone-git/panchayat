import { useState, useEffect, useCallback, FormEvent } from 'react';
import './App.css';

// --- Constants ---
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
];

const CATEGORIES = [
  { id: 'general', name: 'General', icon: '🏛️' },
  { id: 'environment', name: 'Environment', icon: '🌍' },
  { id: 'governance', name: 'Local Governance', icon: '🏘️' },
  { id: 'infrastructure', name: 'Infrastructure', icon: '🛣️' },
];

// --- Components ---

function Avatar({ url, size = 32 }: { url?: string; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <img src={url || `https://api.dicebear.com/7.x/initials/svg?seed=User`} alt="avatar" />
    </div>
  );
}

function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle Dark/Light Mode">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function CommentNode({ comment, ideaId, token, userCommentVotes, voteComment, postComment, onReplyAdded }: any) {
  const [replies, setReplies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(comment.reply_count > 0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyingTo, setReplyingTo] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState('');

  const fetchReplies = async (pageNum: number) => {
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/v1/threads/ideas/${ideaId}/comments?parent_id=${comment.id}&page=${pageNum}&size=5&sort=new`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(prev => pageNum === 1 ? data.items : [...prev, ...data.items]);
        setHasMore(data.has_more);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handlePostReply = async (e: FormEvent) => {
    e.preventDefault();
    await postComment(comment.id, replyContent);
    setReplyContent('');
    setReplyingTo(false);
    setPage(1);
    fetchReplies(1); // Refresh children
    onReplyAdded();
  };

  return (
    <div className="comment" style={{ marginLeft: `${comment.depth > 0 ? 15 : 0}px`, borderLeft: comment.depth > 0 ? '1px solid var(--border-color)' : 'none', paddingLeft: comment.depth > 0 ? 10 : 0 }}>
      <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Avatar size={18} url={comment.author_avatar} />
        <strong style={{ fontSize: '0.8rem' }}>u/{comment.author_id}</strong>
      </div>
      <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>{comment.content}</p>
      
      <div className="comment-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="action-btn" onClick={() => voteComment(comment.id, 1)} style={{ color: userCommentVotes[comment.id] === 1 ? 'var(--secondary-color)' : '' }}>▲</button>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{comment.vote_count}</span>
            <button className="action-btn" onClick={() => voteComment(comment.id, -1)} style={{ color: userCommentVotes[comment.id] === -1 ? 'var(--primary-color)' : '' }}>▼</button>
        </div>
        <button className="reply-btn" style={{ background: 'none', border: 'none', color: 'var(--muted-text)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setReplyingTo(!replyingTo)}>Reply</button>
      </div>

      {replyingTo && (
        <form className="reply-form" onSubmit={handlePostReply} style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 12 }}>
          <input className="composer-input" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required placeholder="Add a reply..." />
          <button className="btn-outline" type="submit">Reply</button>
        </form>
      )}

      {replies.length > 0 && (
        <div className="nested-replies">
          {replies.map(reply => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              ideaId={ideaId} 
              token={token} 
              userCommentVotes={userCommentVotes} 
              voteComment={voteComment} 
              postComment={postComment}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button 
          onClick={() => { const next = page + 1; setPage(next); fetchReplies(next); }} 
          style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: 4, fontWeight: 'bold' }}
          disabled={loadingReplies}
        >
          {loadingReplies ? 'Loading...' : `Load more replies...`}
        </button>
      )}
    </div>
  );
}

function Comments({ ideaId, token }: { ideaId: string; token: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userCommentVotes, setUserCommentVotes] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<'top' | 'new'>('new');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async (pageNum: number, isReset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/threads/ideas/${ideaId}/comments?page=${pageNum}&size=10&sort=${sort}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => isReset ? data.items : [...prev, ...data.items]);
        setTotalCount(data.total);
        setHasMore(data.has_more);
        
        const ids = data.items.map((c: any) => c.id).join(',');
        if (ids) {
          const vRes = await fetch(`/api/v1/votes/my-votes?target_type=comment&target_ids=${ids}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (vRes.ok) {
             const vData = await vRes.json();
             setUserCommentVotes(prev => ({ ...prev, ...vData }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(1);
    fetchComments(1, true); 
  }, [ideaId, sort]);

  const postComment = async (parentId: string | null, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`/api/v1/threads/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content, parent_id: parentId })
      });
      if (res.ok && !parentId) {
        setNewComment('');
        setPage(1);
        fetchComments(1, true);
      }
    } catch (err) {}
  };

  const handlePostTopLevel = (e: FormEvent) => {
    e.preventDefault();
    postComment(null, newComment);
  };

  const voteComment = async (id: string, targetDir: number) => {
    const current = userCommentVotes[id] || 0;
    const newDir = current === targetDir ? 0 : targetDir;
    const delta = newDir - current;
    
    // We update local top-level state if it's there
    setComments(prev => prev.map(c => c.id === id ? { ...c, vote_count: c.vote_count + delta } : c));
    setUserCommentVotes(prev => ({ ...prev, [id]: newDir }));
    
    try {
      await fetch(`/api/v1/votes/idea/${id}`, { // Actually this should map to vote route for comment
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ direction: newDir })
      });
    } catch (err) {}
  };

  return (
    <div className="comments-section" onClick={(e) => e.stopPropagation()}>
      <div className="comments-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: '0.9rem' }}>{totalCount} Comments</strong>
        <div className="sort-buttons" style={{ display: 'flex', gap: 8 }}>
          <button className={`btn-outline ${sort === 'new' ? 'active' : ''}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setSort('new')}>New</button>
          <button className={`btn-outline ${sort === 'top' ? 'active' : ''}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setSort('top')}>Top</button>
        </div>
      </div>
      
      <form onSubmit={handlePostTopLevel} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="composer-input" placeholder="What are your thoughts?" value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
        <button className="btn-primary" type="submit">Post</button>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <CommentNode 
            key={comment.id} 
            comment={comment} 
            ideaId={ideaId} 
            token={token} 
            userCommentVotes={userCommentVotes} 
            voteComment={voteComment} 
            postComment={postComment}
            onReplyAdded={() => { setTotalCount(prev => prev + 1); }}
          />
        ))}
      </div>
      
      {hasMore && (
        <button 
          className="btn-outline" 
          onClick={() => { const next = page + 1; setPage(next); fetchComments(next); }} 
          style={{ width: '100%', marginTop: 12, padding: '8px' }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}

// --- Main App ---

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [profile, setProfile] = useState<any>(null);
  
  // Feed & Search State
  const [feed, setFeed] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'new' | 'trending'>('new');

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchFeed = useCallback(async (pageNum: number, query: string, category: string | null, sort: string, append = false) => {
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

  // Initial load
  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      setPage(1);
      fetchFeed(1, '', null, 'new', false);
    }
  }, [isLoggedIn]);

  // Handle Search with debounce
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchFeed(1, searchQuery, activeCategory, sortBy, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Category Change
  const handleCategoryChange = (catId: string | null) => {
    setActiveCategory(catId);
    setPage(1);
    fetchFeed(1, searchQuery, catId, sortBy, false);
  };

  // Handle Sort Change
  const handleSortChange = (newSort: 'new' | 'trending') => {
    setSortBy(newSort);
    setPage(1);
    fetchFeed(1, searchQuery, activeCategory, newSort, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, searchQuery, activeCategory, sortBy, true);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfile(null);
    setFeed([]);
  };

  const fetchProfile = async () => {
    if (!token) return;
    const res = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setProfile(await res.json());
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

  const postIdea = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/threads/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: newTitle, description: newDesc, category: activeCategory || 'general' })
    });
    if (res.ok) {
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setTimeout(() => fetchFeed(1, searchQuery, activeCategory, false), 1000);
    }
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

  if (!isLoggedIn) {
    return (
      <div className="auth-container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
        <h1 style={{ color: 'var(--secondary-color)', fontSize: '3rem', marginBottom: 10 }}>Panchayat</h1>
        <p style={{ color: 'var(--muted-text)', marginBottom: 32 }}>Empowering collective intelligence for civic good.</p>
        <form onSubmit={handleLogin} style={{ maxWidth: 360, margin: '0 auto', background: 'var(--card-bg)', padding: 32, borderRadius: 12, boxShadow: 'var(--shadow-md)' }}>
          <input className="composer-input" style={{ marginBottom: 16 }} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="composer-input" style={{ marginBottom: 24 }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit" style={{ width: '100%', padding: 12 }}>Log In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="top-nav">
        <div className="logo" onClick={() => handleCategoryChange(null)}>🏛️ Panchayat</div>
        <div className="search-bar">
          <input 
            placeholder="Search ideas, categories, or people..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Mode">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          {profile && (
            <div className="user-profile-menu">
              <span className="username-tag">{profile.username}</span>
              <Avatar size={28} url={profile.profile_data?.avatar_url} />
            </div>
          )}
          
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="app-wrapper">
        <aside className="left-sidebar">
          <div className={`nav-item ${!activeCategory ? 'active' : ''}`} onClick={() => handleCategoryChange(null)}>🏠 Home</div>
          <div className="nav-item">🔥 Popular</div>
          <div className="nav-item">🛡️ Moderation</div>
          
          <h5>SUB-PANCHAYATS</h5>
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.icon} {cat.name}
            </div>
          ))}
        </aside>

        <main className="main-feed">
          <div className="create-post-card" onClick={() => setShowModal(true)}>
            <Avatar url={profile?.profile_data?.avatar_url} />
            <input placeholder="Create Post" readOnly />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '0 4px' }}>
            <button 
              className={`nav-item ${sortBy === 'new' ? 'active' : ''}`} 
              onClick={() => handleSortChange('new')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              🕒 Latest
            </button>
            <button 
              className={`nav-item ${sortBy === 'trending' ? 'active' : ''}`} 
              onClick={() => handleSortChange('trending')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              🔥 Top Voted
            </button>
          </div>

          <div className="feed-list">
            {feed.length === 0 && !loading && <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted-text)' }}>No ideas found. Be the first to share one!</p>}
            
            {feed.map(item => (
              <div key={item.id} className="idea-card" onClick={() => setExpandedIdea(expandedIdea === item.id ? null : item.id)}>
                <div className="vote-sidebar" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="vote-btn up" 
                    onClick={() => vote(item.id, 1)}
                    style={{ color: userVotes[item.id] === 1 ? 'var(--secondary-color)' : '' }}
                  >
                    ▲
                  </button>
                  <span className="vote-count" style={{ color: userVotes[item.id] === 1 ? 'var(--secondary-color)' : userVotes[item.id] === -1 ? '#7193ff' : '' }}>
                    {item.vote_count}
                  </span>
                  <button 
                    className="vote-btn down" 
                    onClick={() => vote(item.id, -1)}
                    style={{ color: userVotes[item.id] === -1 ? '#7193ff' : '' }}
                  >
                    ▼
                  </button>
                </div>
                <div className="card-main-content">
                  <div className="author-line">
                    <Avatar size={20} url={item.author_avatar} />
                    <span>p/{item.category} • Posted by u/{item.author_id}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <div className="content">{item.description}</div>
                  <div className="actions">
                    <div className="action-btn">💬 {item.comment_count || 0} Comments</div>
                    <div className="action-btn">🚀 Share</div>
                  </div>
                  {expandedIdea === item.id && token && <Comments ideaId={item.id} token={token} />}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="pagination-container">
              <button className="btn-load-more" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
        </main>

        <aside className="right-sidebar">
          <div className="sidebar-box">
            <h5>Community Profile</h5>
            {profile && (
              <>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                  <Avatar size={52} url={profile.profile_data?.avatar_url} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>u/{profile.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: '600' }}>LEVEL {profile.level} • {profile.xp} XP</div>
                  </div>
                </div>
                <h6 style={{ fontSize: '0.7rem', color: 'var(--muted-text)', textTransform: 'uppercase', marginBottom: 12 }}>Personalize your Avatar</h6>
                <div className="avatar-selection" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {AVATAR_OPTIONS.map(url => (
                    <img 
                      key={url} 
                      src={url} 
                      className={`avatar-option ${profile.profile_data?.avatar_url === url ? 'selected' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateAvatar(url); }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="sidebar-box">
            <h5>Active in Panchayat</h5>
            <div style={{ fontSize: '0.9rem' }}>
              <div className="active-in-item">
                <span>#RoadSafety</span>
                <span>2.4k active</span>
              </div>
              <div className="active-in-item">
                <span>#CleanWater</span>
                <span>1.8k active</span>
              </div>
              <div className="active-in-item">
                <span>#UrbanParks</span>
                <span>900 active</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: 640 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Propose a New Idea</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={postIdea} className="modal-form">
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', marginBottom: 8, color: 'var(--muted-text)' }}>CHOOSE A CATEGORY</label>
                <select 
                  className="composer-input" 
                  value={activeCategory || 'general'} 
                  onChange={e => setActiveCategory(e.target.value)}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', marginBottom: 8, color: 'var(--muted-text)' }}>TITLE</label>
                <input 
                  className="composer-input" 
                  placeholder="What's the issue or solution?" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', marginBottom: 8, color: 'var(--muted-text)' }}>DESCRIPTION</label>
                <textarea 
                  className="composer-input" 
                  placeholder="Provide more details about your proposal..." 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  required 
                  style={{ height: 180, resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn-outline" type="button" onClick={() => setShowModal(false)} style={{ border: 'none' }}>Cancel</button>
                <button className="btn-primary" type="submit">Publish Idea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
