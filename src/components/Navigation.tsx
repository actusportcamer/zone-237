import { Home, PlusCircle, User, Shield, LogOut, UserX2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../img/buzz237 logo.png'

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      window.location.reload();
      onNavigate('feed')
    }
  };

  return (
    <nav className="bg-white shadow-md font-semibold text-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
             <img src={logo} className='w-12 h-12' />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('feed')}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                currentPage === 'feed'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">Feed</span>
            </button>

            {
              profile && (
            <button
              onClick={() => onNavigate('create')}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                currentPage === 'create'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden md:inline">Create</span>
            </button>
            )}

            {
              !profile ? (
              <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-2 px-2 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <UserX2 className="w-5 h-5" />
                  <span className="hidden md:inline">Sign In</span>
                </button>
              ) : (<p></p>)
            }

            {profile?.is_admin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
            {
              profile && (
              <span className='flex gap-2'>
                <button
                  onClick={() => onNavigate('profile')}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                    currentPage === 'profile'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">Profile</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-2 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </span>
              )
            }
          </div>
        </div>
      </div>
    </nav>
  );
}
