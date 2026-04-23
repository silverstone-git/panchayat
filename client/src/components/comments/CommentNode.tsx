import React, { useState, FormEvent } from 'react';
import { Avatar } from '../common/Avatar';
import { toaster } from '../../utils/toaster';

export function CommentNode({ comment, ideaId, token, userCommentVotes, voteComment, postComment, onReplyAdded }: any) {
  const [replies, setReplies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(comment.reply_count > 0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyingTo, setReplyingTo] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState('');
  const [isDeleted, setIsDeleted] = useState(comment.author_id === '[deleted]');

  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const currentUserId = payload?.user_id?.toString();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/v1/threads/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toaster.success("Comment deleted");
        setIsDeleted(true);
        comment.content = "[This comment has been deleted by the user]";
        comment.author_name = "[deleted]";
        comment.author_id = "[deleted]";
      } else {
        toaster.error("Failed to delete comment");
      }
    } catch (e) {
      toaster.error("Network error");
    }
  };

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
    <div className={`flex gap-4 group mt-6 relative ${comment.depth > 0 ? 'pl-6 border-l-2 border-surface-container' : ''}`}>
      <div className="flex flex-col items-center gap-1 pt-1">
        <button className={`p-1 transition-colors ${userCommentVotes[comment.id] === 1 ? 'text-orange-600 dark:text-orange-400' : 'hover:text-orange-600 dark:hover:text-orange-400 text-outline'}`} onClick={() => voteComment(comment.id, 1)}>
          <span className="material-symbols-outlined text-sm">expand_less</span>
        </button>
        <span className={`font-label font-bold text-[12px] ${userCommentVotes[comment.id] === 1 ? 'text-orange-600 dark:text-orange-400' : userCommentVotes[comment.id] === -1 ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>{comment.vote_count}</span>
        <button className={`p-1 transition-colors ${userCommentVotes[comment.id] === -1 ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:hover:text-blue-400 text-outline'}`} onClick={() => voteComment(comment.id, -1)}>
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </button>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Avatar size={24} url={isDeleted ? '' : comment.author_avatar} />
          <span className={`font-label font-bold text-sm ${isDeleted ? 'text-outline italic' : 'text-primary'}`}>u/{comment.author_name || comment.author_id}</span>
          <span className="text-outline text-[11px] ml-auto">Just now</span>
          {currentUserId === comment.author_id && !isDeleted && (
             <button 
               onClick={handleDelete}
               className="p-1 text-outline hover:text-error hover:bg-error-container/20 rounded-full transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 ml-1"
               title="Delete comment"
             >
               <span className="material-symbols-outlined text-[16px]">delete</span>
             </button>
          )}
        </div>
        <p className={`text-on-surface-variant text-sm leading-relaxed font-body mb-3 ${isDeleted ? 'italic opacity-70' : ''}`}>
          {comment.content}
        </p>
        
        {!isDeleted && (
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-xs font-label font-bold text-primary/60 hover:text-primary" onClick={() => setReplyingTo(!replyingTo)}>
              <span className="material-symbols-outlined text-sm">reply</span> Reply
            </button>
          </div>
        )}

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
