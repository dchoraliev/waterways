import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { LegalPage } from './pages/LegalPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const path = window.location.pathname;

  if (path === '/terms' || path === '/privacy') {
    return (
      <div className="w-full min-h-screen">
        <LegalPage />
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="w-full min-h-screen">
        <Toaster />
        <Dashboard />
      </div>
    </AuthProvider>
  );
}
