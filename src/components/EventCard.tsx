import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Calendar, MapPin, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

interface EventCardProps {
  event: {
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
  };
  onEventClick?: (eventId: string) => void;
}

export default function EventCard({ event, onEventClick }: EventCardProps) {
  const { profile } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInteractions();
  }, [event.id, profile]);

  const loadInteractions = async () => {
    const { data: likes } = await supabase
      .from('likes')
      .select('id, user_id')
      .eq('event_id', event.id);

    const { data: comments } = await supabase
      .from('comments')
      .select('id')
      .eq('event_id', event.id);

    setLikesCount(likes?.length || 0);
    setCommentsCount(comments?.length || 0);

    if (profile && likes) {
      setIsLiked(likes.some(like => like.user_id === profile.id));
    }
  };

  const handleLike = async () => {
    if (!profile || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', profile.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{
            event_id: event.id,
            user_id: profile.id,
          }]);

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onEventClick) {
      onEventClick(event.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-white font-semibold">
            {event.profiles.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">@{event.profiles.username}</p>
            <p className="text-sx text-gray-500">
               {moment(event.created_at).fromNow()}
            </p>
          </div>
        </div>

        <div
          onClick={handleCardClick}
          className={onEventClick ? 'cursor-pointer' : ''}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h2>

          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}

          <p className="text-gray-700 mb-4 font-semibold whitespace-pre-wrap">{event.description}</p>

          <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
            )}
            {event.category && (
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {event.category}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            disabled={!profile || loading}
            className={`flex items-center gap-2 transition-colors ${
              isLiked
                ? 'text-red-500'
                : 'text-gray-500 hover:text-red-500'
            } disabled:opacity-50`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </button>

          <button
            onClick={handleCardClick}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{commentsCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
