import React, { useState, useEffect, FormEvent } from 'react';
import { CommentNode } from './CommentNode';
import { toaster } from '../../utils/toaster';

export function Comments({ ideaId, token }: { ideaId: string; token: string }) {
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
      
      if (res.ok) {
        if (!parentId) {
          setNewComment('');
          setPage(1);
          fetchComments(1, true);
        }
        toaster.success("Comment posted successfully!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        const detail = errorData.detail;
        
        if (detail === 'Your comment has been restricted') {
          toaster.error("Your comment has been restricted");
        } else {
          const message = typeof detail === 'string' ? detail : (detail?.message || "Failed to post comment.");
          toaster.error(message);
        }
      }
    } catch (err) {
      console.error("Post comment error:", err);
      toaster.error("Failed to post comment. Please try again.");
    }
  };

  const handlePostTopLevel = (e: FormEvent) => {
    e.preventDefault();
    postComment(null, newComment);
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
    <div className="mt-8 pt-6 border-t border-surface-container" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <strong className="text-primary font-headline">{totalCount} Comments</strong>
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded-full text-xs font-semibold ${sort === 'new' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'}`} onClick={() => setSort('new')}>New</button>
          <button className={`px-3 py-1 rounded-full text-xs font-semibold ${sort === 'top' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'}`} onClick={() => setSort('top')}>Top</button>
        </div>
      </div>
      
      <form onSubmit={handlePostTopLevel} className="flex gap-3 mb-8">
        <input className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary shadow-sm" placeholder="Add to the discussion..." value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
        <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors" type="submit">Post</button>
      </form>

      <div className="space-y-2">
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
          className="w-full mt-6 py-3 rounded-xl bg-surface-container-low text-primary font-bold hover:bg-surface-container transition-colors" 
          onClick={() => { const next = page + 1; setPage(next); fetchComments(next); }} 
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
