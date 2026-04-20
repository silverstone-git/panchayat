import React, { useState, FormEvent } from 'react';
import { Avatar } from '../common/Avatar';

export function CommentNode({ comment, ideaId, token, userCommentVotes, voteComment, postComment, onReplyAdded }: any) {
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
    <div className={`flex gap-4 group mt-6 ${comment.depth > 0 ? 'pl-6 border-l-2 border-surface-container' : ''}`}>
      <div className="flex flex-col items-center gap-1 pt-1">
        <button className="p-1 hover:text-secondary-color transition-colors" onClick={() => voteComment(comment.id, 1)}>
          <span className="material-symbols-outlined text-sm" style={{ color: userCommentVotes[comment.id] === 1 ? 'var(--secondary-color)' : '' }}>expand_less</span>
        </button>
        <span className="font-label font-bold text-primary text-[12px]">{comment.vote_count}</span>
        <button className="p-1 hover:text-blue-500 transition-colors" onClick={() => voteComment(comment.id, -1)}>
          <span className="material-symbols-outlined text-sm" style={{ color: userCommentVotes[comment.id] === -1 ? '#7193ff' : '' }}>expand_more</span>
        </button>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Avatar size={24} url={comment.author_avatar} />
          <span className="font-label font-bold text-sm text-primary">u/{comment.author_id}</span>
          <span className="text-outline text-[11px] ml-auto">Just now</span>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed font-body mb-3">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs font-label font-bold text-primary/60 hover:text-primary" onClick={() => setReplyingTo(!replyingTo)}>
            <span className="material-symbols-outlined text-sm">reply</span> Reply
          </button>
        </div>

        {replyingTo && (
          <form className="mt-3 flex gap-2" onSubmit={handlePostReply}>
            <input className="flex-1 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required placeholder="Add a reply..." />
            <button className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/90" type="submit">Reply</button>
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
            className="text-xs font-bold text-secondary mt-3 hover:underline"
            disabled={loadingReplies}
          >
            {loadingReplies ? 'Loading...' : 'Load more replies...'}
          </button>
        )}
      </div>
    </div>
  );
}
