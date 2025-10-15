import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/EventCard';
import user from '../img/user.png'

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


interface FeedProps {
  onEventClick: (eventId: string) => void;
  UpdateEvent: (eventId: string) => void;
}

export default function Feed({ onEventClick, UpdateEvent }: FeedProps) {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [suggestEvents, setSuggestEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [totaluserlike, setTotalUserLike] = useState(0)

  const loadUserEvents = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setUserEvents(data);
    }
  };
  

  useEffect(() => {
    loadUserEvents();
  }, []);

  const loadSuggestEvents = async () => {

    const { data, error } = await supabase.rpc("get_random_events", { n:5 });

    if (error) {
      console.error("Error fetching random posts:", error);
      return [];
    }
      setSuggestEvents(data);
  };

  useEffect(() => {
    loadSuggestEvents();
  }, []);


  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error loading events:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadtotalLike = async () => {
   if (!profile) return;

   const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('user_id', profile.id);

  if (eventError) {
    console.error('Error fetching user events:', eventError);
    return;
  }

  const eventIds = events.map(e => e.id);

  console.log(eventIds)

  // Using head:true and count:'exact' to get only the count
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .in('event_id', eventIds);

  if (error) {
    console.error("Error loading likes:", error.message);
  } else {
    setTotalUserLike(count || 0); // count can be null, so default to 0
  }
  };

  useEffect(() => {
    if (profile) {
      loadtotalLike();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-4 flex h-screen overflow-hidden relative">
      {/* LEFT SIDEBAR (hidden on mobile) */}
  
      <aside className="hidden lg:block w-68 cursor-pointer bg-white border-gray-200 rounded-lg shadow-xl fixed left-8 top-40 h-fit m-2 p-4">
        <div className="bg-white mb-2">
        {
          profile ? (
        <>
          <div className="h-16 rounded-tl-md rounded-tr-md bg-gradient-to-r from-orange-400 to-green-500"></div>
          <div className="px-2 pb-2">
            <div className="flex justify-between items-start -mt-8 mb-2">
              <div className="bg-white rounded-full p-1 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-2xl font-bold text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
              <div className=''>
                <h1 className="text-sm font-bold text-gray-900">@{profile.username}</h1>
                 <div className="grid grid-cols-2 gap-6">
              <p className="text-xs font-semibold text-gray-400">
                {profile?.bio || "No bio available"}
              </p>

              <p className="text-xs font-semibold text-gray-400">
                Total Likes: <span className="">❤️</span>
                <span className="text-red-500"> {totaluserlike ?? 0} </span>
              </p>
            </div>
              </div>
          </div>
        </>
        ) : (
           <div className='flex gap-1'>
          <img src={user} className='w-12 h-12' />
          <div className='text-left mt-2'>
            <p className='text-sm font-medium text-gray-700'>Sign In to <span className='text-orange-500 font-semibold'>Zone 237</span></p>
            <h1 className='text-xs font-medium text-gray-400'>Comment and like</h1>
          </div>
        </div>
        )
        }
      </div>
        <div className="">
          {userEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl p-1 shadow-md overflow-hidden hover:shadow-lg flex transition-shadow mb-2">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-12 h-12 object-cover rounded-full border-4 border-blue-200"
                />
                <div className='mt-2 px-2'>
                <h3 className="text-xs font-semibold text-gray-900">{event.title}</h3>
                <p className="line-clamp-1 text-xs">{event.description}</p>
                </div>
            </div>
          ))}
        </div>
      </aside>
      {/* MAIN SCROLLABLE CENTER */}
      <main className="flex-1 overflow-y-auto scrollbar-hide md:scrollbar-default lg:mx-[300px]">
       <button className="md:hidden inline flex items-center space-x-2">
        {
          profile ? (
       <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-green-300 flex items-center justify-center text-white text-2xl font-bold">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className='mt-1 text-left'>
            <p className="text-sm font-semibold text-gray-900">@{profile.username}</p>
            <div className="grid grid-cols-2 gap-6">
              <p className="text-xs font-semibold text-gray-400">
                {profile?.bio || "No bio available"}
              </p>

              <p className="text-xs font-semibold text-gray-400">
                Total Likes: <span className="">❤️</span>
                <span className="text-red-500"> {totaluserlike ?? 0} </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex gap-1'>
          <img src={user} className='w-12 h-12' />
          <div className='text-left mt-2'>
            <p className='text-sm font-medium text-gray-700'>Sign In to <span className='text-orange-500 font-semibold'>Zone 237</span></p>
            <h1 className='text-xs font-medium text-gray-400'>Comment and like</h1>
          </div>
        </div>
      )}
      </button>
        <div className="max-w-2xl mx-auto py-2 space-y-2">
         {events.map((event) => (
          <EventCard key={event.id} event={event} onEventClick={onEventClick} />
        ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR (hidden on mobile) */}
      <aside className="hidden lg:block w-72 cursor-pointer bg-white border-gray-200 rounded-lg shadow-xl fixed right-8 top-40 h-fit m-2 p-2">
       <div className="flex items-center gap-3 mb-4">    
            <p className="font-semibold text-gray-900">@ Suggested Posts</p>
        </div>
        <div className="">
          {suggestEvents.map((event) => (
            <div
              key={event.id}  // Only if used inside a .map()
              onClick={() => onEventClick(event.id)}
              className="rounded-xl p-0.5 overflow-hidden flex space-x-2 transition-shadow hover:shadow-md cursor-pointer"
            >
              <span className='w-10'>
              <div className="w-[80px]">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-10 h-10 object-cover border-4 border-blue-200 rounded-full"
                />
              </div>
              </span>
              <div className="">
                <h3 className="text-xs font-semibold text-gray-900">{event.title}</h3>
                <p className="line-clamp-1 text-xs text-gray-600">{event.description}</p>
              </div>
            </div>

          ))}
        </div>
      </aside>
    </div>
  );
}
