import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

type Page = 'home' | 'event-detail' | 'login' | 'signup' | 'dashboard' | 'admin';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user && (currentPage === 'dashboard' || currentPage === 'admin')) {
      setCurrentPage('login');
    }

    if (!loading && user && !isAdmin && currentPage === 'admin') {
      setCurrentPage('home');
    }
  }, [user, loading, currentPage, isAdmin]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-detail');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedEventId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      {currentPage === 'home' && <HomePage onEventClick={handleEventClick} />}

      {currentPage === 'event-detail' && selectedEventId && (
        <EventDetailPage
          eventId={selectedEventId}
          onBack={handleBackToHome}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}

      {currentPage === 'signup' && <SignupPage onNavigate={handleNavigate} />}

      {currentPage === 'dashboard' && user && (
        <DashboardPage onEventClick={handleEventClick} />
      )}

      {currentPage === 'admin' && user && isAdmin && <AdminPage />}
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
