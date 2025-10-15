import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, CreditCard as Edit2, Save, X, UploadCloud } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

interface EventProfileProps {
  UpdateEvent?: (eventId: string) => void;
}

export default function Profile({ UpdateEvent }: EventProfileProps) {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username,
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
      loadUserEvents();
    }
  }, [profile]);

  const loadUserEvents = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserEvents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      await refreshProfile();
      
      if (error) throw error;
      setIsEditing(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  


  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-green-500"></div>

        <div className=" px-4 sm:px-8 pb-8">
          <div className="flex justify-between items-start -mt-16 mb-6">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-4xl font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-20 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="mt-16 flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: profile.username,
                      full_name: profile.full_name || '',
                      bio: profile.bio || '',
                    });
                  }}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">@{profile.username}</h1>
              {profile.full_name && (
                <p className="text-sm text-gray-600 font-semibold">{profile.full_name}</p>
              )}
              <div className='flex gap-4 mt-1'>
                {profile.bio && (
                  <p className="text-xs font-medium text-gray-700 mb-2">{profile.bio}</p>
                )}
                {profile.is_admin && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-500 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Events</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {userEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                <div className='flex justify-between'>
                 <div className="flex flex-col gap-2 text-sm text-gray-500">
                  {event.category && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.category}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                 </div>
                 <div>
                  {
                    profile ? (
                    <span>
                      {
                        event.user_id === profile.id && (
                          <UploadCloud onClick={() => UpdateEvent(event.id)} />
                        )
                      }
                    </span>
                    ) : (
                      <span></span>
                    )
                  }
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {userEvents.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No events posted yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
