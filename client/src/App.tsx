import { useState, useEffect, FormEvent } from 'react';
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

// --- Components ---

function Avatar({ url, size = 32 }: { url?: string; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <img src={url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'} alt="avatar" />
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

function Comments({ ideaId, token }: { ideaId: string; token: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [userCommentVotes, setUserCommentVotes] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<'top' | 'new'>('new');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/threads/ideas/${ideaId}/comments?sort=${sort}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        const ids = data.map((c: any) => c.id).join(',');
        if (ids) {
          const vRes = await fetch(`/api/v1/votes/my-votes?target_type=comment&target_ids=${ids}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            setUserCommentVotes(vData);
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
    fetchComments();
  }, [ideaId, sort]);

  const postComment = async (e: FormEvent, parentId: string | null = null, content: string) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`/api/v1/threads/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, parent_id: parentId })
      });
      if (res.ok) {
        setNewComment('');
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const voteComment = async (id: string, targetDir: number) => {
    const current = userCommentVotes[id] || 0;
    const newDir = current === targetDir ? 0 : targetDir;
    const delta = newDir - current;
    setComments(prev => prev.map(c => c.id === id ? { ...c, vote_count: c.vote_count + delta } : c));
    setUserCommentVotes(prev => ({ ...prev, [id]: newDir }));
    try {
      await fetch(`/api/v1/votes/comment/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ direction: newDir })
      });
    } catch (err) {}
  };

  return (
    <div className="comments-section" onClick={(e) => e.stopPropagation()}>
      <div className="comments-header-row">
        <strong>{comments.length} Comments</strong>
        <div className="sort-buttons">
          <button className={sort === 'new' ? 'active' : ''} onClick={() => setSort('new')}>New</button>
          <button className={sort === 'top' ? 'active' : ''} onClick={() => setSort('top')}>Top</button>
        </div>
      </div>
      <form onSubmit={(e) => postComment(e, null, newComment)}>
        <input 
          placeholder="What are your thoughts?" 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          required 
        />
        <button className="btn-primary" type="submit">Comment</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="comment" 
              style={{ marginLeft: `${comment.depth * 15}px` }}
            >
              <div className="comment-header">
                <Avatar size={20} url={comment.author_avatar} />
                <strong>u/{comment.author_id}</strong>
              </div>
              <p>{comment.content}</p>
              <div className="comment-actions">
                <button onClick={() => voteComment(comment.id, 1)} className={userCommentVotes[comment.id] === 1 ? 'voted' : ''}>▲</button>
                <span>{comment.vote_count}</span>
                <button onClick={() => voteComment(comment.id, -1)} className={userCommentVotes[comment.id] === -1 ? 'voted' : ''}>▼</button>
                <button className="reply-btn" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>Reply</button>
              </div>
              {replyingTo === comment.id && (
                <form className="reply-form" onSubmit={(e) => postComment(e, comment.id, replyContent)}>
                  <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required />
                  <button className="btn-outline" type="submit">Post</button>
                </form>
              )}
            </div>
          ))}
        </div>
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
  const [feed, setFeed] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  // Auth state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
  };

  const fetchProfile = async () => {
    if (!token) return;
    const res = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  };

  const updateAvatar = async (url: string) => {
    if (!token || !profile) return;
    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profile_data: { ...profile.profile_data, avatar_url: url } })
    });
    if (res.ok) {
      fetchProfile();
    }
  };

  const fetchFeed = async () => {
    if (!token) return;
    const res = await fetch('/api/v1/threads/feed', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setFeed(data);
      const ids = data.map((item: any) => item.id).join(',');
      if (ids) {
        const vRes = await fetch(`/api/v1/votes/my-votes?target_type=idea&target_ids=${ids}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (vRes.ok) setUserVotes(await vRes.json());
      }
    }
  };

  const postIdea = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/threads/ideas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, description: newDesc, category: 'general' })
    });
    if (res.ok) {
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setTimeout(fetchFeed, 1000);
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchFeed();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h1 style={{ color: 'var(--secondary-color)' }}>Panchayat</h1>
        <p>A civic participation platform</p>
        <form onSubmit={handleLogin} style={{ maxWidth: 300, margin: '20px auto' }}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit" style={{ width: '100%' }}>Log In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="top-nav">
        <div className="logo">🏛️ Panchayat</div>
        <div className="search-bar"><input placeholder="Search Panchayat" /></div>
        <div className="nav-actions">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          {profile && <Avatar url={profile.profile_data?.avatar_url} />}
          <button className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="app-wrapper">
        <aside className="left-sidebar">
          <div className="nav-item active">🏠 Home</div>
          <div className="nav-item">📈 Popular</div>
          <div className="nav-item">🛡️ Moderation</div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />
          <h5>FEEDS</h5>
          <div className="nav-item">🌍 Environment</div>
          <div className="nav-item">🏘️ Local Governance</div>
          <div className="nav-item">🛣️ Infrastructure</div>
        </aside>

        <main className="main-feed">
          <div className="create-post-card" onClick={() => setShowModal(true)}>
            <Avatar url={profile?.profile_data?.avatar_url} />
            <input placeholder="Create Post" readOnly />
          </div>

          {feed.map(item => (
            <div key={item.id} className="idea-card" onClick={() => setExpandedIdea(expandedIdea === item.id ? null : item.id)}>
              <div className="author-line">
                <Avatar size={16} url={item.author_avatar} />
                <span>p/{item.category} • Posted by u/{item.author_id}</span>
              </div>
              <h4>{item.title}</h4>
              <div className="content">{item.description}</div>
              <div className="actions">
                <div className="action-btn" onClick={(e) => { e.stopPropagation(); vote(item.id, 1); }}>
                  <span style={{ color: userVotes[item.id] === 1 ? 'var(--secondary-color)' : '' }}>▲</span>
                  {item.vote_count}
                </div>
                <div className="action-btn" onClick={(e) => { e.stopPropagation(); vote(item.id, -1); }}>
                  <span style={{ color: userVotes[item.id] === -1 ? 'var(--primary-color)' : '' }}>▼</span>
                </div>
                <div className="action-btn">💬 {item.comment_count || 0} Comments</div>
              </div>
              {expandedIdea === item.id && token && <Comments ideaId={item.id} token={token} />}
            </div>
          ))}
        </main>

        <aside className="right-sidebar">
          <div className="sidebar-box">
            <h5>Your Profile</h5>
            {profile && (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15 }}>
                  <Avatar size={48} url={profile.profile_data?.avatar_url} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>u/{profile.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Level {profile.level} • {profile.xp} XP</div>
                  </div>
                </div>
                <h6>Select Avatar</h6>
                <div className="avatar-selection">
                  {AVATAR_OPTIONS.map(url => (
                    <img 
                      key={url} 
                      src={url} 
                      className={`avatar-option ${profile.profile_data?.avatar_url === url ? 'selected' : ''}`}
                      onClick={() => updateAvatar(url)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="sidebar-box">
            <h5>Trending Categories</h5>
            <div style={{ fontSize: '0.9rem' }}>
              <p>#RoadSafety</p>
              <p>#CleanWater</p>
              <p>#UrbanParks</p>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create an Idea</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={postIdea}>
              <input 
                placeholder="Title" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                required 
                style={{ marginBottom: 15 }}
              />
              <textarea 
                placeholder="Description" 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                required 
                style={{ width: '100%', height: 150, background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4, padding: 10, marginBottom: 15 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" type="submit">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
