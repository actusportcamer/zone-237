import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Calendar, MapPin, Tag, Send, Trash2, CircleDollarSign, UploadCloud } from 'lucide-react';
import moment from 'moment';
import DOMPurify from 'dompurify';

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface EventDetailProps {
  eventId: string;
  UpdateEvent?: (eventId: string) => void;
  onBack: () => void;
}

export default function EventDetail({ eventId, onBack, UpdateEvent }: EventDetailProps) {
  const { profile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
    loadComments();
    loadLikes();
  }, [eventId]);

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', eventId)
      .maybeSingle();

    if (!error && data) {
      setEvent(data);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const loadLikes = async () => {
    const { data: likes } = await supabase
      .from('likes')
      .select('id, user_id')
      .eq('event_id', eventId);

    setLikesCount(likes?.length || 0);

    if (profile && likes) {
      setIsLiked(likes.some(like => like.user_id === profile.id));
    }
  };

  const handleLike = async () => {
    if (!profile) return;

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);

        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert([{
            event_id: eventId,
            user_id: profile.id,
          }]);

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error.message);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          event_id: eventId,
          user_id: profile.id,
          content: newComment.trim(),
        }]);

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!profile) return;
    if (profile.id !== commentUserId && !profile.is_admin) return;

    if (!confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await loadComments();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateCardClick = () => {
    if (UpdateEvent) {
      UpdateEvent(event.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Event not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 text-orange-500 hover:text-orange-600 font-medium"
      >
        ← Back to Feed
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-white font-semibold text-lg">
              {event.profiles.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">@{event.profiles.username}</p>
              <p className="text-sm text-gray-500">
                {new Date(event.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-96 object-cover rounded-lg mb-6"
            />
          )}

          
          <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }} />

         <div className='flex justify-between'>
          <div className="flex flex-wrap gap-4 mb-6 text-gray-600">
            {event.location && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5" />
                <span>{event.location}</span>
              </div>
            )}
            {event.category && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Tag className="w-5 h-5" />
                <span>{event.category}</span>
              </div>
            )}
          </div>
          <div>
            {
              profile ? (
              <span>
                {
                  event.user_id === profile.id && (
                    <UploadCloud onClick={handleUpdateCardClick} />
                  )
                }
              </span>
              ) : (
                <span></span>
              )
            }
          </div>
         </div> 

          <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLike}
              disabled={!profile}
              className={`flex items-center gap-2 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              } disabled:opacity-50`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium text-lg">{likesCount}</span>
            </button>

            <div className="flex items-center gap-2 text-gray-500">
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium text-lg">{comments.length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

          {profile && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-white font-semibold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="mt-2 flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {comment.profiles.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">@{comment.profiles.username}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {moment(comment.created_at).fromNow()}
                        </span>
                        {profile && (profile.id === comment.user_id || profile.is_admin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
