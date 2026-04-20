import React, { useState, FormEvent } from 'react';

export function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(false);

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
      onAuthSuccess(data.access_token);
    } else {
      alert('Login failed');
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (res.ok) {
        handleLogin(e);
      } else {
        const err = await res.json();
        alert(err.detail || 'Sign up failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-[10vh] bg-surface text-on-surface">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-primary text-5xl">account_balance</span>
        <h1 className="text-primary text-5xl font-black font-headline tracking-tight">Panchayat</h1>
      </div>
      <p className="text-on-surface-variant mb-8 text-lg font-body">Empowering collective intelligence for civic good.</p>
      <form onSubmit={isSignup ? handleSignup : handleLogin} className="w-full max-w-md bg-surface-container-lowest p-8 rounded-2xl shadow-xl border border-surface-container">
        <h2 className="text-2xl font-bold font-headline text-primary mb-6 text-center">{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
        
        <input className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-primary transition-colors" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        
        {isSignup && (
          <input className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-primary transition-colors" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
        )}
        
        <input className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-primary transition-colors" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        
        <button className="w-full bg-primary text-on-primary rounded-full py-3 font-bold shadow-md hover:bg-primary/90 transition-all mb-6" type="submit">
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
        
        <div className="text-center text-sm text-on-surface-variant pt-4 border-t border-surface-container-high">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button type="button" className="text-secondary font-bold hover:underline cursor-pointer" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
}
