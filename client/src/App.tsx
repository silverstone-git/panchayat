import { useState, useEffect, FormEvent } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [feed, setFeed] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email: `${username}@example.com` })
    });
    if (res.ok) {
      alert("Registered! Now log in.");
    } else {
      const err = await res.json();
      alert(`Registration failed: ${JSON.stringify(err.detail)}`);
    }
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
      const authToken = data.access_token;
      setToken(authToken);
      localStorage.setItem('token', authToken);
      setIsLoggedIn(true);
    } else {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setFeed([]);
    setUserVotes({});
  };

  const fetchFeed = async () => {
    if (!token) return;

    const res = await fetch('/api/v1/threads/feed', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setFeed(data);

      const ids = data.map((item: any) => item.id || item._id).join(',');
      if (ids) {
        const voteRes = await fetch(`/api/v1/votes/my-votes?target_type=idea&target_ids=${ids}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (voteRes.ok) {
          const voteData = await voteRes.json();
          setUserVotes(voteData);
        }
      }
    } else if (res.status === 401) {
      handleLogout();
    }
  };

  const postIdea = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const res = await fetch('/api/v1/threads/ideas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, description: newDesc, category: 'general' })
    });
    if (res.ok) {
      setNewTitle('');
      setNewDesc('');
      setTimeout(fetchFeed, 1000); // Wait a second for ES indexing
    } else {
      alert("Failed to post idea. It might contain profanity or you might be unauthorized.");
    }
  };

  const vote = async (id: string, targetDirection: number) => {
    if (!token) return;

    const currentVote = userVotes[id] || 0;
    const newDirection = currentVote === targetDirection ? 0 : targetDirection;
    const delta = newDirection - currentVote;

    // Store previous states for rollback
    const previousFeed = [...feed];
    const previousUserVotes = { ...userVotes };

    // Optimistic UI update
    setFeed(prevFeed => prevFeed.map(item => {
      if ((item.id || item._id) === id) {
        return { ...item, vote_count: (item.vote_count || 0) + delta };
      }
      return item;
    }));
    setUserVotes(prev => ({ ...prev, [id]: newDirection }));

    try {
      const res = await fetch(`/api/v1/votes/idea/${id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ direction: newDirection })
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error) {
      console.error("Voting error:", error);
      alert("Failed to register vote. Reverting changes...");
      setFeed(previousFeed); // Rollback on failure
      setUserVotes(previousUserVotes);
    } finally {
      setTimeout(fetchFeed, 500); // Refresh feed to get true server state
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchFeed();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h1>DemoVox</h1>
        <form onSubmit={handleLogin}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <div className="buttons">
            <button type="submit">Login</button>
            <button type="button" onClick={handleRegister}>Register</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>DemoVox Feed</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      
      <div className="composer">
        <h3>Post an Idea</h3>
        <form onSubmit={postIdea}>
          <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
          <textarea placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} required />
          <button type="submit">Post Idea</button>
        </form>
      </div>

      <div className="feed">
        {feed.length === 0 ? <p>No ideas yet.</p> : feed.map((item: any) => (
          <div key={item.id || item._id} className="idea-card">
            <h4>{item.title}</h4>
            <p>{item.description}</p>
            <div className="meta">
              <span>Votes: {item.vote_count || 0}</span>
              <button 
                className={userVotes[item.id || item._id] === 1 ? 'active-upvote' : ''}
                onClick={() => vote(item.id || item._id, 1)}>👍</button>
              <button 
                className={userVotes[item.id || item._id] === -1 ? 'active-downvote' : ''}
                onClick={() => vote(item.id || item._id, -1)}>👎</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
