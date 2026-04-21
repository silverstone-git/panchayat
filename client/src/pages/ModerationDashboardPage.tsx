import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';

export function ModerationDashboardPage({ token, profile }: { token: string | null, profile: any }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'reports'>('applications');

  const fetchApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/users/expert-applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setApplications(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/moderation/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setReports(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchApplications(), fetchReports()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleReview = async (appId: number, action: 'APPROVE' | 'REJECT') => {
    if (!token) return;
    const notes = prompt(`Enter ${action.toLowerCase()} notes (optional):`);
    try {
      const res = await fetch(`/api/v1/users/expert-applications/${appId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) fetchApplications();
      else alert('Failed to review application');
    } catch (e) { console.error(e); }
  };

  const handleReportAction = async (reportId: number, action: 'HIDE' | 'IGNORE') => {
    if (!token) return;
    const notes = prompt(`Enter ${action.toLowerCase()} notes (optional):`);
    try {
      const res = await fetch(`/api/v1/moderation/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) fetchReports();
      else alert('Failed to take action on report');
    } catch (e) { console.error(e); }
  };

  const getCategoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || id;

  if (!profile) return <div className="pt-32 text-center font-bold">Please log in.</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
      <header className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">Moderation & Admin Hub</h1>
        <div className="flex gap-4 border-b border-surface-container">
            <button 
                onClick={() => setActiveTab('applications')}
                className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'applications' ? 'border-b-4 border-primary text-primary' : 'text-outline hover:text-primary'}`}
            >
                Expert Applications ({applications.length})
            </button>
            <button 
                onClick={() => setActiveTab('reports')}
                className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'border-b-4 border-primary text-primary' : 'text-outline hover:text-primary'}`}
            >
                Community Reports ({reports.length})
            </button>
        </div>
      </header>

      <section className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : activeTab === 'applications' ? (
          <div className="grid gap-6">
            {applications.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-2xl text-center text-outline">No pending applications.</div>
            ) : applications.map(app => (
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
                  <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Statement</h5>
                  <p className="text-sm text-on-surface-variant bg-surface-container-low p-4 rounded-xl">{app.statement}</p>
                </div>
                <div className="flex gap-3 pt-4 border-t border-surface-container">
                  <button onClick={() => handleReview(app.id, 'APPROVE')} className="bg-primary text-on-primary font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all">Approve</button>
                  <button onClick={() => handleReview(app.id, 'REJECT')} className="bg-error-container text-on-error-container font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-error-container/80 transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-2xl text-center text-outline">No pending reports.</div>
            ) : reports.map(report => (
              <div key={report.id} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex gap-2 mb-2">
                       <span className="bg-error-container text-on-error-container text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">{report.target_type}</span>
                       <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">Reporter: {report.reporter_id}</span>
                    </div>
                    <h4 className="text-xl font-bold font-headline text-primary">Target ID: {report.target_id}</h4>
                  </div>
                  <div className="text-xs text-outline font-bold">{new Date(report.created_at).toLocaleDateString()}</div>
                </div>
                <div className="mb-6">
                  <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Reason for Report</h5>
                  <p className="text-sm text-on-surface-variant bg-surface-container-low p-4 rounded-xl">{report.reason}</p>
                </div>
                <div className="flex gap-3 pt-4 border-t border-surface-container">
                  <button onClick={() => handleReportAction(report.id, 'HIDE')} className="bg-error text-on-error font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">Hide Content</button>
                  <button onClick={() => handleReportAction(report.id, 'IGNORE')} className="bg-surface-container-highest text-on-surface-variant font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-outline-variant transition-all">Ignore Report</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
