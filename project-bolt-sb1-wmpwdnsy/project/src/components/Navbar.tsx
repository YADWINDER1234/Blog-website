import { Calendar, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type NavbarProps = {
  onNavigate: (page: string) => void;
  currentPage: string;
};

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <Calendar className="w-7 h-7" />
            <span>EventHub</span>
          </button>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className={`px-4 py-2 rounded-lg transition ${
                    currentPage === 'home'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition ${
                    currentPage === 'dashboard'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition ${
                      currentPage === 'admin'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
