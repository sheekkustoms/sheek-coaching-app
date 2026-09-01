import { useEffect, useState, type FormEvent, useRef } from 'react';
import { Loader2, Send, MessageSquare, Trash2, Crown, ImagePlus, X, CornerDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Post, Comment } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

type ProfileMini = { display_name: string; avatar_url: string | null; tier: string };

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
  profiles: ProfileMini | null;
};

export function Community({ scope = 'general' }: { scope?: 'general' | 'mentorship' }) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(display_name, avatar_url, tier)')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPosts((data ?? []) as Post[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user?.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setMe(data);
      });
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('community-images').upload(path, file);
    if (upErr) {
      setError(upErr.message);
      return null;
    }
    const { data: pub } = supabase.storage.from('community-images').getPublicUrl(path);
    return pub.publicUrl;
  };

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed && !postImage) return;
    setPosting(true);
    setError(null);
    let imageUrl: string | null = null;
    if (postImage) {
      imageUrl = await uploadImage(postImage);
      if (!imageUrl) {
        setPosting(false);
        return;
      }
    }
    const { data, error } = await supabase
      .from('posts')
      .insert({ body: trimmed, image_url: imageUrl })
      .select('*, profiles!posts_user_id_fkey(display_name, avatar_url, tier)')
      .maybeSingle();
    setPosting(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setPosts((prev) => [data as Post, ...prev]);
      setBody('');
      setPostImage(null);
      setPostImagePreview(null);
    }
  };

  const onDeletePost = async (id: string) => {
    const prev = posts;
    setPosts((cur) => cur.filter((p) => p.id !== id));
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      setPosts(prev);
      setError(error.message);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-snow">{scope === 'mentorship' ? 'Mentorship Community' : 'Community'}</h1>
        <p className="mt-1 text-sm text-snow-dim">{scope === 'mentorship' ? 'A private space for mentorship members and Sheek to connect, share progress, and support each other.' : 'Share stitch-along updates, questions, and show-and-tell with the atelier.'}</p>
      </div>

      {/* New post form */}
      <div className="mb-6 rounded-2xl border border-pinkline bg-ink-100/60 p-4 shadow-glow">
        <form onSubmit={onSubmit}>
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={me?.display_name ?? 'Member'} src={me?.avatar_url} size={36} />
            <span className="text-sm text-snow-dim">Posting as {me?.display_name ?? 'Member'}</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something with the academy…"
            rows={3}
            className="w-full resize-none rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow transition-all duration-200"
          />
          {postImagePreview && (
            <div className="relative mt-3 inline-block">
              <img src={postImagePreview} alt="Preview" className="max-h-48 rounded-xl border border-pinkline object-cover" />
              <button
                type="button"
                onClick={() => { setPostImage(null); setPostImagePreview(null); }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-snow-dim hover:bg-error/20 hover:text-error-soft"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-snow-dim transition-colors hover:bg-hotpink/10 hover:text-hotpink"
              >
                <ImagePlus size={16} /> Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
              <span className="text-xs text-snow-dim">{body.length}/1000</span>
            </div>
            <Button type="submit" size="sm" disabled={posting || (!body.trim() && !postImage)}>
              {posting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} Post
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-snow-dim">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/40 py-20 text-center">
          <MessageSquare className="text-hotpink/40" size={32} />
          <p className="font-display text-xl text-snow">No posts yet</p>
          <p className="text-sm text-snow-dim">Be the first to start the conversation.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              profile={profile}
              expanded={expandedComments.has(post.id)}
              onToggleComments={() => toggleComments(post.id)}
              onDelete={onDeletePost}
              onCommentAdded={() => toggleComments(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Post card with comments ---------- */

function PostCard({
  post,
  user,
  profile,
  expanded,
  onToggleComments,
  onDelete,
  onCommentAdded,
}: {
  post: Post;
  user: { id: string } | null;
  profile: { is_admin?: boolean; permissions?: string[] } | null;
  expanded: boolean;
  onToggleComments: () => void;
  onDelete: (id: string) => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles!comments_user_id_fkey(display_name, avatar_url, tier)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as CommentRow[]);
    setLoadingComments(false);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);
  const commentCount = comments.length;
  const commenters = (() => {
    const seen = new Set<string>();
    const unique: { user_id: string; display_name: string; avatar_url: string | null }[] = [];
    for (const c of comments) {
      if (c.user_id && !seen.has(c.user_id) && c.profiles) {
        seen.add(c.user_id);
        unique.push({ user_id: c.user_id, display_name: c.profiles.display_name, avatar_url: c.profiles.avatar_url });
      }
    }
    return unique;
  })();

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('community-images').upload(path, file);
    if (upErr) return null;
    const { data: pub } = supabase.storage.from('community-images').getPublicUrl(path);
    return pub.publicUrl;
  };

  const submitComment = async (parentId: string | null) => {
    const isReply = parentId !== null;
    const text = isReply ? replyBody.trim() : commentBody.trim();
    const img = isReply ? replyImage : commentImage;
    if (!text && !img) return;
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (img) {
      imageUrl = await uploadImage(img);
      if (!imageUrl) {
        setSubmitting(false);
        return;
      }
    }
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, body: text, parent_id: parentId, image_url: imageUrl })
      .select('*, profiles!comments_user_id_fkey(display_name, avatar_url, tier)')
      .maybeSingle();
    setSubmitting(false);
    if (error) return;
    if (data) {
      setComments((prev) => [...prev, data as CommentRow]);
      if (isReply) {
        setReplyBody('');
        setReplyImage(null);
        setReplyImagePreview(null);
        setReplyingTo(null);
      } else {
        setCommentBody('');
        setCommentImage(null);
        setCommentImagePreview(null);
      }
      onCommentAdded();
    }
  };

  const deleteComment = async (id: string) => {
    const prev = comments;
    setComments((cur) => cur.filter((c) => c.id !== id && c.parent_id !== id));
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) setComments(prev);
  };

  const pickFile = (file: File | undefined, isReply: boolean) => {
    if (!file || file.size > 5 * 1024 * 1024) return;
    if (isReply) {
      setReplyImage(file);
      setReplyImagePreview(URL.createObjectURL(file));
    } else {
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <article className="rounded-2xl border border-pinkline bg-ink-100/60 p-5 transition-all duration-300 hover:border-hotpink/30 hover:shadow-glow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.profiles?.display_name ?? 'Member'} src={post.profiles?.avatar_url} size={36} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-snow">{post.profiles?.display_name ?? 'Member'}</span>
              {post.profiles?.tier === 'mentorship' && (
                <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-soft">
                  <Crown size={8} /> Mentorship
                </span>
              )}
            </div>
            <span className="text-xs text-snow-dim">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {post.user_id === user?.id ? (
          <button
            onClick={() => onDelete(post.id)}
            className="rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-error/10 hover:text-error-soft"
            aria-label="Delete post"
          >
            <Trash2 size={15} />
          </button>
        ) : hasPermission(profile, 'moderate_posts') ? (
          <button
            onClick={() => onDelete(post.id)}
            className="rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-error/10 hover:text-error-soft"
            aria-label="Remove post (moderator)"
            title="Remove post (moderator)"
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap leading-relaxed text-snow-muted">{post.body}</p>
      {post.image_url && (
        <img src={post.image_url} alt="Post attachment" className="mt-3 max-h-96 w-full rounded-xl border border-pinkline object-cover" />
      )}

      {/* Comment toggle with chat heads */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-pinkline/40 pt-3">
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-xs font-medium text-snow-dim transition-colors hover:text-hotpink"
        >
          <MessageSquare size={14} />
          {expanded ? 'Hide comments' : 'Comments'}
          {commentCount > 0 && (
            <span className="ml-0.5 rounded-full bg-hotpink/15 px-1.5 py-0.5 text-[10px] font-semibold text-hotpink">
              {commentCount}
            </span>
          )}
        </button>
        {commenters.length > 0 && !expanded && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {commenters.slice(0, 4).map((c) => (
                <div
                  key={c.user_id}
                  className="relative rounded-full ring-2 ring-ink-100"
                  style={{ zIndex: commenters.indexOf(c) }}
                >
                  <Avatar name={c.display_name} src={c.avatar_url} size={26} />
                </div>
              ))}
              {commenters.length > 4 && (
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-pinkline bg-ink-50 text-[10px] font-semibold text-snow-dim ring-2 ring-ink-100">
                  +{commenters.length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] text-snow-dim">
              {commentCount === 1 ? '1 reply' : `${commentCount} replies`}
            </span>
          </div>
        )}
      </div>

      {/* Comments section */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {loadingComments ? (
            <div className="flex items-center gap-2 text-snow-dim">
              <Loader2 className="animate-spin" size={14} /> Loading comments…
            </div>
          ) : (
            <>
              {topLevel.map((c) => (
                <div key={c.id} className="space-y-2">
                  <CommentItem
                    comment={c}
                    user={user}
                    profile={profile}
                    onDelete={deleteComment}
                    onReply={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                    isReplying={replyingTo === c.id}
                  />
                  {/* Reply form */}
                  {replyingTo === c.id && (
                    <CommentForm
                      body={replyBody}
                      setBody={setReplyBody}
                      imagePreview={replyImagePreview}
                      onPickImage={(f) => pickFile(f, true)}
                      onRemoveImage={() => { setReplyImage(null); setReplyImagePreview(null); }}
                      fileRef={replyFileRef}
                      onSubmit={() => submitComment(c.id)}
                      submitting={submitting}
                      placeholder="Write a reply…"
                      isReply
                    />
                  )}
                  {/* Replies */}
                  {repliesOf(c.id).map((r) => (
                    <div key={r.id} className="ml-8">
                      <CommentItem
                        comment={r}
                        user={user}
                        profile={profile}
                        onDelete={deleteComment}
                        isReply
                      />
                    </div>
                  ))}
                </div>
              ))}

              {/* New comment form */}
              <CommentForm
                body={commentBody}
                setBody={setCommentBody}
                imagePreview={commentImagePreview}
                onPickImage={(f) => pickFile(f, false)}
                onRemoveImage={() => { setCommentImage(null); setCommentImagePreview(null); }}
                fileRef={commentFileRef}
                onSubmit={() => submitComment(null)}
                submitting={submitting}
                placeholder="Write a comment…"
              />
            </>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------- Single comment ---------- */

function CommentItem({
  comment,
  user,
  profile,
  onDelete,
  onReply,
  isReplying,
  isReply,
}: {
  comment: CommentRow;
  user: { id: string } | null;
  profile: { is_admin?: boolean; permissions?: string[] } | null;
  onDelete: (id: string) => void;
  onReply?: () => void;
  isReplying?: boolean;
  isReply?: boolean;
}) {
  const canDelete = comment.user_id === user?.id || hasPermission(profile, 'moderate_posts');
  return (
    <div className="flex gap-2.5">
      <Avatar name={comment.profiles?.display_name ?? 'Member'} src={comment.profiles?.avatar_url} size={28} />
      <div className="flex-1">
        <div className="rounded-xl border border-pinkline/50 bg-ink-50/80 px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-snow">{comment.profiles?.display_name ?? 'Member'}</span>
              {comment.profiles?.tier === 'mentorship' && (
                <Crown size={9} className="text-gold-soft" />
              )}
              <span className="text-[10px] text-snow-dim">{timeAgo(comment.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              {!isReply && onReply && (
                <button
                  onClick={onReply}
                  className={`rounded p-1 text-snow-dim transition-colors hover:text-hotpink ${isReplying ? 'text-hotpink' : ''}`}
                  aria-label="Reply"
                  title="Reply"
                >
                  <CornerDownRight size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="rounded p-1 text-snow-dim transition-colors hover:bg-error/10 hover:text-error-soft"
                  aria-label="Delete comment"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-snow-muted">{comment.body}</p>
          {comment.image_url && (
            <img src={comment.image_url} alt="Comment attachment" className="mt-2 max-h-60 rounded-lg border border-pinkline object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Comment / reply form ---------- */

function CommentForm({
  body,
  setBody,
  imagePreview,
  onPickImage,
  onRemoveImage,
  fileRef,
  onSubmit,
  submitting,
  placeholder,
  isReply,
}: {
  body: string;
  setBody: (v: string) => void;
  imagePreview: string | null;
  onPickImage: (f: File | undefined) => void;
  onRemoveImage: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onSubmit: () => void;
  submitting: boolean;
  placeholder: string;
  isReply?: boolean;
}) {
  return (
    <div className={`flex gap-2.5 ${isReply ? 'ml-8' : ''}`}>
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none rounded-xl border border-pinkline bg-ink-50 px-3 py-2 text-[13px] text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none"
        />
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-pinkline object-cover" />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-snow-dim hover:bg-error/20 hover:text-error-soft"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] text-snow-dim transition-colors hover:text-hotpink"
          >
            <ImagePlus size={13} /> Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickImage(e.target.files?.[0])}
          />
          <Button type="button" size="sm" disabled={submitting || (!body.trim() && !imagePreview)} onClick={onSubmit}>
            {submitting ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
            {isReply ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}
