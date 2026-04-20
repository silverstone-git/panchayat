import React, { useState, useEffect } from 'react';
import { Avatar } from '../components/common/Avatar';
import { CATEGORIES } from '../constants';

export function ModerationDashboardPage({ token, profile }: { token: string | null, profile: any }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users/expert-applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token]);

  const handleReview = async (appId: int, action: 'APPROVE' | 'REJECT') => {
    if (!token) return;
    const notes = prompt(`Enter ${action.toLowerCase()} notes (optional):`);
    try {
      const res = await fetch(`/api/v1/users/expert-applications/${appId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) {
        fetchApplications();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to review application');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || id;

  if (!profile) return <div className="pt-32 text-center font-bold">Please log in.</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
      <header className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">Moderation & Admin Hub</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl font-body leading-relaxed">
          {profile.system_role === 'ADMIN' ? 'Global Administration View' : 'Category Moderator View'}. Review pending expert applications and community reports.
        </p>
      </header>

      <section className="space-y-6">
        <h3 className="text-2xl font-headline font-bold text-primary">Pending Expert Applications</h3>
        
        {loading ? (
          <div className="text-center py-8">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 rounded-2xl text-center text-outline">No pending applications to review.</div>
        ) : (
          <div className="grid gap-6">
            {applications.map(app => (
              <div key={app.id} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex gap-2 mb-2">
                       <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">{getCategoryName(app.category)}</span>
                       <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">{app.status}</span>
                    </div>
                    <h4 className="text-xl font-bold font-headline text-primary">Applicant ID: {app.user_id}</h4>
                  </div>
                  <div className="text-xs text-outline font-bold">{new Date(app.created_at).toLocaleDateString()}</div>
                </div>
                
                <div className="mb-6">
                  <h5 className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Statement of Qualifications</h5>
                  <p className="text-sm text-on-surface-variant bg-surface-container-low p-4 rounded-xl">{app.statement}</p>
                </div>

                <div className="mb-6">
                  <h5 className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Documents ({app.document_urls.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {app.document_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-surface-container-high px-3 py-2 rounded-lg hover:bg-surface-container-highest transition-colors text-primary font-bold">
                        <span className="material-symbols-outlined text-[14px]">description</span> Document {i+1}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-surface-container">
                  <button onClick={() => handleReview(app.id, 'APPROVE')} className="bg-primary text-on-primary font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span> Approve
                  </button>
                  <button onClick={() => handleReview(app.id, 'REJECT')} className="bg-error-container text-on-error-container font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-error-container/80 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">cancel</span> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
