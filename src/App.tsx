import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import CreateEvent from './pages/CreateEvent';
import Profile from './pages/Profile';
import EventDetail from './pages/EventDetail';
import Admin from './pages/Admin';
import './App.css'
import ResetPassword from './pages/ResetPasword';
import UpdateEvent from './pages/UpdateEvent';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'feed' | 'create' | 'profile' | 'admin' | 'auth' | 'event' | 'update' | 'reset'>('feed');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    // Detect if Supabase redirected here for password recovery
    if (window.location.hash.includes("type=recovery")) {
      setCurrentPage("reset");
    }
  }, []);


  const handleNavigate = (page: string) => {
    setCurrentPage(page as any);
    setSelectedEventId(null);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage('event');
  };

  const handleUpdateClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage('update');
  };

  const handleEventCreated = () => {
    setCurrentPage('feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
  
        {currentPage === 'feed' && (
          <Feed onEventClick={handleEventClick} />
        )}
  
        {currentPage === 'create' && (
          <CreateEvent onEventCreated={handleEventCreated} />
        )}

        {currentPage === 'update' && (
          <UpdateEvent eventId={selectedEventId}  />
        )}
  
        {currentPage === 'profile' && (
          <Profile UpdateEvent={handleUpdateClick} />
        )}
  
        {currentPage === 'admin' && (
          <Admin />
        )}

        {currentPage === 'auth' && (
          <Auth />
        )}
  
        {currentPage === 'event' && selectedEventId && (
          <EventDetail
            eventId={selectedEventId}
            onBack={() => setCurrentPage('feed')}
            UpdateEvent={handleUpdateClick}
          />
        )}

        {currentPage === 'reset' && <ResetPassword />}
      </div>
    );
  }

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
