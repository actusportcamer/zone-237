import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash2, Users, Calendar, MessageCircle, Shield } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  profiles: {
    username: string;
  };
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
  events: {
    title: string;
  };
}

export default function Admin() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'comments'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalComments: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadStats();
      loadEvents();
      loadUsers();
      loadComments();
    }
  }, [profile]);

  const loadStats = async () => {
    const [eventsRes, usersRes, commentsRes, likesRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('likes').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalEvents: eventsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalComments: commentsRes.count || 0,
      totalLikes: likesRes.count || 0,
    });
  };

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles (username)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (username),
        events (title)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadEvents();
      await loadStats();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await loadComments();
      await loadStats();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage and supervise <span className='text-orange-400 font-bold'>Zone 237</span> platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-orange-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalEvents}</span>
          </div>
          <p className="text-gray-600">Total Posts</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <p className="text-gray-600">Total Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <MessageCircle className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalComments}</span>
          </div>
          <p className="text-gray-600">Total Comments</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">❤️</span>
            <span className="text-3xl font-bold text-gray-900">{stats.totalLikes}</span>
          </div>
          <p className="text-gray-600">Total Likes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Comments
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'events' && (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      By @{event.profiles.username} • {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-gray-500 py-8">No events found</p>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">@{user.username}</h3>
                    {user.full_name && (
                      <p className="text-sm text-gray-600">{user.full_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.is_admin && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        Admin
                      </span>
                    )}
                    {user.id !== profile.id && (
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found</p>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                  <div className="flex-1">
                    <p className="text-gray-900">{comment.content}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      On event: {comment.events.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      By @{comment.profiles.username} • {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">No comments found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
